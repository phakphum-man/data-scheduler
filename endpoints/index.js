require('dotenv').config();
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const timediff = require('timediff');
const crypto = require("crypto");
const logger = require('../libraries/logger');

let activeTime = (timeTable, timeCurrent) => {
    const diff = timediff(timeTable, timeCurrent, 'YMDHmS');
    return (diff.hours === 0 && diff.minutes === 0)
};
module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true
        logger.info(`${moment().tz(process.env.TZ).format()}: Start API Scheduler`);
        return res.status(200).send(`Start API Scheduler`);
    });

    app.post('/everyTwentyMinute', async (req, res) => {
        // #swagger.ignore = true
        const iv = process.env.IV || await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
        const tables = [{
            runtime: "1998-01-01 09:00:00",
            url: `${process.env.DEPLOY_HOOK}&ref=${process.env.COMMIT}`,
            param: null,
            isTrigger: true
        },{
            runtime: "1998-01-01 09:20:00",
            url: `${process.env.API_KEEPER}/goldprice/excel?iv=${iv}`,
            param: null,
            isTrigger: true
        },{
            runtime: "1998-01-01 10:00:00",
            url: `${process.env.API_KEEPER}/livinginsider/chonburi?iv=${iv}`,
            param: null,
            isTrigger: true
        },{
            runtime: "1998-01-01 14:40:00",
            url: `${process.env.API_KEEPER}/livinginsider/rayong?iv=${iv}`,
            param: null,
            isTrigger: false
        },{
            runtime: "1998-01-01 13:40:00",
            url: `${process.env.API_KEEPER}/livinginsider/sellcost?iv=${iv}`,
            param: null,
            isTrigger: false
        }];
        //let schedules = tables;
        
        let tZone = process.env.TZ; //Target timezone from server
        let datetime = new Date();//Init this to a time if you don't want current time
        datetime = new Date(Date.parse(datetime.toLocaleString("en-US", {timeZone: tZone})));
        let schedules = tables.map(tb => ({
            runtime: tb.runtime,
            url: tb.url,
            param: tb.param,
            isTrigger: activeTime(tb.runtime, datetime)
        }));
        
        const runtimes = schedules.filter((tb)=> tb.isTrigger);
        const sleeper = (ms) => {
            return (x) => {
              return new Promise(resolve => setTimeout(() => resolve(x), ms));
            };
        }

        if(runtimes.length > 0){
            logger.info(`${moment().tz(process.env.TZ).format()}: Run schedule(${runtimes.length} jobs) ${runtimes[0].runtime}`);
            axios.get(runtimes[0].url,{
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "User-Agent": "axios 0.21.1"
                }
            }).then((schedule)=>{
                console.log(`${moment().tz(process.env.TZ).format()}: => ${schedule} done.`);
            })
            .catch((error)=>{
                console.error(error);
            });
        }
        
        return res.status(200).send({message: `success(${runtimes.length} jobs)`, data: (runtimes.length > 0)? timediff(runtimes[0].runtime, datetime, 'YMDHmS') : null });
    });

    app.get('/encrypt', (req, res) => {
        // #swagger.ignore = true
        const algorithm = process.env.ALGORITHM;

        const key = process.env.PRIVATE_KEY || crypto.randomBytes(32).toString('base64');

        const iv = Buffer.from(crypto.randomBytes(16), 'binary').toString('base64');
        
        //message to be encrypted
        var message = process.env.TO_ENCRYPT;
        
        const cipher = crypto.createCipheriv(algorithm, Buffer.from(key,'base64'), Buffer.from(iv, 'base64'));
        let encryptedData = cipher.update(message, "utf-8", "hex");
        encryptedData += cipher.final("hex");

        fs.writeFileSync(path.join(process.cwd(), "private.txt"), key, {
            encoding: "utf-8",
        });

        fs.writeFileSync(path.join(process.cwd(), "iv.txt"), iv, {
            encoding: "utf-8",
        });

        fs.writeFileSync(path.join(process.cwd(), "encryptedData.txt"), encryptedData, {
            encoding: "utf-8",
        });
        return res.status(200).send(encryptedData);
    });

    app.get('/decrypt', async (req, res) => {
        // #swagger.ignore = true

        // const algorithm = process.env.ALGORITHM;

        // const key = await fs.promises.readFile(path.join(process.cwd(), "private.txt"), 'utf8');
        // const iv = await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
        // const dataEncrypted = await fs.promises.readFile(path.join(process.cwd(), "encryptedData.txt"), 'utf8');

        // const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
        // let decryptedData = decipher.update(dataEncrypted, "hex", "utf-8")
        // decryptedData += decipher.final("utf8");
        
        // fs.writeFileSync(path.join(process.cwd(), "decryptedData.txt"), decryptedData, {
        //     encoding: "utf-8"
        // });
        // return res.status(200).send(decryptedData);
        return res.status(200).send("");
    });

    app.get('/iv', async (req, res) => {
        // #swagger.ignore = true
        const iv = process.env.IV || await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
        return res.status(200).send(iv);
    });
};

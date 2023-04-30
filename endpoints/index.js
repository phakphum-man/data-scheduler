require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const timediff = require('timediff');
const crypto = require("crypto");

let activeTime = (timeTable, timeCurrent) => {
    const diff = timediff(timeTable, timeCurrent, 'YMDHmS');
    return (diff.hours === 0 && diff.minutes === 0)
};
module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true
        return res.status(200).send(`Start API Scheduler`);
    });

    app.post('/everyThirtyMinute', async (req, res) => {
        // #swagger.ignore = true
        const iv = process.env.IV || await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
        const tables = [{
            runtime: "1998-01-01 15:30:00",
            url: `https://data-keeper.onrender.com/livinginsider/chonburi?iv=${iv}`,
            param: null
        },{
            runtime: "1998-01-01 14:00:00",
            url: `https://data-keeper.onrender.com/livinginsider/rayong?iv=${iv}`,
            param: null
        },{
            runtime: "1998-01-01 13:30:00",
            url: `https://data-keeper.onrender.com/livinginsider/sellcost?iv=${iv}`,
            param: null
        }];

        let tZone = 'Asia/Bangkok'; //Target timezone from server
        let datetime = new Date();//Init this to a time if you don't want current time
        datetime = new Date(Date.parse(datetime.toLocaleString("en-US", {timeZone: tZone})));
        let schedules = tables.map(tb => ({
            runtime: tb.runtime,
            url: tb.url,
            param: tb.param,
            isTrigger: activeTime(tb.runtime, datetime)
        }));

        const runtimes = schedules.filter((tb)=> tb.isTrigger);
        console.log(runtimes.length);
        runtimes.forEach((j) => {

            let jobUrl = j.url;
            axios.get(jobUrl)
            .then( oxioRes => {
                console.log(`${jobUrl} => ${oxioRes.data}`)
            })
            .catch(err => console.error(err));

        });

        return res.status(200).send({message: `success(${runtimes.length} jobs)`, data: timediff("1998-01-01 20:30:00", datetime, 'YMDHmS')});
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

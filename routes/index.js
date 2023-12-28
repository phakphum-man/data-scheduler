require('dotenv').config();
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const timediff = require('timediff');
const crypto = require("crypto");
const csrf = require('csurf');
let express = require('express');
const googleSheet = require("../libraries/googleSpreadSheet");
const googleDrive = require("../libraries/googleDrive");
const { getJsonForm } = require("../libraries/googleDriveJsonform");
const s3fs = require("../libraries/s3fs");
const line = require("../libraries/lineNotify");
const { generateAndWriteCSV } = require("../libraries/fakerWriteCsv");
const { getCardExpiryFromNextWeek } = require("../libraries/notion");
const { googleStoreKey, selfHostUrl, s3Path } = require('../libraries/googleSecret');
let router = express.Router();
let csrfProtection = csrf({ cookie: true })

let activeTime = (timeTable, timeCurrent) => {
  const diff = timediff(timeTable, timeCurrent, 'YMDHmS');
  return (diff.hours === 0 && diff.minutes === 0)
};

function escapeJsonForm(json){
  let strJson = JSON.stringify(json, function(key,value){
      if(typeof value === 'function'){
          return value.toString().replace(/\s+/g, ' ').replaceAll("\"","\"\"");
      }
      return value;
  }/*,3*/);
  strJson = strJson.replaceAll(/\"function(?:\s|)\(/g,"function (");
  strJson = strJson.replaceAll("}\"","}");
  strJson = strJson.replaceAll("\\\"\\\"","\"");
  return strJson;
}

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/csv/fake/:record', async function(req, res) {
  // ?f=https://drive.google.com/file/d/1BKeuWmNS8GAbKKAeYVimzOM52lDXT-90/view?usp=sharing
  if(req.params.record && req.query.f){
    let file_id_data = req.query.f;
    if(file_id_data.indexOf("/file/d/") > -1){
        const dns = file_id_data.slice(0, file_id_data.indexOf("/file/d/"));
        const fileId = file_id_data.replace(`${dns}/file/d/`, "");
        file_id_data = fileId.slice(0, fileId.indexOf("/"));
    }
    const url = `https://drive.google.com/uc?export=download&id=${file_id_data}`;
    const fileName = `output${(new Date()).toISOString().slice(0,19).replace("T","_").replaceAll(":","")}.csv`;
    await generateAndWriteCSV(req.params.record, url, fileName);
    return res.status(200).send(`write <a href="${req.protocol}://${req.get('host')}/s3/get/file?path=${s3fs.rootPath}fileservs/${fileName}">${fileName}</a> done!, you can see all files <a href="${req.protocol}://${req.get('host')}/s3/get/files?path=${s3fs.rootPath}fileservs">here</a>`);
  }
  return res.status(404).send();
});

router.get('/card/notify', async function(req, res) {
  const notifies = [7,4,2,1];
  const cards = await getCardExpiryFromNextWeek();

  if(cards && cards.length > 0) {
    notifies.forEach(function(d){
      const dateNow = moment(/*"2024-05-18"*/).tz(process.env.TZ).add(d,'day').format("YYYY-MM-DD");
      const prev3Days = cards.filter(x => x.ExpireDate.date.start === dateNow);
      if(prev3Days && prev3Days.length > 0){
        //for loop : send line notification
        prev3Days.forEach(card => {
          let title = '';
          let cardName = '';
          if(card.Name.title && card.Name.title.length > 0){
            title = card.Name.title[0].text.content;
          }
          if(card.CardName.rich_text && card.CardName.rich_text.length > 0){
            cardName = card.CardName.rich_text[0].text.content;
          }
          console.log(`แจ้งตือน ${title} ${cardName} หมดอายุวันที่ ${moment(card.ExpireDate.date.start, "YYYY-MM-DD").format("D MMMM YYYY")}(คงเหลือ ${d} วัน)`);

          const infos = [
              "",
              `แจ้งตือน ${title} ${cardName}`,
              `หมดอายุวันที่ ${moment(card.ExpireDate.date.start, "YYYY-MM-DD").format("D MMMM YYYY")}`,
              `(คงเหลือ ${d} วัน)`
          ];
          line.sendMessage(process.env.LINE_TOKEN, `${moment().format('dddd, Do MMMM YYYY')}\n${infos.join("\n")}`);
        });
        //return res.status(200).send(cards);
      }
    });
  }

  return res.status(200).send(/*cards*/`active notify card`);
});

router.post('/everyTwentyMinute', async (req, res) => {
  // #swagger.ignore = true
  const iv = process.env.IV || await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
  const tables = [
      {
        runtime: "1998-01-01 17:20:00",
        url: `${req.protocol}://${req.get('host')}/card/notify`,
        param: null,
        isTrigger: true
      }
  // {
  //     runtime: "1998-01-01 06:00:00",
  //     url: `${process.env.DEPLOY_HOOK}&ref=${process.env.COMMIT}`,
  //     param: null,
  //     isTrigger: true
  // },
  // {
  //     runtime: "1998-01-01 17:40:00",
  //     url: `${process.env.DEPLOY_HOOK}&ref=${process.env.COMMIT}`,
  //     param: null,
  //     isTrigger: true
  // },
  // {
  //     runtime: "1998-01-01 18:00:00",
  //     url: `${process.env.API_KEEPER}/goldprice/line?iv=last`,
  //     param: null,
  //     isTrigger: true
  // },
  // {
  //     runtime: "1998-01-01 09:40:00",
  //     url: `${process.env.API_KEEPER}/goldprice/line`,
  //     param: null,
  //     isTrigger: true
  // },
  // {
  //     runtime: "1998-01-01 15:00:00",
  //     url: `${process.env.API_KEEPER}/goldprice/line`,
  //     param: null,
  //     isTrigger: true
  // },
  // {
  //     runtime: "1998-01-01 07:00:00",
  //     url: `${process.env.API_KEEPER}/livinginsider/chonburi?iv=${iv}`,
  //     param: null,
  //     isTrigger: true
  // },
  // {
  //     runtime: "1998-01-01 09:00:00",
  //     url: `${process.env.API_KEEPER}/livinginsider/rayong?iv=${iv}`,
  //     param: null,
  //     isTrigger: false
  // },
  // {
  //     runtime: "1998-01-01 08:00:00",
  //     url: `${process.env.API_KEEPER}/livinginsider/sellcost?iv=${iv}`,
  //     param: null,
  //     isTrigger: false
  // }
  ];
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
      console.log(`${moment().tz(process.env.TZ).format()}: Run schedule(${runtimes.length} jobs) ${runtimes[0].runtime}`);
      console.log(`${runtimes[0].url}`);
      axios.get(runtimes[0].url,{
          headers: {
            Accept: "application/json, text/plain, */*",
            "User-Agent": "axios 0.21.1"
          }
      }).then((schedule)=>{
          console.log(`${moment().tz(process.env.TZ).format()}: => ${schedule.data} done.`);
      })
      .catch((error)=>{
          console.error(error);
      });
  }
  
  return res.status(200).send({message: `success(${runtimes.length} jobs)`, data: (runtimes.length > 0)? timediff(runtimes[0].runtime, datetime, 'YMDHmS') : null });
});

router.get('/encrypt', (req, res) => {
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

router.get('/decrypt', async (req, res) => {
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

router.get('/iv', async (req, res) => {
  // #swagger.ignore = true
  const iv = process.env.IV || await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
  return res.status(200).send(iv);
});

router.get('/form', csrfProtection, async function(req, res, next) {
  let schema = {};
  let form = [];

  const viewform = req.query.f;
  const csrf = req.csrfToken();
  const jsonFormData = await getJsonForm(viewform, csrf, req.protocol, req.get('host'));
  if(jsonFormData != null) {
    schema = jsonFormData.schema;
    form = jsonFormData.form;
  }else{
    return res.status(404).send("Not Found");
  }
  /** begin csrfToken **/
  schema = Object.assign({}, schema, {
    f: {
      type: 'string',
      title: 'form',
      default: viewform
    },
    _csrf: {
      type: 'string',
      title: 'csrfToken',
      default: req.csrfToken()
    }
  });
  form.push({ "type": "hidden", "key": "f"});
  form.push({ "type": "hidden", "key": "_csrf"});
  /** end csrfToken **/

  form.push({ "type": "submit", "title": "Save"});

  let onSubmit = function (errors, values) {
    if (errors) {
      $('#res').html('<p>Error: '+ errors + '</p>');
      return;
    } else {
      $.ajax({
        url: '/create',
        type : "POST",
        data: values,
        success : function(result) {
          $('#res').html(result);
        },
        error: function(xhr, resp, text) {
          console.log(xhr, resp, text);
        }
      });
      return;
    }
  };
  
  let jsonForm = { schema, form, onSubmit };
  res.render('dynamic-form/index', { title: 'Dynamic form', jsonForm });
});

router.get('/list', async (req, res, next) =>{
  const ss =  await fs.promises.readFile(path.join(process.cwd(), "db.json"), 'utf8');
  const query = JSON.parse(ss);
  res.render('dynamic-form/list', { title: 'List pug mixin "_tableRow.pug"', employees: query.results });
});

router.post('/create', csrfProtection, async function(req, res) {
  const data = req.body;
  if(data && data.f){
    const viewform = data['f'];
    const jsonFormData = await getJsonForm(viewform, csrf, req.protocol, req.get('host'));
    const values = Object.keys(jsonFormData.schema).map(k => {
      return { [k]: !data[k]?null:data[k] };
    })
    res.send('data is being processed');
    return;
  }
  res.status(404).send('404 Not Found')
});
router.post('/gg',function(req, res) {
  const path = req.query.path;
  const key = req.query.key;
  const iv = req.query.iv;
  const content = req.body;
  if(!path || key != process.env.PRIVATE_KEY || iv != process.env.IV ||!content)
  {
    return res.send(404);
  }
  googleStoreKey(path, JSON.stringify(content));
  res.send('data is being processed')
});

router.get('/getsheet', async (req, res, next) => {
  const opt = {
    spreadsheetId: '1GkRmoWh6d2EKJPFe9IoXQ7QoOK_8erQSvJYNbtN_Vjc',
    title: 'Sheet1'
  };
  
  //await googleSheet.insertItem(opt.spreadsheetId, opt.title, {id:3,name:"Peter"});
  let data =  await googleSheet.getItem(opt.spreadsheetId, opt.title, 'A', 3);
  res.send(googleSheet.values(data,'*'));
  //res.send(data.rowId?.toString());
});

const downloadFile = async (fileId) => {
  const drive = await googleDrive();
  return new Promise((resolve, reject) => {
    drive.files.get(
      {
        auth: auth,
        fileId: fileId,
        alt: "media",
        supportsAllDrives: true
      },
      { responseType: "stream" },
      function(err, { data }) {
        if (err) {
          reject("The API returned an error: " + err);
        }
        let buf = [];
        data.on("data", function(e) {
          buf.push(e);
        });
        data.on("end", function() {
          const buffer = Buffer.concat(buf);
          resolve(buffer);
        });
      }
    );
  })
}
router.get('/gdrive/:id', csrfProtection, async (req, res, next) => {
  //url  => '/gdrive/1vSMNx70fbFgvzH1ZQ0pvcwGQUVaZxHWK?file=/jsonforms/form-schema.json&_csrf=xxxxxxx'
  const file = req.query.file;
  const isOverwrite = (req.query.isflush)?req.query.isforce == "1": false;
  const result = await googleDrive.getFile(req.params.id, file, isOverwrite); //downloadFile(req.params.id);
  return res.send(result);
});
router.get('/s3/get/files', async (req, res, next) => {
  const path = req.query.path;
  if(!path)
  {
    return res.send(404);
  }
  const files = s3fs.getFileList(path);
  res.json(files);
});
router.get('/s3/get/file', async (req, res) => {
  const path = req.query.path;
  if(!path)
  {
    return res.send(404);
  }
  const fileContent = s3fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
  res.status(200).send(fileContent);
});
router.get('/s3/clear/files', async (req, res, next) => {
  const filePath = req.query.path;
  if(!filePath)
  {
    return res.send(404);
  }
  const files = s3fs.getFileList(filePath);
  files.forEach((file)=>{
    const f = path.join(filePath, file);
    s3fs.deleteFile(f);
  })
  
  res.json({"success": true});
});
router.get('/s3/delete/file', async (req, res, next) => {
  const file = req.query.file;
  if(!file)
  {
    return res.send(404);
  }
  s3fs.deleteFile(file);
  res.json({"success": true});
});
router.get('/get/files', async (req, res, next) => {
  const files = await googleDrive.getFiles();
  res.json(files);
});

module.exports = router;

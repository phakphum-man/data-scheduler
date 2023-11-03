require('dotenv').config();
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const timediff = require('timediff');
const crypto = require("crypto");
const csrf = require('csurf');
let express = require('express');
const { title } = require('process');
const googleSheet = require("../libraries/googleSpreadSheet");
const googleDrive = require("../libraries/googleDrive");
const s3fs = require("../libraries/s3fs");
const { googleStoreKey, s3Path } = require('../libraries/googleSecret');
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
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/everyTwentyMinute', async (req, res) => {
  // #swagger.ignore = true
  const iv = process.env.IV || await fs.promises.readFile(path.join(process.cwd(), "iv.txt"), 'utf8');
  const tables = [{
      runtime: "1998-01-01 06:00:00",
      url: `${process.env.DEPLOY_HOOK}&ref=${process.env.COMMIT}`,
      param: null,
      isTrigger: true
  },
  {
      runtime: "1998-01-01 17:40:00",
      url: `${process.env.DEPLOY_HOOK}&ref=${process.env.COMMIT}`,
      param: null,
      isTrigger: true
  },
  {
      runtime: "1998-01-01 18:00:00",
      url: `${process.env.API_KEEPER}/goldprice/line?iv=last`,
      param: null,
      isTrigger: true
  },
  {
      runtime: "1998-01-01 09:40:00",
      url: `${process.env.API_KEEPER}/goldprice/line`,
      param: null,
      isTrigger: true
  },
  {
      runtime: "1998-01-01 15:00:00",
      url: `${process.env.API_KEEPER}/goldprice/line`,
      param: null,
      isTrigger: true
  }
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
          console.log(`${moment().tz(process.env.TZ).format()}: => ${schedule} done.`);
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

  const csrf = req.csrfToken();
  const viewform = req.query.f;
  const gdrive_files = await googleDrive.getFiles();
  const formItems = gdrive_files.filter((f) =>f.name === viewform); 

  if(formItems.length > 0){
    const selectItems = formItems[0].children;
    const layoutJs = selectItems.filter((f) =>f.name.toString().endsWith("-layout.json"));
    if(layoutJs.length > 0){
      const getLayout = await axios.get(`https://${req.get('host')}/gdrive/${layoutJs[0].id}?file=${s3Path}jsonforms/${layoutJs[0].name}&_csrf=${csrf}`);
      form = getLayout.data;
    }
    const schemaJs = selectItems.filter((f) =>f.name.toString().endsWith("-schema.json"));
    if(schemaJs.length > 0){
      const getShema = await axios.get(`https://${req.get('host')}/gdrive/${schemaJs[0].id}?file=${s3Path}jsonforms/${schemaJs[0].name}&_csrf=${csrf}`);
      schema = getShema.data;
    }
  }else{
    return res.status(404).send("Not Found");
  }
  /** begin csrfToken **/
  schema = Object.assign({}, schema, {
    _csrf: {
      type: 'string',
      title: 'csrfToken',
      default: req.csrfToken()
    }
  });
  form.push({ "type": "hidden", "key": "_csrf"});
  /** end csrfToken **/

  form.push({ "type": "submit", "title": "Save"});

  let onSubmit = function (errors, values) {
    if (errors) {
      $('#res').html('<p>Error: '+ errors + '</p>');
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

router.post('/create', csrfProtection, function(req, res) {
  res.send('data is being processed')
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
router.get('/s3/deletefile', async (req, res, next) => {
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

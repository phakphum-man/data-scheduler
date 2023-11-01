const {google} = require('googleapis');
const { JWT } = require("google-auth-library");
const crypto = require("crypto");
require('dotenv').config();
const fs = require('@cyclic.sh/s3fs')(process.env.CYCLIC_BUCKET_NAME);
const keys = {
  client_email: process.env.GG_CLIENT_EMAIL,
  private_key: process.env.GG_PRIVATE_KEY
};

const googleDrive = async () => {
  const algorithm = process.env.ALGORITHM;

  const key = process.env.PRIVATE_KEY;
  const iv = process.env.IV;
  const dataEncrypted = keys.private_key;

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
  let decryptedData = decipher.update(dataEncrypted, "hex", "utf-8")
  decryptedData += decipher.final("utf8");

  const auth = new JWT({
      email: keys.client_email,
      key: decryptedData,
      scopes: [
          "https://www.googleapis.com/auth/drive",
          "https://www.googleapis.com/auth/drive.file"
      ]
  });
  // Instance of google Drive
  const googleDriveV3 = google.drive({ version: "v3", auth: auth });
  return googleDriveV3;
};

const getFiles = async () => {
    const drive = await googleDrive();
    const folderService = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: "files(id,name,parents),nextPageToken",
    });
  
    const fileService = await drive.files.list({
      q: "mimeType!='application/vnd.google-apps.folder'",
      fields: "files(id,name,parents),nextPageToken",
    });
  
    let items = [];
    let fileIds = [];
    folderService.data.files.forEach(item => {
      if(item.parents){
        const files = fileService.data.files.filter((child) => child.parents[0] === item.id).map((child) => ({id: child.id, name: child.name, type: 'file'}));
        Array.prototype.push.apply(fileIds, files.map(child => child.id));
        items.push({id: item.id, name: item.name, type: 'folder', children: files});
      }
    });
    const fileRoots = fileService.data.files.filter((child) => !fileIds.includes(child.id)).map((child)=>({id: child.id, name: child.name, type: 'file'}));
    Array.prototype.push.apply(items, fileRoots);
    return items;
}

const getFile = async (fileId, filePath) => {
    const drive = await googleDrive();
    const filePromise = new Promise((resolve, reject) => {
        drive.files.get({
            fileId: fileId,
            alt: "media",
            supportsAllDrives: true
          },
          { responseType: "stream" },
          function(err, result) {
            if (err) {
              reject("The API returned an error: " + err);
              return;
            }
            //console.log(result)
            const data = result.data;
            let buf = [];
            data.on("data", function(e) {
              buf.push(e);
            });
            data.on("end", function() {
              const buffer = Buffer.concat(buf);
              resolve(buffer);
            });
        });
    });
    await filePromise.then((buffer) => {
        //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
        fs.writeFileSync(filePath, buffer);
    });
    const json = JSON.parse(fs.readFileSync(filePath));
    return json;
}

const deleteFile = (filePath) => {
    //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
    fs.unlinkSync(filePath);
}

const getFileList = (filePath) => {
    //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
    return fs.readdirSync(filePath);
}

module.exports = { getFiles, getFile, deleteFile, getFileList };
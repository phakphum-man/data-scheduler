const {google} = require('googleapis');
const { JWT } = require("google-auth-library");
require('dotenv').config();
const fs = require('@cyclic.sh/s3fs')(process.env.CYCLIC_BUCKET_NAME);
const keys = {
  client_email: process.env.GG_CLIENT_EMAIL,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDEjqSPUGlFeFAu\njxDVDCcagpg2HrQo6EakXu3lluMprlMdDbkiKrLcDIevGXUEsCH2Ovbm4Lt96fUD\nKQQaKztw3DrKwA3Qz0GQyFf3kHqVxnYdF9lIJOYYruekDar/Qgcr5UIlzshShTwR\nJGZFhOHvxtgWjW/SulUpreR5mUHg+z5gcjjLq6v5I5LR0x11LdCSa2/0JiADwxUs\n2RRwD13rQ4jFcrzMdhrgj4r1vClf373stHRP1h4kDVEP4EeiXhNZ36qyGC2JX+mJ\nevdOcMJp7e4/7CaqU5ditKs3UqI9OqnqSglqqIEFxOEvvZH7O6LQGbDOpqLrf2Rl\nBhWDVFILAgMBAAECggEAQX3XxerAkMWkTccckCgi9VnTNqEnXUP7mbQJp0iNuysb\nBWC3sXMxslE4enbMfznirwT5lHcH8c3c9ecaN0/1V8cBjeHNGKieC4w9hz7sIXCF\nlW8HVlr5EfthMk/djHynIBCc6DUMmTZMi9epfftnPrnt8SHCQyAT1TXcHUob4cav\nUmJtfdCnn9xuv3H0IxA4nYcMAK1VoFtjcUIyA1g92l3nZKCkM+g7D0z0ZXkJTiYj\nF1lazOepKw1ivcIIlv27YoewI9pyFZ1D0IWgpVerzUHffrl0ZbEiAdf480GJlNxk\nwf/Xaulf931uQbRZXl6bJA60YKCXlm6LHwqfz5qnDQKBgQDsboJPMxKO3atd5uXl\nhFGbKN+etAgyYtp/qK4fn8n/qHHt+nilJgepUd3iz7uoVZeLcw6qmWKdVdro6FWy\nYOzbDPgB82tHVxeGk41EfP5uh3EalwuJJeb5IMA9dFuhkUJxs1OV+fOqYBy6ANuH\nt56WpAH2+lNEr0xB2Rz0q50m1QKBgQDU00b9e22nykchgsjVbZyMSUr98xJxB2+n\nGYwBi3f7aEK1uKuYCJNNeN1alLCp8PW/uE9v014c3zaBssErXOgY+mBlu51TRWTR\nHfiEbzw12ZfhtAnr7ZnqWWbquzc8zv/rp9vW7z8PUe3LJvNm14pvtugPFyfglp8a\nEEcYAx3FXwKBgQCdNlZbx4Adk3RxuilAVp3U6HbZlqikqGrV3Bn8WUn+P8mSDqzO\nU91gT1mVicAkjNV6GoW0Fs4mBILNwD/LnvugJJ183pmFFHpGODMFSX/9iv5AShOX\nnKZbHdX2hzqu0mI2LKH15gCKV+KCJDPVqNlBHclYqtdXoqC4YGAKqVqUCQKBgQCa\n7I3B2gax3Oq4tzaxPtB1wqjHghlLlEkvz8X+HeOibHwbQqoOyzdHbxNba9/KZbDO\n9kFFOw1IYSiRc2lwwnnmLOTdSZy10E8adwHAjiS7YoFQeLm8N8MSODBV8SC9sEXV\n6uR6asBxy4cZmmoW1BJfTjtRON77e0moNG88SJB0awKBgQCWAH4qO1FJ+QJsM6xR\nz232cJ0TuKagD/AP9pNihcx/fkAYl41n1A7bdMJX4cLiWZ45F8BdHcx+aQnZZieB\nPfwwEHS8SkcjvGZeyv4/sd7ouxnYqSFas6aWkzrd7DZkt+QxWyxjriQdaIOpjlbK\nLt422UM0N70TJrCmo8YCt9izLQ==\n-----END PRIVATE KEY-----\n"/*`-----BEGIN PRIVATE KEY-----\n${process.env.GG_PRIVATE_KEY}\n-----END PRIVATE KEY-----\n`*/
};

const googleDrive = async () => {
    const auth = new JWT({
        email: keys.client_email,
        key: keys.private_key,
        scopes: [
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/drive.file"
        ]
    });
    console.log(keys.client_email);
    console.log(keys.private_key);
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
            console.log(result)
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
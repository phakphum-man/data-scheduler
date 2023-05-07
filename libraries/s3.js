'use strict';
require('dotenv').config();
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

function upload(data){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'logs/filelogger.log',
        Body: data
    };

    s3.upload(params, (err) => {
        console.log('s3 upload error:: \n', err)
    })
}

async function getlog(){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'logs/filelogger.log'
    };
    return await s3.getObject(params).promise();
}
module.exports = {
    upload: upload,
    getlog: getlog
};
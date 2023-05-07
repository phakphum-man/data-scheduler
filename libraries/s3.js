'use strict';
require('dotenv').config();
const AWS = require('aws-sdk')

const s3 = new AWS.S3()

function write(data){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'logs/filelogger.log',
        Body: data
    };

    s3.upload(params, (err) => {
        console.log('s3 write error:: \n', err)
    })
}

async function getlog(){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'logs/filelogger.log'
    };
    return await s3.getObject(params).promise();
}

async function deletelog(){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'logs/filelogger.log'
    };
    return await s3.deleteObject(params).promise();
}

module.exports = {
    write: write,
    getlog: getlog,
    deletelog: deletelog
};
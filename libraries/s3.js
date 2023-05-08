'use strict';
require('dotenv').config();
const AWS = require('aws-sdk');

require("aws-sdk/lib/maintenance_mode_message").suppress = true;

const s3 = new AWS.S3();

function write(data){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'logs/filelogger.log',
        Body: data
    };

    s3.putObject(params, (err) => {
        console.log('s3 write error:: \n', err)
    })
}

async function getAlllog(){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Prefix: 'logs'
    };
    return await s3.listObjectsV2(params).promise();
}

async function getlog(filename){
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: `logs/${filename}`
    };
    return await s3.getObject(params).promise();
}

async function deletelog(filename){
    //filelogger.log
    const params = {
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: `logs/${filename}`
    };
    return await s3.deleteObject(params).promise();
}

module.exports = {
    getAlllog: getAlllog,
    write: write,
    getlog: getlog,
    deletelog: deletelog
};
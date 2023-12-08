require('dotenv').config();
const express = require('express');
const router = express.Router();
const { runQueueJobs } = require("../libraries/jobBullMq"); 

router.get('/', async(req, res) => {
    const job = await runQueueJobs({ fileData: data, extension: "pdf", fileTemplate: template, reportType: reportType, inputData: inputData, createBy: "system-online" });
    return res.status(200).send(`Add Up Queue ${job.id}`);
});
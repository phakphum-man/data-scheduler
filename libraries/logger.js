'use strict';
require('dotenv').config();
const { createLogger, format, transports } = require("winston");
const { S3StreamLogger } = require('s3-streamlogger');

const env = process.env.NODE_ENV || 'development';

const timezoned = () => {
  return new Date().toLocaleString('en-US', {
      timeZone: process.env.TZ
  });
};

const s3_stream = new S3StreamLogger({
  bucket: process.env.CYCLIC_BUCKET_NAME,
  folder: 'logs'
});

const s3Transport = new (transports.Stream)({
  stream: s3_stream
});

const logger = createLogger({
    // change level if in dev environment versus production
    level: env === 'development' ? 'debug' : 'info',
    format: format.combine(
        format.timestamp({
          format: timezoned//'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.Console({
          level: 'info',
          format: format.combine(
            format.colorize(),
            format.printf(
              info => `${info.timestamp} ${info.level}: ${info.message}`
            )
          )
        }),
        s3Transport
      ]
});

module.exports = logger;
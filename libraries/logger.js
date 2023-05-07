'use strict';
require('dotenv').config();
const { createLogger, format, transports } = require("winston");
const S3Transport = require("winston-s3-transport");

const env = process.env.NODE_ENV || 'development';

const timezoned = () => {
  return new Date().toLocaleString('en-US', {
      timeZone: process.env.TZ
  });
};

const s3Transport = new S3Transport({
  s3ClientConfig: {
    region: process.env.AWS_REGION,
  },
  s3TransportConfig: {
    bucket: process.env.CYCLIC_BUCKET_NAME,
    group: (logInfo) => {
      // Group logs with `userId` value and store them in memory. 
      // If the 'userId' value does not exist, use the `anonymous` group.
      return logInfo?.message?.userId || "anonymous";
    },
    bucketPath: () => {
      // The bucket path in which the log is uploaded. 
      // You can create a bucket path by combining `groupId`, `timestamp`, and `uuid` values.
      return `logs/filelogger.log`;
    },
  },
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
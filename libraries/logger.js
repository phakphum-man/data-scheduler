'use strict';

const { createLogger, format, transports } = require("winston");
const s3 = require('../libraries/s3');

const env = process.env.NODE_ENV || 'development';

const timezoned = () => {
  return new Date().toLocaleString('en-US', {
      timeZone: process.env.TZ
  });
}
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
        })
      ]
});

logger.on('data', (chunk => { // log listener
  s3.write(JSON.stringify(chunk)) // call s3 uploader and pass stringyfied json log
}));

module.exports = logger;
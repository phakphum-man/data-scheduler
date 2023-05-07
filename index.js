require('dotenv').config();
const app = require('express')();
const http = require('http');

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const protocol = process.env.HTTPS === 'true' ? "https" : "http";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

http.createServer(app).listen(port);
console.log("Environment is %s", ((process.env.NODE_ENV)? process.env.NODE_ENV : "Production"));
console.log("Listening at: %s://%s:%s/", protocol, host, port);

require('./endpoints/index')(app);
require('./endpoints/logs')(app);
'use strict';
const s3 = require('../libraries/s3');

module.exports = function (app) {

    app.get('/log', async (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'Endpoint download file.'
        // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

        const s3File = await s3.getlog();

        /* #swagger.responses[200] = { 
               description: 'File Content.' 
        } */
        res.set('Content-type', s3File.ContentType)
        res.send(s3File.Body.toString()).end();
    });

    app.delete('/log', async (req, res) => {
      // #swagger.tags = ['File']
      // #swagger.description = 'Endpoint download file.'
      // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

      const contentfile = await s3.deletelog();

      /* #swagger.responses[200] = { 
             description: 'File Content.' 
      } */
      return res.status(200).send(contentfile);
  });
}
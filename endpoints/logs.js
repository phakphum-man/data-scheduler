'use strict';
const s3 = require('../libraries/s3');

module.exports = function (app) {

    app.get('/log', async (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'Endpoint download file.'
        // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

        try{
          const s3File = await s3.getlog();
          res.set('Content-type', s3File.ContentType)
          res.send(s3File.Body.toString()).end();
        }
        catch(error)
        {
          if (error.code === 'NoSuchKey') {
            console.log(`No such key`);
            res.status(404).send("file not found")
          } else {
            console.log(error)
            res.sendStatus(500).end()
          }
        }
        /* #swagger.responses[200] = { 
               description: 'File Content.' 
        } */
        
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
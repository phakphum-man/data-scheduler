'use strict';
const s3 = require('../libraries/s3');

module.exports = function (app) {

  app.get('/logs', async (req, res) => {
      // #swagger.tags = ['File']
      // #swagger.description = 'Endpoint download file.'
      // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

      try{
        const data = await s3.getAlllog();
        res.status(200).send(data.Contents).end();
      }
      catch(error)
      {
        console.log(error)
        res.sendStatus(500).end()
      }
      /* #swagger.responses[200] = { 
            description: 'File Content.' 
      } */
      
  });

  app.get('/log/:filename', async (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'Endpoint download file.'
        // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

        try{
          const f = req.params.filename;
          const s3File = await s3.getlog(f);
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

  app.delete('/log/:filename', async (req, res) => {
    // #swagger.tags = ['File']
    // #swagger.description = 'Endpoint download file.'
    // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }
    const f = req.params.filename;
    const contentfile = await s3.deletelog(f);

    /* #swagger.responses[200] = { 
            description: 'File Content.' 
    } */
    return res.status(200).send(contentfile);
  });
}
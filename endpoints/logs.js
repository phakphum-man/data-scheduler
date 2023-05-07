const fs = require('fs');
const path = require('path');

module.exports = function (app) {
    app.get('/logs', (req, res) => {
      // #swagger.tags = ['File']
      // #swagger.description = 'split file.'
  
      const selfPath = path.dirname(__dirname);
      const rootPath = selfPath.replace(`/${selfPath}`,"");
      const directoryPath = `${rootPath}/logs/`;
  
      if(fs.existsSync(directoryPath)){
          
        fs.readdir(directoryPath, function (err, files) {
          //handling error
          if (err) {
              return console.log('Unable to scan directory: ' + err);
          } 
          return res.status(200).send({ data: files});
        });
      }
      else
      {
          return res.status(404).send({ data: "File Not found!"});
      }
      /* #swagger.responses[200] = { 
             schema: { type: 'array' },
             description: 'expected result.' 
      } 
          #swagger.responses[404] = { 
             schema: { data: 'string' },
             description: 'File not found.' 
      }
      */
    });

    app.get('/log/:name', (req, res) => {
        // #swagger.tags = ['File']
        // #swagger.description = 'Endpoint download file.'
        // #swagger.parameters['name'] = { type: 'string', description: 'name is required.' }

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        const sourcefile = `${rootPath}/logs/${req.params.name}`;

        /* #swagger.responses[200] = { 
               description: 'File Content.' 
        } */
        return res.download(sourcefile);
    });
}
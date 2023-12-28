const got = require('got');
const csv = require('csv-parser');
const faker = require('./faker');
const fs = require('./s3fs');
const createCsvWriter = require('csv-writer').createObjectCsvStringifier;

// Function to parse the parameters and generate the data
async function generateAndWriteCSV(numRecords, url, filename) {

  let results = [];
  got.stream(url).pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    if( results.length > 0){
      let records = [];
      const headers = Object.keys(results[0]).map(header => ({ id: header, title: header }));
      const fields = Object.values(results[0]);
  
      for (let i = 0; i < numRecords; i++) {
        const record = {};
        const fake = faker.generateFakeData(fields);
        headers.forEach((header, i) => {
          record[header.id] = fake[i];
        });
        records.push(record);
      }
  
      const csvStringifier = createCsvWriter({
        header: headers
      });
  
      const h = csvStringifier.getHeaderString();
      const c = csvStringifier.stringifyRecords(records);
      const data = `${h}${c}`;
      fs.writeFileSync(`${fs.rootPath}fileservs/${filename}`, data, 'utf8');
  
    }
  });

}

module.exports = { generateAndWriteCSV };
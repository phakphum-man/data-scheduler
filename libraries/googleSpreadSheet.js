const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const { googleJsonKey } = require('./googleSecret');
require('dotenv').config();

async function getDocument(spreadsheetId){
    const algorithm = process.env.ALGORITHM;

    const key = process.env.PRIVATE_KEY;
    const iv = process.env.IV;
    const gg = googleJsonKey();
    const dataEncrypted = gg.GG_PRIVATE_KEY;

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
    let decryptedData = decipher.update(dataEncrypted, "hex", "utf-8")
    decryptedData += decipher.final("utf8");

    const serviceAccountAuth = new JWT({
        email: process.env.GG_CLIENT_EMAIL,
        key: decryptedData,
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    });
    
    let doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
}

const values = (dataRows, fields) => {
    let data = [];
    if(!dataRows){
        return data;
    }else if(Array.isArray(fields) && fields.length > 0){
        data = dataRows.map((row) => {
            const field = fields.reduce((col,key) => ({...col,[key]:row.get(key)}),{});
            return field;
        });
    }else if(fields === '*'){
        data = dataRows.map((row) => {
            return row.toObject();
        });
    }
    return data;
}

const getItems = async (spreadsheetId, sheetName) => {
    let doc = await getDocument(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetName];

    const rows = await sheet.getRows();
    return rows;
};

const getItem = async (spreadsheetId, sheetName, keyAddress, keyVal) => {
    let {rowId, sheet} = await getRowId(spreadsheetId, sheetName, keyAddress, keyVal);
    
    if(rowId == null){
        return null;
    }else{
        rowId = rowId-2;
    }

    const rows = await sheet.getRows({ limit: 1, offset: rowId});
    return rows;
};

const insertItem = async (spreadsheetId, sheetName, rowObject) => {
    let doc = await getDocument(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetName];

    const newRow = await sheet.addRow(rowObject);
    return newRow;
};

const updateItem = async (spreadsheetId, sheetName, setRowObject, keyAddress = 'A', keyVal = 2) => {
    let {rowId, sheet} = await getRowId(spreadsheetId, sheetName, keyAddress, keyVal);
    
    if(rowId == null){
        return;
    }else{
        rowId = rowId-2;
    }

    const rows = await sheet.getRows({ limit: 1, offset: rowId});
    if(rows.length > 0){
        for (const key in setRowObject) {
            rows[0].set(key, setRowObject[key]);
        }
        await rows[0].save(); // save changes
    }
    
};

const deleteItem = async (spreadsheetId, sheetName, keyAddress = 'A', keyVal = 2) => {
    let {rowId, sheet} = await getRowId(spreadsheetId, sheetName, keyAddress, keyVal);
    
    if(rowId == null){
        return;
    }else{
        rowId = rowId-2;
    }

    const rows = await sheet.getRows({ limit: 1, offset: rowId});
    if(rows.length > 0){
        await rows[0].delete(); // save changes
    }
    
};

const getRowId = async (spreadsheetId, sheetName, keyAddress, findVal) => {
    let doc = await getDocument(spreadsheetId);

    const searchSheet = doc.sheetsByTitle[sheetName];
    
    let sheet = doc.sheetsByTitle['$SEARCHROW'];
    if(!sheet){
        sheet = await doc.addSheet({ title: '$SEARCHROW' });
    }
    
    await sheet.loadCells('A1:A1');
    let a1 = sheet.getCell(0, 0);
    a1.formula = `=MATCH(${findVal},${sheetName}!${keyAddress}2:${keyAddress}${searchSheet.rowCount},0)`;
    await sheet.saveUpdatedCells();

    const result = a1.value;
    if(typeof result === 'object' && result !== null && result.type == "N_A"){
        return {rowId : null, sheet: searchSheet};
    }
    // const rows = await searchSheet.getRows();
    // const data = rows.filter((row) => (row.get('id') === findVal.toString()));
    // const result = data.length > 0 ? data[0].toObject() : null;
    return {rowId : (result + 1), sheet: searchSheet};
};

module.exports = { getItems , getItem, getRowId, insertItem, updateItem, deleteItem, values};
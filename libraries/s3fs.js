const s3fs = require('@cyclic.sh/s3fs')(process.env.CYCLIC_BUCKET_NAME);
const rootPath = !process.env.AWS_SECRET_ACCESS_KEY ?"./":"/";

const existsSync = (filePath) => {
  //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
  try{
    return s3fs.existsSync(filePath);
  }catch(e) {
    throw e;
  }
}

const writeFileSync = (filePath,  data, options = undefined) => {
  //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
  try{
    s3fs.writeFileSync(filePath, data, options);
  }catch(e){
    throw e;
  }
}

const readFileSync = (filePath, options = undefined) => {
  //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
  try{
    const buffer = s3fs.readFileSync(filePath, options);
    return buffer;
  }catch(e) {
    throw e;
  }
}

const mkdirSync = (path, options = undefined) => {
  //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
  try{
    s3fs.mkdirSync(path, options);
  }catch(e) {
    throw e;
  }
}

const rmdirSync = (path, options = undefined) => {
  //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
  try{
    s3fs.rmdirSync(path, options);
  }catch(e) {
    throw e;
  }
}

const deleteFile = (filePath) => {
    //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
    const fileExists = s3fs.existsSync(filePath);
    if(!fileExists){
        return { result:"File not found"};
    }
    s3fs.unlinkSync(filePath);
}

const getFileList = (path) => {
    //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
    try{
      const files = s3fs.readdirSync(path);
      return files;
    }catch(e){
      return { result:"directory not found" };
    }
}

module.exports = { rootPath, existsSync, writeFileSync, readFileSync, mkdirSync, rmdirSync, deleteFile, getFileList };
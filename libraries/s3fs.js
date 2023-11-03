const fs = require('@cyclic.sh/s3fs')(process.env.CYCLIC_BUCKET_NAME);

const deleteFile = (filePath) => {
    //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
    const fileExists = fs.existsSync(filePath);
    if(!fileExists){
        return { result:"File not found"};
    }
    fs.unlinkSync(filePath);
}

const getFileList = (filePath) => {
    //@cyclic.sh/s3fs supports the following fs methods operating on AWS S3:
    try{
      const files = fs.readdirSync(filePath);
      return files;
    }catch(e){
      return { result:"directory not found" };
    }
}

module.exports = { deleteFile, getFileList };
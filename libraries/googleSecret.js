const fs = require('@cyclic.sh/s3fs')(process.env.CYCLIC_BUCKET_NAME);
const private_path = ((!process.env.AWS_SECRET_ACCESS_KEY)?'./':'/')+'private/gg.json';

const googleJsonKey = () => {
    const fileExists = fs.existsSync(private_path);
    if(!fileExists){
        return { GG_PRIVATE_KEY : null};
    }
    const json = JSON.parse(fs.readFileSync(private_path));
    return json;
}
const googleStoreKey = (path, jsonContent) => {
    if(path === private_path){
        fs.writeFileSync(private_path, jsonContent);
    }
}
module.exports = { googleJsonKey, googleStoreKey };
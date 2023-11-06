const googleDrive = require("./googleDrive");
const axios = require("axios");
const { selfHostUrl, s3Path } = require("./googleSecret");

const getJsonForm = async (req) => {
  const viewform = req.query.f;
  const csrf = req.csrfToken();

  let schema = {};
  let form = [];
  const gdrive_files = await googleDrive.getFiles();
  const formItems = gdrive_files.filter((f) => f.name === viewform);

  if (formItems.length > 0) {
    const selectItems = formItems[0].children;
    const layoutJs = selectItems.filter((f) =>
      f.name.toString().endsWith("-layout.json")
    );
    if (layoutJs.length > 0) {
      const getLayout = await axios.get(
        `${selfHostUrl(req)}/gdrive/${layoutJs[0].id}?file=${s3Path}jsonforms/${
          layoutJs[0].name
        }&_csrf=${csrf}`
      );
      form = getLayout.data;
    }
    const schemaJs = selectItems.filter((f) =>
      f.name.toString().endsWith("-schema.json")
    );
    if (schemaJs.length > 0) {
      const getShema = await axios.get(
        `${selfHostUrl(req)}/gdrive/${schemaJs[0].id}?file=${s3Path}jsonforms/${
          schemaJs[0].name
        }&_csrf=${csrf}`
      );
      schema = getShema.data;
    }
    return { schema, form };
  }else{
    return null;
  }
  
};

module.exports = { getJsonForm };

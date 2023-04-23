const axios = require('axios');
module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true

        return res.status(200).send(`Start API Scheduler`);
    });

    app.post('/everyThirtyMinute', (req, res) => {
        // #swagger.ignore = true

        let jobUrl = "https://data-keeper.onrender.com/livinginsider/chonburi";
        axios.get(jobUrl)
        .then( oxioRes => {
            console.log(`${jobUrl} => ${oxioRes.data}`)
        })
        .catch(err => console.error(err));

        return res.status(200).send({message: "success"});
    });
};
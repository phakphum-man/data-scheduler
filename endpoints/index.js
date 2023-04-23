const axios = require('axios');
const timediff = require('timediff');

let activeTime = (timeTable, timeCurrent) => {
    const diff = timediff(timeTable, timeCurrent, 'YMDHmS');
    return (diff.hours === 0 && diff.minutes === 0 && diff.seconds === 0)
};
module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true

        return res.status(200).send(`Start API Scheduler`);
    });

    app.post('/everyThirtyMinute', (req, res) => {
        // #swagger.ignore = true
        const tables = [{
            runtime: "1998-01-01 07:30:00",
            url: "https://data-keeper.onrender.com/livinginsider/chonburi",
            param: null
        },{
            runtime: "1998-01-01 08:00:00",
            url: "https://data-keeper.onrender.com/livinginsider/rayong",
            param: null
        },{
            runtime: "1998-01-01 08:30:00",
            url: "https://data-keeper.onrender.com/livinginsider/sellcost",
            param: null
        }];

        var datetime = new Date();
        let schedules = tables.map(tb => ({
            runtime: tb.runtime,
            url: tb.url,
            param: tb.param,
            isTrigger: activeTime(tb.runtime, datetime)
        }));

        const runtimes = schedules.filter((tb)=> tb.isTrigger);
        console.log(runtimes.length);
        runtimes.forEach((j) => {

            let jobUrl = j.url;
            axios.get(jobUrl)
            .then( oxioRes => {
                console.log(`${jobUrl} => ${oxioRes.data}`)
            })
            .catch(err => console.error(err));

        });

        return res.status(200).send({message: "success"});
    });
};

const axios = require('axios');
const timediff = require('timediff');

let activeTime = (timeTable, timeCurrent) => {
    const diff = timediff(timeTable, timeCurrent, 'YMDHmS');
    return (diff.hours === 0 && diff.minutes === 0)
};
module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true

        return res.status(200).send(`Start API Scheduler`);
    });

    app.post('/everyThirtyMinute', (req, res) => {
        // #swagger.ignore = true
        const tables = [{
            runtime: "1998-01-01 21:30:00",
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

        let tZone = 'Asia/Bangkok'; //Target timezone from server
        let datetime = new Date();//Init this to a time if you don't want current time
        datetime = new Date(Date.parse(datetime.toLocaleString("en-US", {timeZone: tZone})));
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

        return res.status(200).send({message: `success(${runtimes.length} jobs)`, data: timediff("1998-01-01 20:30:00", datetime, 'YMDHmS')});
    });
};

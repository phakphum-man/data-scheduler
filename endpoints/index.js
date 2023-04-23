module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true

        return res.status(200).send(`Start API Scheduler`);
    });
};
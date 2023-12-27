const { Client, APIErrorCode } = require("@notionhq/client")

async function getCardExpiryFromNextWeek() {
    try {
        const databaseId = process.env.NOTION_DATABASE_ID;
        const notion = new Client({ auth: process.env.NOTION_TOKEN })
        const myPage = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: "ExpireDate",
                date: {
                    next_week: {},
                },
            },
        });
        if(myPage && myPage.results && myPage.results.length > 0) {
            return myPage.results.map((x) => x.properties);
        }
        return;
    } catch (error) {
        if (error.code === APIErrorCode.ObjectNotFound) {
            console.error('Object not found');
        } else {
            // Other error handling code
            console.error(error);
        }
        throw error;
    }
}
module.exports = { getCardExpiryFromNextWeek };
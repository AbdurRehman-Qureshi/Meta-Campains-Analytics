const dotenv = require("dotenv");
const mondaySdk = require("monday-sdk-js");
const monday = mondaySdk();

dotenv.config();
monday.setToken(process.env.MONDAY_ACCESS_TOKEN);
module.exports = monday;
const express = require('express');
const uploadMetaInsightsToDB = require('./services/dbUploader');
const pullMondayBoardData = require('./services/mondayLogsPuller');
const metaInsightsPuller = require('./services/metaInsightsPuller');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(require('cors')());

// uploadMetaInsightsToDB();

// metaInsightsPuller();  commenting it out to avoid double pulling
uploadMetaInsightsToDB();
// pullMondayBoardData(process.env.BOARD_ID);

app.listen(5000, () => console.log('Server running on port 5000'));
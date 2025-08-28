const express = require('express');
const uploadMetaInsightsToDB = require('./services/dbUploader');

const app = express();
app.use(express.json());
app.use(require('cors')());

uploadMetaInsightsToDB();


app.listen(5000, () => console.log('Server running on port 5000'));
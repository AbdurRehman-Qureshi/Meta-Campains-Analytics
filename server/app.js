const express = require('express');
// const uploadMetaInsightsToDB = require('./services/dbUploader');
const uploadMetaInsightsToDB = require('./services/dbUploader1');
const pullMondayBoardData = require('./services/mondayLogsPuller');
const metaInsightsPuller = require('./services/metaInsightsPuller');
// const { processSummaries } = require('./jobs/processSummaries');
const { processSummaries } = require('./jobs/processSummaries1');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(require('cors')());



uploadMetaInsightsToDB();

// metaInsightsPuller();  commenting it out to avoid double pulling
// uploadMetaInsightsToDB();
// processSummaries('campaign', 5);
// processSummaries('adset', 5);
// processSummaries('ad', 5);
// processSummaries('client', 5);
// pullMondayBoardData(process.env.BOARD_ID);


 const clientsRouter = require('./routes/clients');
app.use('/api/clients', clientsRouter);
const server = app.listen(5000, () => console.log('Server running on port 5000'));

// Gracefully disconnect Prisma on server shutdown
const prisma = require('./config/prismaClient').default;

const shutdown = async () => {
  console.log('Shutting down server...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
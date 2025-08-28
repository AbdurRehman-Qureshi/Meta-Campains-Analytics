// const cron = require('node-cron');
// const pullMetaInsights = require('./metaInsightsPuller');


// // Monday 6:00 AM - pull last week's data
// cron.schedule('0 6 * * 1', () => {
//   console.log('Running scheduled Meta insights pull for last week (Monday 6:00 AM)...');
//   pullMetaInsights('last_7d');
// });

// // Thursday 11:00 AM - pull last 3 days' data
// cron.schedule('0 6 * * 4', () => {
//   console.log('Running scheduled Meta insights pull for last 3 days (Thursday 11:00 AM)...');
//   pullMetaInsights('last_3d');
// });
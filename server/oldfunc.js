require('dotenv').config();
const cron = require('node-cron');
// const express = require('express');
const axios = require('axios');


// Function to pull Meta campaign insights with custom date_preset
// async function pullMetaInsights(datePreset) {
//   try {
//     const response = await axios.get(
//       `https://graph.facebook.com/v19.0/act_${process.env.AD_ACCOUNT_ID}/insights`,
//       {
//         params: {
//           access_token: process.env.ACCESS_TOKEN,
//           date_preset: datePreset,
//           level: 'campaign',
//           fields: 'account_id,campaign_id,campaign_name,impressions,spend,date_start,date_stop',
//           limit: 100
//         },
//       }
//     );
//     console.log(`Scheduled insights (${datePreset}):`, response.data);
//     // You can process/store response.data here for scheduled jobs
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//   }
// }

function pullMetaInsights(){
app.get('/api/meta-insights', async (res, req) => {
    try {
        const response = axios.get(`https://graph.facebook.com/v19.0/act_${process.env.AD_ACCOUNT_ID}/insights`, {
            params: {
                access_token: process.env.ACCESS_TOKEN,
                date_preset: 'maximum',
                level: 'campaign',
                fields: 'account_id,campaign_id,campaign_name,impressions,ctr,spend,date_start,date_stop,actions',
                limit: 10
            }
        });
    
        const campaignsArr = [];
        const metricsArr = [];

        for (const campaign of response.data.data) {
          const spend = parseFloat(campaign.spend);
          const actions = campaign.actions || [];
          const ctr = parseFloat(campaign.ctr);

          const getActionValue = (type) => {
            const a = actions.find(x => x.action_type === type);
            return a ? parseInt(a.value) : 0;
          };

          const contentViews = getActionValue("content_view");
          const addToCarts = getActionValue("add_to_cart");
          const initiateCheckouts = getActionValue("initiate_checkout");
          const purchases = getActionValue("purchase");

          campaignsArr.push({
            campaign_id: campaign.campaign_id,
            account_id: campaign.account_id,
            campaign_name: campaign.campaign_name,
            date_created: campaign.date_start,
            date_stop: campaign.date_stop
          });

          metricsArr.push({
            campaign_id: campaign.campaign_id,
            retrieval_time: new Date().toISOString(),
            impressions: parseInt(campaign.impressions),
            spend: spend,
            content_views: contentViews,
            ctr: ctr,
            link_ctr: 0,
            cost_per_content_view: contentViews > 0 ? spend / contentViews : null,
            add_to_carts: addToCarts,
            cost_per_add_to_cart: addToCarts > 0 ? spend / addToCarts : null,
            initiate_checkouts: initiateCheckouts,
            cost_per_initiate_checkout: initiateCheckouts > 0 ? spend / initiateCheckouts : null,
            purchases: purchases,
            cost_per_purchase: purchases > 0 ? spend / purchases : null
          });
        }
        res.json({ success: true, campaignsInserted: campaignsArr.length, metricsInserted: metricsArr.length });
        console.log('Meta insights successfully pulled and processed');
        return { campaignsArr, metricsArr }
    } catch (err) {
      console.error(err.response?.data || err.message);
      res.status(500).json({ error: err.message });
    }
});
};


// // Monday 6:00 AM - pull last week's data
// cron.schedule('0 6 * * 1', () => {
//   console.log('Running scheduled Meta insights pull for last week (Monday 6:00 AM)...');
//   pullMetaInsights('last_7d');
// });

// // Thursday 11:00 AM - pull last 3 days' data
// cron.schedule('0 11 * * 4', () => {
//   console.log('Running scheduled Meta insights pull for last 3 days (Thursday 11:00 AM)...');
//   pullMetaInsights('last_3d');
// });

module.exports = pullMetaInsights;
require('dotenv').config();
const axios = require('axios');

async function pullMetaInsights(){
    const campaignsArr = [];
    const metricsArr = [];
    
    try {
        const response = await axios.get(`https://graph.facebook.com/v19.0/act_${process.env.AD_ACCOUNT_ID}/insights`, {
            params: {
                access_token: process.env.ACCESS_TOKEN,
                date_preset: 'maximum',
                level: 'campaign',
                fields: 'account_id,campaign_id,campaign_name,impressions,ctr,spend,date_start,date_stop,actions',
                limit: 10
            }
        });

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

        console.log(`Meta insights successfully pulled and processed.\nCampaigns pulled: ${campaignsArr.length}\nMetrics pulled: ${metricsArr.length} `);
        return { campaignsArr, metricsArr };

    } catch (err) {
      console.error(err.response?.data || err.message);
      return { campaignsArr, metricsArr };
    }
};

module.exports = pullMetaInsights;
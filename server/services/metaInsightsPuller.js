require('dotenv').config();
const axios = require('axios');

async function pullMetaInsights() {  
  const clientsArr = [];
  const campaignsArr = [];
  const adSetsArr = [];
  const adsArr = [];

  try {
    async function fetchInsights(level, fields) {
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/act_${process.env.AD_ACCOUNT_ID}/insights`,
        {
          params: {
            access_token: process.env.ACCESS_TOKEN,
            date_preset: 'maximum',
            level,
            fields,
            limit: 50, // bump up for more results
          },
        }
      );
      return response.data.data || [];
    }

    function getActionValue(actions, type) {
      const a = actions?.find((x) => x.action_type === type);
      return a ? parseFloat(a.value) : 0;
    }

    // ---------------- Campaign-level ----------------
    const campaignFields =
      'account_id,account_name,campaign_id,campaign_name,spend,impressions,ctr,actions,purchase_roas,reach';
    const campaignInsights = await fetchInsights('campaign', campaignFields);

    for (const c of campaignInsights) {

      const purchases = getActionValue(c.actions, 'purchase');
      const purchaseValue = getActionValue(c.actions, 'purchase_value');

      clientsArr.push({
        account_id: c.account_id,
        account_name: c.account_name,
      });

      campaignsArr.push({
        account_id: c.account_id,
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,

        // ------Metrics------
        spend: parseFloat(c.spend),
        impressions: parseInt(c.impressions),
        cpm: (parseFloat(c.spend) / parseInt(c.impressions)) * 1000 || 0,
        roas: purchaseValue && c.spend > 0 ? purchaseValue / c.spend : 0,
        revenue: purchaseValue,
        aov: purchases > 0 ? purchaseValue / purchases : 0,
        mer: purchaseValue && c.spend > 0 ? purchaseValue / c.spend : 0, // MER ~ ROAS in many setups
        learning_phase: purchases >= 50,
      });

    }

    // ---------------- Ad set-level ----------------
    const adsetFields =
      'campaign_id,adset_id,adset_name,impressions,reach,frequency,ctr,actions,spend,clicks,inline_link_clicks';
    const adsetInsights = await fetchInsights('adset', adsetFields);

    for (const a of adsetInsights) {
      
      const atc = getActionValue(a.actions, 'add_to_cart');
      const atcValue = getActionValue(a.actions, 'add_to_cart_value');
      const ic = getActionValue(a.actions, 'initiate_checkout');
      const icValue = getActionValue(a.actions, 'initiate_checkout_value');
      const purchases = getActionValue(a.actions, 'purchase');
      const purchaseValue = getActionValue(a.actions, 'purchase_value');
      const lpv = getActionValue(a.actions, 'landing_page_view');
      
      adSetsArr.push({
        adset_id: a.adset_id,
        adset_name: a.adset_name,
        campaign_id: a.campaign_id,

        // ------Metrics------
        impressions: parseInt(a.impressions),
        reach: parseInt(a.reach),
        frequency: parseFloat(a.frequency),
        ctr_all: parseFloat(a.ctr),
        ctr_link: a.inline_link_clicks && a.impressions
          ? a.inline_link_clicks / a.impressions
          : 0,
        link_clicks: parseInt(a.inline_link_clicks || 0),
        cpc: a.inline_link_clicks > 0 ? a.spend / a.inline_link_clicks : 0,
        lpv: lpv,
        lpv_rate: a.inline_link_clicks > 0 ? lpv / a.inline_link_clicks : 0,
        atc,
        atc_value: atcValue,
        cpatc: atc > 0 ? a.spend / atc : 0,
        ic,
        ic_value: icValue,
        cpic: ic > 0 ? a.spend / ic : 0,
        purchases,
        cpa: purchases > 0 ? a.spend / purchases : 0,
        roas: purchaseValue && a.spend > 0 ? purchaseValue / a.spend : 0,
      }); 

    }

    // ---------------- Ad-level ----------------
    const adFields =
      'campaign_id,adset_id,ad_id,ad_name,impressions,ctr,actions,spend,inline_link_clicks';
    const adInsights = await fetchInsights('ad', adFields);

    for (const ad of adInsights) {

      const lpv = getActionValue(ad.actions, 'landing_page_view');
      const atc = getActionValue(ad.actions, 'add_to_cart');
      const ic = getActionValue(ad.actions, 'initiate_checkout');
      const purchases = getActionValue(ad.actions, 'purchase');
      
      adsArr.push({
        ad_id: ad.ad_id,
        ad_name: ad.ad_name,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,

        // ------Metrics------
        impressions: parseInt(ad.impressions),
        ctr_all: parseFloat(ad.ctr),
        ctr_link:
          ad.inline_link_clicks && ad.impressions
            ? ad.inline_link_clicks / ad.impressions
            : 0,
        thumb_stop_ratio:
          ad.impressions > 0 ? ad.inline_link_clicks / ad.impressions : 0,
        lpv_rate:
          ad.inline_link_clicks > 0 ? lpv / ad.inline_link_clicks : 0,
        atc,
        ic,
        purchases,
        fatigue_flag:
          parseFloat(ad.ctr) < 0.5 && // CTR dropping
          (ad.spend / ad.impressions) * 1000 > 20, // CPM rising
      });

    }

    console.log(
      `Meta insights pulled \nCampaigns: ${campaignsArr.length}\nAdSets: ${adSetsArr.length}\nAds: ${adsArr.length}\n\n`
    );

    return {
      clientsArr,
      campaignsArr,
      adSetsArr,
      adsArr
    };
  } 
  catch (err) {
    console.error(err.response?.data || err.message);
    return {
      clientsArr,
      campaignsArr,       // Add the break here if something in this file is failed (later work)
      adSetsArr,
      adsArr
    };
  }
}

module.exports = pullMetaInsights;

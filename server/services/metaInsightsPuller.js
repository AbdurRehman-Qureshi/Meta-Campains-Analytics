require('dotenv').config();
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function pullMetaInsights() {
  const clientsArr = [];
  const campaignsArr = [];
  const adSetsArr = [];
  const adsArr = [];

  try {
    // Fetch all AdAccountIds from DB
    const accounts = await prisma.AdAccounts.findMany({
      select: { AdAccountId: true, AdAccountName: true, category: true },
    });

    console.log(`Found ${accounts.length} ad accounts in database.`);

    // Helper function to fetch insights
    async function fetchInsights(accountId, level, fields) {
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/act_${accountId}/insights`,
        {
          params: {
            access_token: process.env.ACCESS_TOKEN,
            // date_preset: 'maximum',
            time_range: JSON.stringify({
              since: '2025-10-13',
              until: '2025-10-19',
            }),
            level,
            fields,
            limit: 50,
          },
        }
      );
      return response.data.data || [];
    }

    function getActionValue(actions, type) {
      const a = actions?.find((x) => x.action_type === type);
      return a ? parseFloat(a.value) : 0;
    }

    // Helper: Process in batches
    async function processInBatches(items, batchSize, handler) {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        console.log(`🔹 Processing batch ${i / batchSize + 1} of ${Math.ceil(items.length / batchSize)}...`);

        const results = await Promise.allSettled(batch.map(handler));

        results.forEach((r, idx) => {
          if (r.status === 'rejected') {
            const acc = batch[idx];
            console.error(
              `⚠️ Account ${acc.AdAccountId} failed:`,
              r.reason?.response?.data?.error?.message || r.reason?.message
            );
          }
        });
      }
    }

    // Handler for each account
    async function handleAccount(acc) {
      const adAccountId = acc.AdAccountId;
      const adAccountCategory = acc.category;
      const adAccountName = acc.AdAccountName;

      // Fetch all levels for this account in parallel
      const [accountInsights, campaignInsights, adsetInsights, adInsights] =
        await Promise.all([
          fetchInsights(adAccountId, 'account', 'account_id,account_name,spend,impressions,ctr,actions,inline_link_clicks'),
          fetchInsights(adAccountId, 'campaign', 'account_id,campaign_id,campaign_name,spend,impressions,ctr,actions,purchase_roas,reach'),
          fetchInsights(adAccountId, 'adset', 'campaign_id,adset_id,adset_name,impressions,reach,frequency,ctr,actions,spend,clicks,inline_link_clicks'),
          fetchInsights(adAccountId, 'ad', 'campaign_id,adset_id,ad_id,ad_name,impressions,ctr,actions,spend,inline_link_clicks'),
        ]);

      // Account-level
      for (const accInsight of accountInsights) {
        const addToCart = getActionValue(accInsight.actions, 'add_to_cart');
        const initiateCheckout = getActionValue(accInsight.actions, 'initiate_checkout');
        const purchases = getActionValue(accInsight.actions, 'purchase');
        const purchaseValue = getActionValue(accInsight.actions, 'purchase_value');
        const leads = getActionValue(accInsight.actions, 'lead');
        const spend = parseFloat(accInsight.spend || 0);
        const impressions = parseInt(accInsight.impressions || 0);
        const link_clicks = parseInt(accInsight.inline_link_clicks || 0);

        clientsArr.push({
          account_id: accInsight.account_id,
          account_name: adAccountName,
          adAccountCategory,
          spend,
          impressions,
          ctr_all: parseFloat(accInsight.ctr || 0),
          link_clicks,
          addToCart,
          initiateCheckout,
          purchases,
          purchaseValue,
          leads,
          cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
          ctrl: impressions > 0 ? link_clicks / impressions : 0,
          catc: addToCart > 0 ? spend / addToCart : 0,
          cgb: initiateCheckout > 0 ? spend / initiateCheckout : 0,
          cpa: purchases > 0 ? spend / purchases : 0,
          roas: spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0,
          aov: purchases > 0 ? purchaseValue / purchases : 0,
          cpl: leads > 0 ? spend / leads : 0,
        });
      }

      // Campaign-level
      for (const c of campaignInsights) {
        const purchases = getActionValue(c.actions, 'purchase');
        const purchaseValue = getActionValue(c.actions, 'purchase_value');
        const spend = parseFloat(c.spend || 0);
        const impressions = parseInt(c.impressions || 0);

        campaignsArr.push({
          account_id: c.account_id,
          campaign_id: c.campaign_id,
          campaign_name: c.campaign_name,
          spend,
          impressions,
          cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
          roas: spend > 0 ? purchaseValue / spend : 0,
          revenue: purchaseValue,
          aov: purchases > 0 ? purchaseValue / purchases : 0,
          mer: spend > 0 ? purchaseValue / spend : 0,
          learning_phase: purchases >= 50,
        });
      }

      // Adset-level
      for (const a of adsetInsights) {
        const atc = getActionValue(a.actions, 'add_to_cart');
        const ic = getActionValue(a.actions, 'initiate_checkout');
        const purchases = getActionValue(a.actions, 'purchase');
        const purchaseValue = getActionValue(a.actions, 'purchase_value');
        const impressions = parseInt(a.impressions || 0);
        const spend = parseFloat(a.spend || 0);
        const inline_link_clicks = parseInt(a.inline_link_clicks || 0);

        adSetsArr.push({
          adset_id: a.adset_id,
          adset_name: a.adset_name,
          campaign_id: a.campaign_id,
          impressions,
          spend,
          ctr_all: parseFloat(a.ctr || 0),
          link_clicks: inline_link_clicks,
          purchases,
          cpa: purchases > 0 ? spend / purchases : 0,
          roas: spend > 0 ? purchaseValue / spend : 0,
        });
      }

      // Ad-level
      for (const ad of adInsights) {
        const lpv = getActionValue(ad.actions, 'landing_page_view');
        const atc = getActionValue(ad.actions, 'add_to_cart');
        const ic = getActionValue(ad.actions, 'initiate_checkout');
        const purchases = getActionValue(ad.actions, 'purchase');
        const purchaseValue = getActionValue(ad.actions, 'purchase_value');
        const impressions = parseInt(ad.impressions || 0);
        const ctr = parseFloat(ad.ctr || 0);
        const spend = parseFloat(ad.spend || 0);
        const inline_link_clicks = parseInt(ad.inline_link_clicks || 0);

        adsArr.push({
          ad_id: ad.ad_id,
          ad_name: ad.ad_name,
          adset_id: ad.adset_id,
          campaign_id: ad.campaign_id,
          impressions,
          ctr_all: ctr,
          link_clicks: inline_link_clicks,
          purchases,
          cpa: purchases > 0 ? spend / purchases : 0,
          roas: spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0,
        });
      }
    }

    // 🧠 Run all accounts in batches (10 at a time)
    await processInBatches(accounts, 10, handleAccount);

    console.log(
      `✅ Meta insights pulled successfully:
      Accounts: ${clientsArr.length}
      Campaigns: ${campaignsArr.length}
      AdSets: ${adSetsArr.length}
      Ads: ${adsArr.length}`
    );

    return { clientsArr, campaignsArr, adSetsArr, adsArr };
  } catch (err) {
    console.error('❌ Error in main fetch:', err.message);
    return { clientsArr, campaignsArr, adSetsArr, adsArr };
  } 
  // finally {
  //   await prisma.$disconnect();
  // }
}

module.exports = pullMetaInsights;


















// require('dotenv').config();
// const axios = require('axios');

// async function pullMetaInsights() {  
//   const clientsArr = [];
//   const campaignsArr = [];
//   const adSetsArr = [];
//   const adsArr = [];

  
//   try {

//     // Tester --------------------
//     const adAccounts = await prisma.AdAccounts.findMany({
//       select: { AdAccountId: true},
//     });

//     if (adAccounts.length === 0) {
//       console.log("No ad accounts found in the database.");
//       return {clientsArr, campaignsArr, adSetsArr, adsArr };
//     }
//     console.log(`Found ${adAccounts.length} ad accounts.`);
    
//     async function fetchInsights( adAccountId, level, fields) {
//       const response = await axios.get(
//         `https://graph.facebook.com/v19.0/act_${adAccountId}/insights`,
//         {
//           params: {
//             access_token: process.env.ACCESS_TOKEN,
//             date_preset: 'maximum',
//             level,
//             fields,
//             limit: 50, // bump up for more results
//           },
//         }
//       );
//       return response.data.data || [];
//     }

//     function getActionValue(actions, type) {
//       const a = actions?.find((x) => x.action_type === type);
//       return a ? parseFloat(a.value) : 0;
//     }

//     for (const { AdAccountId } of adAccounts) {
//       console.log(`\n📊 Fetching data for Ad Account: ${AdAccountId}`);

//       // ---------------- Account-level ----------------
//       const accountFields =
//         'account_id,account_name,spend,impressions,ctr,actions,inline_link_clicks';
  
//       const accountInsights = await fetchInsights(AdAccountId, 'account', accountFields);

//       for (const acc of accountInsights) {
//         const addToCart = getActionValue(acc.actions, 'add_to_cart');
//         const initiateCheckout = getActionValue(acc.actions, 'initiate_checkout');
//         const purchases = getActionValue(acc.actions, 'purchase');
//         const purchaseValue = getActionValue(acc.actions, 'purchase_value');
//         const leads = getActionValue(acc.actions, 'lead');
  
//         // Define local variables for calculations
//         const spend = parseFloat(acc.spend || 0);
//         const impressions = parseInt(acc.impressions || 0);
//         const link_clicks = parseInt(acc.inline_link_clicks || 0);
  
//         clientsArr.push({
//           account_id: acc.account_id,
//           account_name: acc.account_name,
  
//           // ------Metrics------
//           spend,
//           impressions,
//           ctr_all: parseFloat(acc.ctr || 0),
//           link_clicks,
//           addToCart,
//           initiateCheckout,
//           purchases,
//           purchaseValue,
//           leads,
//           cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
//           ctrl: impressions > 0 ? link_clicks / impressions : 0,
//           catc: addToCart > 0 ? spend / addToCart : 0,
//           cgb: initiateCheckout > 0 ? spend / initiateCheckout : 0,
//           cpa: purchases > 0 ? spend / purchases : 0,
//           roas: spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0,
//           aov: purchases > 0 ? purchaseValue / purchases : 0,
//           cpl: leads > 0 ? spend / leads : 0
//         });
//       }

//       // ---------------- Campaign-level ----------------
//       const campaignFields =
//         'account_id,account_name,campaign_id,campaign_name,spend,impressions,ctr,actions,purchase_roas,reach';
//       const campaignInsights = await fetchInsights(AdAccountId, 'campaign', campaignFields);
  
//       for (const c of campaignInsights) {
//         const purchases = getActionValue(c.actions, 'purchase');
//         const purchaseValue = getActionValue(c.actions, 'purchase_value');
  
//         // Parse numbers safely
//         const spend = parseFloat(c.spend || 0);
//         const impressions = parseInt(c.impressions || 0);
  
//         campaignsArr.push({
//           account_id: c.account_id,
//           campaign_id: c.campaign_id,
//           campaign_name: c.campaign_name,
  
//           // ------Metrics------
//           spend,
//           impressions,
//           cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
//           roas: spend > 0 ? purchaseValue / spend : 0,
//           revenue: purchaseValue,
//           aov: purchases > 0 ? purchaseValue / purchases : 0,
//           mer: spend > 0 ? purchaseValue / spend : 0, // MER ~ ROAS in many setups
//           learning_phase: purchases >= 50,
//         });
//       }

//       // ---------------- Ad set-level ----------------
//       const adsetFields =
//         'campaign_id,adset_id,adset_name,impressions,reach,frequency,ctr,actions,spend,clicks,inline_link_clicks';
//       const adsetInsights = await fetchInsights( AdAccountId, 'adset', adsetFields);
  
//       for (const a of adsetInsights) {
//         const atc = getActionValue(a.actions, 'add_to_cart');
//         const atcValue = getActionValue(a.actions, 'add_to_cart_value');
//         const ic = getActionValue(a.actions, 'initiate_checkout');
//         const icValue = getActionValue(a.actions, 'initiate_checkout_value');
//         const purchases = getActionValue(a.actions, 'purchase');
//         const purchaseValue = getActionValue(a.actions, 'purchase_value');
//         const lpv = getActionValue(a.actions, 'landing_page_view');
  
//         // Parse numbers safely
//         const spend = parseFloat(a.spend || 0);
//         const impressions = parseInt(a.impressions || 0);
//         const reach = parseInt(a.reach || 0);
//         const frequency = parseFloat(a.frequency || 0);
//         const inline_link_clicks = parseInt(a.inline_link_clicks || 0);
  
//         adSetsArr.push({
//           adset_id: a.adset_id,
//           adset_name: a.adset_name,
//           campaign_id: a.campaign_id,
  
//           // ------Metrics------
//           impressions,
//           reach,
//           frequency,
//           ctr_all: parseFloat(a.ctr || 0),
//           ctr_link: inline_link_clicks && impressions ? inline_link_clicks / impressions : 0,
//           link_clicks: inline_link_clicks,
//           cpc: inline_link_clicks > 0 ? spend / inline_link_clicks : 0,
//           lpv: lpv,
//           lpv_rate: inline_link_clicks > 0 ? lpv / inline_link_clicks : 0,
//           atc,
//           atc_value: atcValue,
//           cpatc: atc > 0 ? spend / atc : 0,
//           ic,
//           ic_value: icValue,
//           cpic: ic > 0 ? spend / ic : 0,
//           purchases,
//           cpa: purchases > 0 ? spend / purchases : 0,
//           roas: purchaseValue && spend > 0 ? purchaseValue / spend : 0,
//         });
//       }
  
//       // ---------------- Ad-level ----------------
//       const adFields =
//         'campaign_id,adset_id,ad_id,ad_name,impressions,ctr,actions,spend,inline_link_clicks';
//       const adInsights = await fetchInsights( AdAccountId, 'ad', adFields);
  
//       for (const ad of adInsights) {
//         const lpv = getActionValue(ad.actions, 'landing_page_view');
//         const atc = getActionValue(ad.actions, 'add_to_cart');
//         const ic = getActionValue(ad.actions, 'initiate_checkout');
//         const purchases = getActionValue(ad.actions, 'purchase');
        
//         // Parse numbers safely
//         const impressions = parseInt(ad.impressions || 0);
//         const ctr = parseFloat(ad.ctr || 0);
//         const spend = parseFloat(ad.spend || 0);
//         const inline_link_clicks = parseInt(ad.inline_link_clicks || 0);
  
//         adsArr.push({
//           ad_id: ad.ad_id,
//           ad_name: ad.ad_name,
//           adset_id: ad.adset_id,
//           campaign_id: ad.campaign_id,
  
//           // ------Metrics------
//           impressions,
//           ctr_all: ctr,
//           ctr_link: inline_link_clicks && impressions ? inline_link_clicks / impressions : 0,
//           thumb_stop_ratio: impressions > 0 ? inline_link_clicks / impressions : 0,
//           lpv_rate: inline_link_clicks > 0 ? lpv / inline_link_clicks : 0,
//           atc,
//           ic,
//           purchases,
//           fatigue_flag:
//             ctr < 0.5 && // CTR dropping
//             (spend / impressions) * 1000 > 20, // CPM rising
//         });
//       }


//     }

//     // ---------------------------

//     async function fetchInsights(level, fields) {
//       const response = await axios.get(
//         `https://graph.facebook.com/v19.0/act_${process.env.AD_ACCOUNT_ID}/insights`,
//         {
//           params: {
//             access_token: process.env.ACCESS_TOKEN,
//             date_preset: 'maximum',
//             level,
//             fields,
//             limit: 50, // bump up for more results
//           },
//         }
//       );
//       return response.data.data || [];
//     }

//     function getActionValue(actions, type) {
//       const a = actions?.find((x) => x.action_type === type);
//       return a ? parseFloat(a.value) : 0;
//     }

//     // ---------------- Account-level ----------------
//     const accountFields =
//       'account_id,account_name,spend,impressions,ctr,actions,inline_link_clicks';;
    
//     const accountInsights = await fetchInsights('account', accountFields);


//     for (const acc of accountInsights) {
//       const addToCart = getActionValue(acc.actions, 'add_to_cart');
//       const initiateCheckout = getActionValue(acc.actions, 'initiate_checkout');
//       const purchases = getActionValue(acc.actions, 'purchase');
//       const purchaseValue = getActionValue(acc.actions, 'purchase_value');
//       const leads = getActionValue(acc.actions, 'lead');

//       // Define local variables for calculations
//       const spend = parseFloat(acc.spend || 0);
//       const impressions = parseInt(acc.impressions || 0);
//       const link_clicks = parseInt(acc.inline_link_clicks || 0);

//       clientsArr.push({
//         account_id: acc.account_id,
//         account_name: acc.account_name,

//         // ------Metrics------
//         spend,
//         impressions,
//         ctr_all: parseFloat(acc.ctr || 0),
//         link_clicks,
//         addToCart,
//         initiateCheckout,
//         purchases,
//         purchaseValue,
//         leads,
//         cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
//         ctrl: impressions > 0 ? link_clicks / impressions : 0,
//         catc: addToCart > 0 ? spend / addToCart : 0,
//         cgb: initiateCheckout > 0 ? spend / initiateCheckout : 0,
//         cpa: purchases > 0 ? spend / purchases : 0,
//         roas: spend > 0 && purchaseValue > 0 ? purchaseValue / spend : 0,
//         aov: purchases > 0 ? purchaseValue / purchases : 0,
//         cpl: leads > 0 ? spend / leads : 0
//       });
//     }

//     // ---------------- Campaign-level ----------------
//     const campaignFields =
//       'account_id,account_name,campaign_id,campaign_name,spend,impressions,ctr,actions,purchase_roas,reach';
//     const campaignInsights = await fetchInsights('campaign', campaignFields);

//     for (const c of campaignInsights) {
//       const purchases = getActionValue(c.actions, 'purchase');
//       const purchaseValue = getActionValue(c.actions, 'purchase_value');

//       // Parse numbers safely
//       const spend = parseFloat(c.spend || 0);
//       const impressions = parseInt(c.impressions || 0);

//       campaignsArr.push({
//         account_id: c.account_id,
//         campaign_id: c.campaign_id,
//         campaign_name: c.campaign_name,

//         // ------Metrics------
//         spend,
//         impressions,
//         cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
//         roas: spend > 0 ? purchaseValue / spend : 0,
//         revenue: purchaseValue,
//         aov: purchases > 0 ? purchaseValue / purchases : 0,
//         mer: spend > 0 ? purchaseValue / spend : 0, // MER ~ ROAS in many setups
//         learning_phase: purchases >= 50,
//       });

//     }

//     // ---------------- Ad set-level ----------------
//     const adsetFields =
//       'campaign_id,adset_id,adset_name,impressions,reach,frequency,ctr,actions,spend,clicks,inline_link_clicks';
//     const adsetInsights = await fetchInsights('adset', adsetFields);

//     for (const a of adsetInsights) {
//       const atc = getActionValue(a.actions, 'add_to_cart');
//       const atcValue = getActionValue(a.actions, 'add_to_cart_value');
//       const ic = getActionValue(a.actions, 'initiate_checkout');
//       const icValue = getActionValue(a.actions, 'initiate_checkout_value');
//       const purchases = getActionValue(a.actions, 'purchase');
//       const purchaseValue = getActionValue(a.actions, 'purchase_value');
//       const lpv = getActionValue(a.actions, 'landing_page_view');

//       // Parse numbers safely
//       const spend = parseFloat(a.spend || 0);
//       const impressions = parseInt(a.impressions || 0);
//       const reach = parseInt(a.reach || 0);
//       const frequency = parseFloat(a.frequency || 0);
//       const inline_link_clicks = parseInt(a.inline_link_clicks || 0);

//       adSetsArr.push({
//         adset_id: a.adset_id,
//         adset_name: a.adset_name,
//         campaign_id: a.campaign_id,

//         // ------Metrics------
//         impressions,
//         reach,
//         frequency,
//         ctr_all: parseFloat(a.ctr || 0),
//         ctr_link: inline_link_clicks && impressions ? inline_link_clicks / impressions : 0,
//         link_clicks: inline_link_clicks,
//         cpc: inline_link_clicks > 0 ? spend / inline_link_clicks : 0,
//         lpv: lpv,
//         lpv_rate: inline_link_clicks > 0 ? lpv / inline_link_clicks : 0,
//         atc,
//         atc_value: atcValue,
//         cpatc: atc > 0 ? spend / atc : 0,
//         ic,
//         ic_value: icValue,
//         cpic: ic > 0 ? spend / ic : 0,
//         purchases,
//         cpa: purchases > 0 ? spend / purchases : 0,
//         roas: purchaseValue && spend > 0 ? purchaseValue / spend : 0,
//       });
//     }

//     // ---------------- Ad-level ----------------
//     const adFields =
//       'campaign_id,adset_id,ad_id,ad_name,impressions,ctr,actions,spend,inline_link_clicks';
//     const adInsights = await fetchInsights('ad', adFields);

//     for (const ad of adInsights) {
//       const lpv = getActionValue(ad.actions, 'landing_page_view');
//       const atc = getActionValue(ad.actions, 'add_to_cart');
//       const ic = getActionValue(ad.actions, 'initiate_checkout');
//       const purchases = getActionValue(ad.actions, 'purchase');
      
//       // Parse numbers safely
//       const impressions = parseInt(ad.impressions || 0);
//       const ctr = parseFloat(ad.ctr || 0);
//       const spend = parseFloat(ad.spend || 0);
//       const inline_link_clicks = parseInt(ad.inline_link_clicks || 0);

//       adsArr.push({
//         ad_id: ad.ad_id,
//         ad_name: ad.ad_name,
//         adset_id: ad.adset_id,
//         campaign_id: ad.campaign_id,

//         // ------Metrics------
//         impressions,
//         ctr_all: ctr,
//         ctr_link: inline_link_clicks && impressions ? inline_link_clicks / impressions : 0,
//         thumb_stop_ratio: impressions > 0 ? inline_link_clicks / impressions : 0,
//         lpv_rate: inline_link_clicks > 0 ? lpv / inline_link_clicks : 0,
//         atc,
//         ic,
//         purchases,
//         fatigue_flag:
//           ctr < 0.5 && // CTR dropping
//           (spend / impressions) * 1000 > 20, // CPM rising
//       });

//     }

//     console.log(
//       `Meta insights pulled \nCampaigns: ${campaignsArr.length}\nAdSets: ${adSetsArr.length}\nAds: ${adsArr.length}\n\n`
//     );

//     return {
//       clientsArr,
//       campaignsArr,
//       adSetsArr,
//       adsArr
//     };
//   } 
//   catch (err) {
//     console.error(err.response?.data || err.message);
//     return {
//       clientsArr,
//       campaignsArr,       // Add the break here if something in this file is failed (later work)
//       adSetsArr,
//       adsArr
//     };
//   }
// }

// module.exports = pullMetaInsights;

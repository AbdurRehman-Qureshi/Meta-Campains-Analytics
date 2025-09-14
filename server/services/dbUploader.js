const pullMetaInsights = require("./metaInsightsPuller");
const prisma = require("../config/prismaClient").default;

async function uploadMetaInsightsToDB() {
  try {
    const { clientsArr, campaignsArr, adSetsArr, adsArr } = await pullMetaInsights();

    console.log("Uploading to database...");

    // ---------------- Clients ----------------
    if (clientsArr.length > 0 && clientsArr) {  // Add here undefined check condition later if needed
      for (const client of clientsArr) {
        await prisma.client.upsert({
          where: { AdAccountId: client.account_id },
          update: { AdAccountName: client.account_name },
          create: {
            AdAccountId: client.account_id,
            AdAccountName: client.account_name,
          },
        });
      }
      console.log(`Upserted ${clientsArr.length} clients.`);
    } else {
      console.log("Client array is empty or undefined, nothing to upload.");
      return;
    }

    // ---------------- Campaigns + Metrics ----------------
    if (campaignsArr.length > 0 && campaignsArr) {
      for (const campaign of campaignsArr) {
        
        const client = clientsArr.find((c) => c.account_id === campaign.account_id);
        console.log("Found client for campaign:", client);
        if (!client) {
          console.error(`No client found for campaign ${campaign.campaign_id}`);
          continue;
        }

        // Ensure campaign exists (unique by campaignId)
        const createdCampaign = await prisma.campaign.upsert({
          where: { campaignId: campaign.campaign_id },
          update: { campaignName: campaign.campaign_name },
          create: {
            campaignId: campaign.campaign_id,
            campaignName: campaign.campaign_name,
            client: { connect: { AdAccountId: client.account_id } },
          },
        });

        // Insert metrics snapshot
        await prisma.campaignLevelMetric.create({
          data: {
            campaignId: createdCampaign.id,
            aov: campaign.aov ?? 0,
            cpm: campaign.cpm ?? 0,
            impressions: campaign.impressions ?? 0,
            learning_phase: campaign.learning_phase ?? false,
            mer: campaign.mer ?? 0,
            revenue: campaign.revenue ?? 0,
            roas: campaign.roas ?? 0,
            spend: campaign.spend ?? 0,
          },
        });
 
      }

      console.log(`Inserted ${campaignsArr.length} campaign records + metrics.`);
    } else {
      console.log("campaign array is empty or undefined, nothing to upload.");
      return;
    }

    // ---------------- AdSets + Metrics ----------------
    if (adSetsArr.length > 0 && adSetsArr) {
      for (const adset of adSetsArr) {
        // Ensure adSet exists
        const createdAdSet = await prisma.adSet.upsert({
          where: { adSetId: adset.adset_id },
          update: { adSetName: adset.adset_name },
          create: {
            adSetId: adset.adset_id,
            adSetName: adset.adset_name,
            campaign: { connect: { campaignId: adset.campaign_id } },
          },
        });

        // Insert metrics snapshot
        await prisma.adSetLevelMetric.create({
          data: {
            adSetId: createdAdSet.id,
            atc: adset.atc ?? 0,
            atcValue: adset.atc_value ?? 0,
            cpa: adset.cpa ?? 0,
            cpatc: adset.cpatc ?? 0,
            cpc: adset.cpc ?? 0,
            cpic: adset.cpic ?? 0,
            ctrAll: adset.ctr_all ?? 0,
            ctrLink: adset.ctr_link ?? 0,
            frequency: adset.frequency ?? 0,
            ic: adset.ic ?? 0,
            icValue: adset.ic_value ?? 0,
            impressions: adset.impressions ?? 0,
            linkClicks: adset.link_clicks ?? 0,
            lpv: adset.lpv ?? 0,
            lpvRate: adset.lpv_rate ?? 0,
            purchaseValue: adset.purchaseValue ?? 0,
            purchases: adset.purchases ?? 0,
            reach: adset.reach ?? 0,
            roas: adset.roas ?? 0,
          },
        });
      }
      console.log(`Inserted ${adSetsArr.length} ad set records + metrics.`);
    } else {
      console.log("Adset array is empty or undefined, nothing to upload.");
      return;
    }

    // ---------------- Ads + Metrics ----------------
    if (adsArr.length > 0 && adsArr) {
      for (const ad of adsArr) {
        // Ensure Ad exists
        const createdAd = await prisma.ad.upsert({
          where: { adId: ad.ad_id },
          update: { adName: ad.ad_name },
          create: {
            adId: ad.ad_id,
            adName: ad.ad_name,
            adSet: { connect: { adSetId: ad.adset_id } },
          },
        });

        // Insert metrics snapshot
        await prisma.adLevelMetric.create({
          data: {
            adId: createdAd.id,
            atc: ad.atc ?? 0,
            ctrAll: ad.ctr_all ?? 0,
            ctrLink: ad.ctr_link ?? 0,
            fatigueFlag: ad.fatigue_flag ?? true,
            ic: ad.ic ?? 0,
            impressions: ad.impressions ?? 0,
            lpvRate: ad.lpv_rate ?? 0,
            purchases: ad.purchases ?? 0,
            thumb_stop_ratio: ad.thumb_stop_ratio ?? 0,
          },
        });
      }
      console.log(`Inserted ${adsArr.length} ad records + metrics.`);
    } else {
      console.log("Ad array is empty or undefined, nothing to upload.");
      return;
    }

    console.log("Upload complete");
  } catch (err) {
    console.error("Error uploading Meta insights to DB:", err.message);
  }
}

module.exports = uploadMetaInsightsToDB;

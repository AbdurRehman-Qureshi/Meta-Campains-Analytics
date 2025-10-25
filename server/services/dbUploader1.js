const pullMetaInsights = require("./metaInsightsPuller");
const prisma = require("../config/prismaClient").default;

// --- ISO week helpers ---
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Monday=1 ... Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
function getISOWeekKey(date = new Date()) {
  const { year, week } = getISOWeek(new Date(date));
  return year * 100 + week; // e.g. 202542
}
function previousISOWeekKey(isoKey) {
  const year = Math.floor(isoKey / 100);
  const week = isoKey % 100;
  if (week > 1) return year * 100 + (week - 1);
  // roll back to last ISO week of previous year
  const dec31 = new Date(Date.UTC(year - 1, 11, 31));
  const { year: y, week: w } = getISOWeek(dec31);
  return y * 100 + w;
}

async function uploadMetaInsightsToDB() {
  try {
    const { clientsArr, campaignsArr, adSetsArr, adsArr } = await pullMetaInsights();

    console.log("Uploading to database...");

    // ---------------- Clients ----------------
    if (clientsArr.length > 0 && clientsArr) {
      for (const client of clientsArr) {
        const createdClient = await prisma.client.upsert({
          where: { AdAccountId: client.account_id },
          update: { AdAccountName: client.account_name, category: client.adAccountCategory },
          create: {
            AdAccountId: client.account_id,
            AdAccountName: client.account_name,
            category: client.adAccountCategory,
          },
        });

        // Determine ISO week key for this pull
        const isoKey = getISOWeekKey(); // based on current server time

        // Find last week for this client
        const lastMetric = await prisma.clientLevelMetric.findFirst({
          where: { clientId: createdClient.id },
          orderBy: { week: "desc" },
        });

        // Skip if we've already inserted metrics for this ISO week
        if (lastMetric && lastMetric.week === isoKey) {
          console.log(`Client ${createdClient.AdAccountId} already has metrics for week ${isoKey}, skipping.`);
        } else {
          const metric = await prisma.clientLevelMetric.create({
            data: {
              clientId: createdClient.id,
              week: isoKey,
              bb: client.spend,
              cpm: client.cpm,
              ctra: client.ctr_all,
              ctrl: client.ctrl,
              catc: client.catc,
              cgb: client.cgb,
              cpa: client.cpa,
              roas: client.roas,
              aov: client.aov,
              leads: client.leads,
              cpl: client.cpl,
            },
          });

          await prisma.clientSummary.upsert({
            where: {
              clientId_createdAt: {
                clientId: createdClient.id,
                createdAt: metric.createdAt,
              },
            },
            update: {},
            create: {
              summary: null,
              status: "pending",
              retryCount: 0,
              lastAttempt: new Date(),
              clientMetric: {
                connect: {
                  clientId_createdAt: {
                    clientId: createdClient.id,
                    createdAt: metric.createdAt,
                  }
                }
              }
            },
          });
        }
      }
      console.log(`Inserted ${clientsArr.length} clients + metrics + summaries.`);
    } else {
      console.log("Client array is empty or undefined, nothing to upload at client level");
      return;
    }

    // ---------------- Campaigns + Metrics + Summary ----------------
    if (campaignsArr.length > 0 && campaignsArr) {
      for (const campaign of campaignsArr) {
        const client = clientsArr.find((c) => c.account_id === campaign.account_id);
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

        const isoKey = getISOWeekKey();

        const lastMetrics = await prisma.campaignLevelMetric.findFirst({
          where: { campaignId: createdCampaign.id },
          orderBy: { createdAt: 'desc' },
        });

        if (lastMetrics && lastMetrics.week === isoKey) {
          console.log(`Campaign ${createdCampaign.campaignId} already has metrics for week ${isoKey}, skipping.`);
        } else {
          const metric = await prisma.campaignLevelMetric.create({
            data: {
              campaignId: createdCampaign.id,
              week: isoKey,
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

          await prisma.campaignSummary.upsert({
            where: {
              campaignId_createdAt: {
                campaignId: createdCampaign.id,
                createdAt: metric.createdAt,
              },
            },
            update: {},
            create: {
              summary: null,
              status: "pending",
              retryCount: 0,
              lastAttempt: new Date(),
              campaignMetric: {
                connect: {
                  campaignId_createdAt: {
                    campaignId: createdCampaign.id,
                    createdAt: metric.createdAt,
                  }
                }
              }
            },
          });
        }
      }
      console.log(`Inserted ${campaignsArr.length} campaign records + metrics + summaries.`);
    } else {
      console.log("campaign array is empty or undefined, nothing to upload.");
      return;
    }

    // ---------------- AdSets + Metrics + Summary ----------------
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

        const isoKey = getISOWeekKey();

        const lastMetric = await prisma.adSetLevelMetric.findFirst({
          where: { adSetId: createdAdSet.id },
          orderBy: { week: "desc" },
        });

        if (lastMetric && lastMetric.week === isoKey) {
          console.log(`AdSet ${createdAdSet.adSetId} already has metrics for week ${isoKey}, skipping.`);
        } else {
          const metric = await prisma.adSetLevelMetric.create({
            data: {
              adSetId: createdAdSet.id,
              week: isoKey,
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

          await prisma.adSetSummary.upsert({
            where: {
              adSetId_createdAt: {
                adSetId: createdAdSet.id,
                createdAt: metric.createdAt,
              },
            },
            update: {},
            create: {
              summary: null,
              status: "pending",
              retryCount: 0,
              lastAttempt: new Date(),
              adSetMetric: {
                connect: {
                  adSetId_createdAt: {
                    adSetId: createdAdSet.id,
                    createdAt: metric.createdAt,
                  }
                }
              }
            },
          });
        }
      }
      console.log(`Inserted ${adSetsArr.length} ad set records + metrics + summaries.`);
    } else {
      console.log("Adset array is empty or undefined, nothing to upload.");
      return;
    }

    // ---------------- Ads + Metrics + Summary ----------------
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

        const isoKey = getISOWeekKey();

        const lastMetric = await prisma.adLevelMetric.findFirst({
          where: { adId: createdAd.id },
          orderBy: { week: "desc" },
        });

        if (lastMetric && lastMetric.week === isoKey) {
          console.log(`Ad ${createdAd.adId} already has metrics for week ${isoKey}, skipping.`);
        } else {
          const metric = await prisma.adLevelMetric.create({
            data: {
              adId: createdAd.id,
              week: isoKey,
              atc: ad.atc ?? 0,
              ctrAll: ad.ctr_all ?? 0,
              ctrLink: ad.ctr_link ?? 0,
              fatigueFlag: ad.fatigue_flag ?? true,
              ic: ad.ic ?? 0,
              impressions: ad.impressions ?? 0,
              lpvRate: ad.lpv_rate ?? 0,
              purchases: ad.purchases ?? 0,
              thumb_stop_ratio: isNaN(ad.thumb_stop_ratio) ? 0 : ad.thumb_stop_ratio,
            },
          });

          await prisma.adSummary.upsert({
            where: {
              adId_createdAt: {
                adId: createdAd.id,
                createdAt: metric.createdAt,
              },
            },
            update: {},
            create: {
              summary: null,
              status: "pending",
              retryCount: 0,
              lastAttempt: new Date(),
              adMetric: {
                connect: {
                  adId_createdAt: {
                    adId: createdAd.id,
                    createdAt: metric.createdAt,
                  }
                }
              }
            },
          });
        }
      }
      console.log(`Inserted ${adsArr.length} ad records + metrics + summaries.`);
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


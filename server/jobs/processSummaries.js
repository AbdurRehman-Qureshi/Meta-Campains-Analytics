require("dotenv").config();
const prisma = require("../config/prismaClient").default;
const { generateSummary } = require("../services/generateSummaries");

/**
 * Batch processor with concurrency & rate limiting support
 */
async function processSummaries(level, batchSize = 5) {

  while(true) {

  
    let candidates = [];
    if (level === "client") {
      candidates = await prisma.clientSummary.findMany({
        where: { status: { in: ["pending", "failed"]} },
        take: batchSize,
      });
    } else if (level === "campaign") {
      candidates = await prisma.campaignSummary.findMany({
        where: { status: { in: ["pending", "failed"]} },
        take: batchSize,
      });
    } else if (level === "adset") {
      candidates= await prisma.adSetSummary.findMany({
        where: { status: { in: ["pending", "failed"]} },
        take: batchSize,
      });
    } else if (level === "ad") {
      candidates= await prisma.adSummary.findMany({
        where: { status: { in: ["pending", "failed"]} },
        take: batchSize,
      });
    } else {
      throw new Error("Invalid level for processSummaries");
    }

    if (candidates.length === 0){
      console.log(`All ${level} summaries status processed.`);
      break;
    }
  

  for (const row of candidates) {
    // fetch metrics snapshot from metrics table
    let currentMetrics, previousMetrics;

      // --- CLIENT LEVEL ---
      if (level === "client") {
        currentMetrics = await prisma.clientLevelMetric.findFirst({
          where: { clientId: row.clientId, createdAt: row.createdAt },
        });

        if (currentMetrics) {
          // Find previous week’s metrics by week number or earlier createdAt
          previousMetrics = await prisma.clientLevelMetric.findFirst({
            where: {
              clientId: row.clientId,
              week: { lt: currentMetrics.week },
            },
            orderBy: { week: "desc" },
          });

          // If no previous data found (new client)
          if (!previousMetrics) {
            previousMetrics = Object.keys(currentMetrics).reduce((acc, key) => {
              acc[key] = 0;
              return acc;
            }, {});
          }

          await generateSummary(level, row.clientId, {
            currentMetrics,
            previousMetrics,
          });
        }
      } else if (level === "campaign") {
      metrics = await prisma.campaignLevelMetric.findFirst({
        where: { campaignId: row.campaignId, createdAt: row.createdAt },
      });
      if (metrics) await generateSummary(level, row.campaignId, metrics);
    } else if (level === "adset") {
      metrics = await prisma.adSetLevelMetric.findFirst({
        where: { adSetId: row.adSetId, createdAt: row.createdAt },
      });
      if (metrics) await generateSummary(level, row.adSetId, metrics);
    } else if (level === "ad") {
      metrics = await prisma.adLevelMetric.findFirst({
        where: { adId: row.adId, createdAt: row.createdAt },
      });
      if (metrics) await generateSummary(level, row.adId, metrics);
    }
  }
  await new Promise((res) => setTimeout(res, 15000)); // throttle to avoid rate limits
}
}

module.exports = { processSummaries };
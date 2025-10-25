require("dotenv").config();
const prisma = require("../config/prismaClient").default;
const { generateSummary } = require("../services/generateSummaries");

// --- ISO week helper ---
function previousISOWeekKey(isoKey) {
  const year = Math.floor(isoKey / 100);
  const week = isoKey % 100;
  if (week > 1) return year * 100 + (week - 1);
  // roll back to last ISO week of previous year
  const dec31 = new Date(Date.UTC(year - 1, 11, 31));
  const d = new Date(Date.UTC(dec31.getUTCFullYear(), dec31.getUTCMonth(), dec31.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() * 100 + weekNo;
}

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
          // Use ISO week helper for previous week lookup
          const prevIsoKey = previousISOWeekKey(currentMetrics.week);
          previousMetrics = await prisma.clientLevelMetric.findFirst({
            where: {
              clientId: row.clientId,
              week: prevIsoKey,
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
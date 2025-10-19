require("dotenv").config();
const client = require("../config/openaiClient").default;
const prisma = require("../config/prismaClient").default;

function pickRelevantMetrics(level, metrics) {
  if (level === "client") {
    return {
      bb: metrics.bb,
      cpm: metrics.cpm,
      ctra: metrics.ctra,
      ctrl: metrics.ctrl,
      catc: metrics.catc,
      cgb: metrics.cgb,
      cpa: metrics.cpa,
      roas: metrics.roas,
      aov: metrics.aov,
      leads: metrics.leads,
      cpl: metrics.cpl,
    };
  } else if (level === "campaign") {
    return {
      roas: metrics.roas,
      mer: metrics.mer,
      aov: metrics.aov,
      revenue: metrics.revenue,
      spend: metrics.spend,
    };
  } else if (level === "adset") {
    return {
      cpa: metrics.cpa,
      ctrLink: metrics.ctrLink,
      purchases: metrics.purchases,
      roas: metrics.roas,
      reach: metrics.reach,
    };
  } else if (level === "ad") {
    return {
      ctrLink: metrics.ctrLink,
      impressions: metrics.impressions,
      lpvRate: metrics.lpvRate,
      purchases: metrics.purchases,
      fatigueFlag: metrics.fatigueFlag,
    };
  }
  return metrics;
}

async function generateSummary(level, entityId, { currentMetrics, previousMetrics }) {
  const currentFiltered = pickRelevantMetrics(level, currentMetrics);
  const previousFiltered = previousMetrics
    ? pickRelevantMetrics(level, previousMetrics)
    : Object.fromEntries(Object.keys(currentFiltered).map((key) => [key, 0]));

  const prompt = `
You are a senior Meta Ads strategist. Compare the following ${level}-level performance data week-over-week and write a concise summary.

### Format:
Observation: [Key changes, % vs previous week, benchmarks missed or exceeded]
Analysis: [Explain reasons behind changes – funnel steps, creative, targeting, etc.]
Action:
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

### Current Week Data:
${JSON.stringify(currentFiltered, null, 2)}

### Previous Week Data:
${JSON.stringify(previousFiltered, null, 2)}

Focus on trend insights — improvements, declines, or anomalies — not raw data. Keep it 5–8 lines total.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a senior Meta Ads strategist." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 600,
    });

    const summary = response.choices[0].message.content;

    // Detect which key to use for updating (based on level)
    const whereClause =
      level === "client"
        ? { clientId_createdAt: { clientId: entityId, createdAt: currentMetrics.createdAt } }
        : level === "campaign"
        ? { campaignId_createdAt: { campaignId: entityId, createdAt: currentMetrics.createdAt } }
        : level === "adset"
        ? { adSetId_createdAt: { adSetId: entityId, createdAt: currentMetrics.createdAt } }
        : { adId_createdAt: { adId: entityId, createdAt: currentMetrics.createdAt } };

    const modelMap = {
      client: prisma.clientSummary,
      campaign: prisma.campaignSummary,
      adset: prisma.adSetSummary,
      ad: prisma.adSummary,
    };

    await modelMap[level].update({
      where: whereClause,
      data: { summary, status: "completed", lastAttempt: new Date() },
    });

    console.log(`✅ ${level} summary generated for ${entityId} (week ${currentMetrics.week})`);

    return summary;
  } catch (err) {
    console.error(`❌ Error generating ${level} summary for ${entityId}:`, err.message);

    const whereClause =
      level === "client"
        ? { clientId_createdAt: { clientId: entityId, createdAt: currentMetrics.createdAt } }
        : level === "campaign"
        ? { campaignId_createdAt: { campaignId: entityId, createdAt: currentMetrics.createdAt } }
        : level === "adset"
        ? { adSetId_createdAt: { adSetId: entityId, createdAt: currentMetrics.createdAt } }
        : { adId_createdAt: { adId: entityId, createdAt: currentMetrics.createdAt } };

    const modelMap = {
      client: prisma.clientSummary,
      campaign: prisma.campaignSummary,
      adset: prisma.adSetSummary,
      ad: prisma.adSummary,
    };

    await modelMap[level].update({
      where: whereClause,
      data: { status: "failed", retryCount: { increment: 1 }, lastAttempt: new Date() },
    });

    return null;
  }
}

module.exports = { generateSummary };

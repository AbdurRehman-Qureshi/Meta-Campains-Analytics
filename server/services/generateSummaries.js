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
  } else if (level === "campaign"){
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

async function generateSummary(level, entityId, metrics) {
  const filteredMetrics = pickRelevantMetrics(level, metrics);

  const prompt = `You are a senior Meta Ads strategist. Given the following ${level}-level performance data, write a concise summary in this format:

Observation: [Key metric changes, % vs previous period, and any benchmarks missed or exceeded.]
Analysis: [Brief, data-driven explanation for the change, referencing funnel steps, audience, creative, or product issues.]
Action:
- [Actionable recommendation 1]
- [Actionable recommendation 2]
- [Actionable recommendation 3]

Keep the summary about 5–8 lines. Use bullet points for actions.

Data:
${JSON.stringify(filteredMetrics, null, 2)}
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
    
    if (level === "client") {
      await prisma.clientSummary.update({
        where: { clientId_createdAt: { clientId: entityId, createdAt: metrics.createdAt } },
        data: { summary, status: "completed", lastAttempt: new Date() },
      });
    }

    else if (level === "campaign") {
      await prisma.campaignSummary.update({
        where: { campaignId_createdAt: { campaignId: entityId, createdAt: metrics.createdAt}},
        data: { summary, status:  "completed", lastAttempt: new Date() },
      })
    }

    else if (level === "adset") {
      await prisma.adSetSummary.update({
        where: { adSetId_createdAt: {adSetId: entityId, createdAt: metrics.createdAt}},
        data: { summary, status: "completed", lastAttempt: new Date() },
      })
    }
    else if (level === "ad") {
      await prisma.adSummary.update({
        where: { adId_createdAt: {adId: entityId, createdAt: metrics.createdAt}},
        data: { summary, status: "completed", lastAttempt: new Date() },
      })
    }
    // // Idempotent UPSERT into summaries table
    // await prisma.summaries.upsert({
    //   where: { entity_id_level: { entity_id: entityId, level } },
    //   update: {
    //     summary,
    //     status: "completed",
    //     last_attempt: new Date(),
    //   },
    //   create: {
    //     entity_id: entityId,
    //     level,
    //     summary,
    //     status: "completed",
    //   },
    // });

    return summary;
  } catch (err) {
    console.error(`❌ Error generating ${level} summary for ${entityId}:`, err.message);
    
    if (level === "client") {
      await prisma.clientSummary.update({
        where: { clientId_createdAt: { clientId: entityId, createdAt: metrics.createdAt } },
        data: { status: "failed", retryCount: { increment: 1 }, lastAttempt: new Date() },
      });
    }
    
    else if (level === "campaign") {
      await prisma.campaignSummary.update({
        where: { campaignId_createdAt: { campaignId: entityId, createdAt: metrics.createdAt } },
        data: { status: "failed", retryCount: { increment: 1 }, lastAttempt: new Date() },
      });
    } else if (level === "adset") {
      await prisma.adSetSummary.update({
        where: { adSetId_createdAt: { adSetId: entityId, createdAt: metrics.createdAt } },
        data: { status: "failed", retryCount: { increment: 1 }, lastAttempt: new Date() },
      });
    } else if (level === "ad") {
      await prisma.adSummary.update({
        where: { adId_createdAt: { adId: entityId, createdAt: metrics.createdAt } },
        data: { status: "failed", retryCount: { increment: 1 }, lastAttempt: new Date() },
      });
    }

    return null;
  }
}

module.exports = { generateSummary };

































// require("dotenv").config();
// const client = require("../config/openaiClient").default;


// async function generateSummary(level, data) {
//   const prompt = `You are a senior Meta Ads strategist. Given the following ${level}-level performance data, write a concise summary in this format:

// Observation: [Key metric changes, % vs previous period, and any benchmarks missed or exceeded.]
// Analysis: [Brief, data-driven explanation for the change, referencing funnel steps, audience, creative, or product issues.]
// Action:
// - [Actionable recommendation 1]
// - [Actionable recommendation 2]
// - [Actionable recommendation 3]

// Be specific, use numbers from the data, and keep the summary about 5–8 lines. Use bullet points for actions. Example:

// Observation: ROAS fell to 1.4 this week (−25% vs last week). CPA increased to $42 (target ≤ $35). Funnel leak at ATC rate = 6% (low vs benchmark 10–12%).
// Analysis: Traffic quality is fine (CTR Link 1.2%, LPV rate 82%). Drop mainly from weak product fit/price perception → low ATC rate.
// Action:
// - Update product page with stronger trust badges + highlight "Free returns" USP.
// - Add price anchoring (bundle discount, limited-time offer).
// - Launch new creative angle focusing on value/offer instead of generic product shots.

// Data:
// ${JSON.stringify(data, null, 2)}
// `;
    
//     try {
//     const response = await client.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//          { role: "system", content: "You are a senior Meta Ads strategist." },
//          { role: "user", content: prompt },
//        ],
//        temperature: 0.6,
//        max_tokens: 1500,
//     });
//     return response.choices[0].message.content;

// } catch (err) {
//     console.error(`Error generating ${level} summary:`, err.message);
//     return `Failed to generate ${level} summary.`;

//     console.error('Error generating insights:', error.message);
    
//     // // Provide more specific error messages
//     // if (error.code === 'invalid_api_key') {
//     //   console.error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
//     // } else if (error.code === 'insufficient_quota') {
//     //   console.error('OpenAI API quota exceeded. Please check your billing details.');
//     // } else if (error.code === 'rate_limit_exceeded') {
//     //   console.error('OpenAI API rate limit exceeded. Please try again later.');
//     // }
    
//     // return null;
// }
    
// }

// module.exports = { generateSummary };

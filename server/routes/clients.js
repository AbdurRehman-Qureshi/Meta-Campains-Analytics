const express = require('express');
const router = express.Router();
const prisma = require('../config/prismaClient').default;

// Helper: get metrics fields by category
function getMetricsFieldsByCategory(category) {
  if (category === "ECOMMERCE") {
    return [
      "id", "campaignId", "createdAt", "cpm", "ctrAll", "ctrLink", "atc", "cpa", "roas", "aov", "spend", "impressions", "revenue"
    ];
  } else if (category === "LEADS") {
    // Only fields that exist in adSetLevelMetric
    return [
      "id", "adSetId", "createdAt", "ctrAll", "ctrLink", "purchases", "cpa", "impressions", "reach", "roas"
    ];
  }
  return [];
}

function formatPercentChange(current, previous) {
  if (current == null || previous == null) return "N/A";
  if (previous === 0) {
    if (current === 0) return "0%";
    if (current > 0) return "New";
  }
  const rawChange = ((current - previous) / Math.abs(previous)) * 100;
  if (isNaN(rawChange)) return "N/A";
  const rounded = Math.round(rawChange);
  return (rounded > 0 ? "+" : "") + rounded + "%";
}

async function getMetricWithChange({ model, where, metricsFields, week }) {
  // Fetch current and previous week metrics
  const currentMetric = await model.findFirst({
    where: { ...where, week: week },
    orderBy: { createdAt: 'desc' },
    select: metricsFields.reduce((acc, field) => { acc[field] = true; return acc; }, {})
  });
  const previousMetric = await model.findFirst({
    where: { ...where, week: week - 1 },
    orderBy: { createdAt: 'desc' },
    select: metricsFields.reduce((acc, field) => { acc[field] = true; return acc; }, {})
  });

  // Build response for each metric
  const result = {};
  for (const field of metricsFields) {
    const currentValue = currentMetric ? currentMetric[field] : null;
    const previousValue = previousMetric ? previousMetric[field] : null;
    result[field] = {
      value: currentValue,
      change: formatPercentChange(currentValue, previousValue)
    };
  }
  return result;
}

async function getSummaryForEntity({ level, entityId, week }) {
  if (level === "LEADS") {
    // adSet summary
    const metric = await prisma.adSetLevelMetric.findFirst({
      where: { adSetId: entityId, week },
      select: { createdAt: true }
    });
    if (!metric) return null;
    const summary = await prisma.adSetSummary.findFirst({
      where: { adSetId: entityId, createdAt: metric.createdAt },
      select: { summary: true, status: true }
    });
    return summary;
  } else {
    // campaign summary
    const metric = await prisma.campaignLevelMetric.findFirst({
      where: { campaignId: entityId, week },
      select: { createdAt: true }
    });
    if (!metric) return null;
    const summary = await prisma.campaignSummary.findFirst({
      where: { campaignId: entityId, createdAt: metric.createdAt },
      select: { summary: true, status: true }
    });
    return summary;
  }
}

// Get all clients by category
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category: category.toUpperCase() }  : {};
    
    const clients = await prisma.client.findMany({
      where,
      orderBy: { AdAccountName: 'asc' }
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get clients with metrics by category
router.get('/with-metrics', async (req, res) => {
  try {
    const { category, week } = req.query;
    
    if (!category) {
      return res.status(400).json({ error: "category is required" });
    }

    const weekInt = week ? parseInt(week) : undefined;
    const metricsFields = getMetricsFieldsByCategory(category.toUpperCase());

    // Array of selected category client will made here
    const clients = await prisma.client.findMany({
      where: { category: category.toUpperCase() },   
      orderBy: { AdAccountName: 'asc' }
    });

    const results = [];

    for (const client of clients) {
      let campaignsWithMetrics = [];

      if (category.toUpperCase() === "LEADS") {
        
        const adSets = await prisma.adSet.findMany({
          where: { campaignId: { 
            in: (await prisma.campaign.findMany({ 
              where: { clientId: client.id }, 
              select: { id: true } 
            })).map(c => c.id) 
          }},
          select: { id: true, adSetId: true, adSetName: true }
        });
        
        for (const adSet of adSets) {
          const metrics = await getMetricWithChange({
            model: prisma.adSetLevelMetric,
            where: { adSetId: adSet.id },
            metricsFields,
            week: weekInt
          });
          const summary = await getSummaryForEntity({
            level: "LEADS",
            entityId: adSet.id,
            week: weekInt
          });
          campaignsWithMetrics.push({
            id: adSet.id,
            campaignName: adSet.adSetName,
            metrics,
            summary: summary?.summary || null,
            summaryStatus: summary?.status || null
          });
        }
      } else {
        const campaigns = await prisma.campaign.findMany({
          where: { clientId: client.id },
          select: { id: true, campaignId: true, campaignName: true }
        });
        for (const campaign of campaigns) {
          const metrics = await getMetricWithChange({
            model: prisma.campaignLevelMetric,
            where: { campaignId: campaign.id },
            metricsFields,
            week: weekInt
          });
          const summary = await getSummaryForEntity({
            level: "ECOMMERCE",
            entityId: campaign.id,
            week: weekInt
          });
          campaignsWithMetrics.push({
            ...campaign,
            metrics,
            summary: summary?.summary || null,
            summaryStatus: summary?.status || null
          });
        }
      }
      results.push({
        client,
        campaigns: campaignsWithMetrics
      });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Get available weeks for the selected category
router.get('/available-weeks', async (req, res) => {
  try {

    const { category } = req.query;
    if (!category){
      return res.status(400).json({ error: "category is required" });
    }

    let weeks = [];

    if (category.toUpperCase() === "LEADS") {

      weeks = await prisma.campaignLevelMetric.findMany({
        distinct: ['week'],
        select: { week: true },
        orderBy: { week: 'asc' }
      });

    } 
    
    else {

      weeks = await prisma.campaignLevelMetric.findMany({
        distinct: ['week'],
        select: { week: true },
        orderBy: { week: 'asc' }
      });

    }

    res.json(weeks.map(w => w.week));
  } 
  
  catch (err) {
    
    res.status(500).json({ error: err.message });
  
  }
});

module.exports = router;
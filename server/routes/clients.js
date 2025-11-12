const express = require('express');
const router = express.Router();
const prisma = require('../config/prismaClient').default;

// --- ISO helpers (server-side) ---
function getISOPrevKey(key) {
  const year = Math.floor(key / 100);
  const week = key % 100;
  if (week > 1) return year * 100 + (week - 1);
  // previous year's last ISO week
  const dec31 = new Date(Date.UTC(year - 1, 11, 31));
  const d = new Date(Date.UTC(dec31.getUTCFullYear(), dec31.getUTCMonth(), dec31.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() * 100 + weekNo;
}

// -----------------------------
// Helper: Get metric fields by category
// -----------------------------
function getMetricsFieldsByCategory(category) {
  category = category?.toUpperCase();
  if (category === "ECOMMERCE") {
    return ["bb", "cpm", "ctra", "ctrl", "catc", "cgb", "cpa", "roas", "aov"];
  } else if (category === "LEADS") {
    return ["bb", "cpm", "ctra", "ctrl", "leads", "cpl"];
  }
  return [];
}

// -----------------------------
// Helper: Format percentage change
// -----------------------------
function formatPercentChange(current, previous) {
  if (current == null && previous == null) return "N/A";

  // Case: new client (only one week of data)
  if (previous == null || previous === 0) {
    if (!current || current === 0) return "0%";
    return `+${Math.round(current * 100)}%`; // absolute increase from 0
  }

  const rawChange = ((current - previous) / Math.abs(previous)) * 100;
  if (isNaN(rawChange)) return "N/A";

  const rounded = Math.round(rawChange);

  // Show the real value if between -15% and +15%
  if (rounded >= -15 && rounded <= 15) {
    return (rounded > 0 ? "+" : "") + rounded + "%";
  }

  return (rounded > 0 ? "+" : "") + rounded + "%";
}

// -----------------------------
// Helper: Fetch metrics for current and previous ISO week efficiently
// -----------------------------
async function getMetricWithChange({ model, where, metricsFields, week }) {
  // week is ISO key (YYYYWW)
  const prevWeek = getISOPrevKey(Number(week));

  const metrics = await model.findMany({
    where: { ...where, week: { in: [Number(week), Number(prevWeek)] } },
    orderBy: { week: 'desc' },
    select: metricsFields.reduce((acc, f) => (acc[f] = true, acc), { week: true })
  });

  const currentMetric = metrics.find(m => m.week === Number(week));
  const previousMetric = metrics.find(m => m.week === Number(prevWeek));

  const result = {};
  for (const field of metricsFields) {
    const currentValue = currentMetric ? currentMetric[field] : null;
    const previousValue = previousMetric ? previousMetric[field] : null;

    // If field is 'bb' or 'leads', show raw value only
    if (field === 'bb' || field === 'leads') {
      result[field] = {
        value: currentValue,
        change: null
      };
    } else {
      result[field] = {
        value: currentValue,
        change: formatPercentChange(currentValue, previousValue)
      };
    }
  }
  return result;
}

// -----------------------------
// Helper: Fetch summary for campaign/adset entity
// -----------------------------
async function getSummaryForEntity({ level, entityId, week }) {
  if (level === "LEADS") {
    const summary = await prisma.adSetSummary.findFirst({
      where: { adSetId: entityId, week },
      select: { summary: true, status: true },
      orderBy: { createdAt: 'desc' }
    });
    return summary;
  } else {
    const summary = await prisma.campaignSummary.findFirst({
      where: { campaignId: entityId, week },
      select: { summary: true, status: true },
      orderBy: { createdAt: 'desc' }
    });
    return summary;
  }
}

// -----------------------------
// Get available weeks by category
// -----------------------------
router.get('/available-weeks', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ error: "category is required" });
    }

    const upperCategory = category.toUpperCase();

    let weeks = await prisma.clientLevelMetric.findMany({
      where: { client: { category: upperCategory } },
      distinct: ['week'],
      select: { week: true },
      orderBy: { week: 'asc' }
    });

    if (!weeks || weeks.length === 0) {
      return res.json([]);
    }

    // return numeric ISO keys (frontend will format)
    res.json(weeks.map(w => w.week));
  } catch (err) {
    console.error("Error in /available-weeks:", err.message);
    res.status(500).json({ error: "Database error. Please try again later." });
  }
});

// -----------------------------
// Get client-level cards by category and week
// -----------------------------
router.get('/client-level-cards', async (req, res) => {
  try {
    const { category, week } = req.query;
    if (!category) return res.status(400).json({ error: "category is required" });
    if (!week) return res.status(400).json({ error: "week is required" });

    const upperCategory = category.toUpperCase();
    const weekInt = parseInt(week);
    const metricsFields = getMetricsFieldsByCategory(upperCategory);

    // Fetch all clients of that category
    const clients = await prisma.client.findMany({
      where: { category: upperCategory },
      orderBy: { AdAccountName: 'asc' }
    });

    if (!clients || clients.length === 0) {
      return res.json([]); // No clients found
    }

    // Process all clients in parallel
    const results = await Promise.all(clients.map(async (client) => {
      const metrics = await getMetricWithChange({
        model: prisma.clientLevelMetric,
        where: { clientId: client.id },
        metricsFields,
        week: weekInt
      });

      // First, get the metric row for this week
      const metricRow = await prisma.clientLevelMetric.findFirst({
        where: { clientId: client.id, week: weekInt },
        orderBy: { createdAt: 'desc' }
      });

      let summaryRow = null;
      if (metricRow) {
        summaryRow = await prisma.clientSummary.findFirst({
          where: {
            clientId: client.id,
            createdAt: metricRow.createdAt
          },
          select: {
            summary: true,
            status: true
          }
        });
      }

      return {
        client: {
          id: client.id,
          AdAccountId: client.AdAccountId,
          AdAccountName: client.AdAccountName,
          category: client.category,
        },
        metrics: metrics || {},
        summary: summaryRow?.summary || null,
        summaryStatus: summaryRow?.status || null
      };
    }));

    res.json(results);
  } catch (err) {
      console.error("Error in /client-level-cards:", err.message);
      res.status(500).json({ error: "Database error. Please try again later." });
  }
});

// -----------------------------
// Get metric history for a client (all weeks)
// -----------------------------
router.get('/client-metric-history', async (req, res) => {
  const { clientId, category } = req.query;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const metricsFields = getMetricsFieldsByCategory(category?.toUpperCase() || "ECOMMERCE");

  // Fetch all weeks for this client
  const history = await prisma.clientLevelMetric.findMany({
    where: { clientId },
    orderBy: { week: 'desc' },
    select: metricsFields.reduce((acc, f) => (acc[f] = true, acc), { week: true, createdAt: true })
  });

  // Fetch summaries for each week
  const summaries = await prisma.clientSummary.findMany({
    where: { clientId },
    select: { createdAt: true, summary: true, status: true }
  });

  // Attach summary to each week
  const historyWithSummary = history.map(weekObj => {
    const summaryObj = summaries.find(s => s.createdAt.getTime() === weekObj.createdAt.getTime());
    return {
      ...weekObj,
      summary: summaryObj?.summary || null,
      summaryStatus: summaryObj?.status || null
    };
  });

  res.json(historyWithSummary);
});

router.post('/add-new-client', async (req, res) => {
  try {
    const { adAccountId, adAccountName, category } = req.body;
    const missingFields = [];

    if (!adAccountId || !adAccountName || !category) {
      if (!adAccountId) missingFields.push("adAccountId");
      if (!adAccountName) missingFields.push("adAccountName");
      if (!category) missingFields.push("category");

      return res.status(400).json({
        error: `Missing or undefined field(s): ${missingFields.join(", ")}`
      });
    }

    const existingAccount = await prisma.AdAccounts.findFirst({
      where: { AdAccountId: adAccountId }
    });

    if (existingAccount) {
      return res.status(409).json({
        error: `The account with ID ${adAccountId} already exists in AdAccounts table.`
      });
    }

    console.log(`Inserting new client with id: ${adAccountId} into table...`);
    const newClient = await prisma.AdAccounts.create({
      data: {
        AdAccountId: adAccountId,
        AdAccountName: adAccountName,
        category: category
      }
    });

    console.log(`Client with id: ${adAccountId} successfully inserted.`);
    return res.status(201).json({
      message: "Client added successfully.",
      client: newClient
    });

  } catch (error) {
    console.error("Error occurred while adding new client:", error);

    return res.status(500).json({
      error: "Internal Server Error. Please try again later.",
      details: error.message
    });
  }
});


module.exports = router;

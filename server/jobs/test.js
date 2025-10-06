// const { OpenAI } = require('openai');
// const { createClient } = require('@supabase/supabase-js');

// // Initialize clients with error handling
// let openai;
// let supabase;

// try {
//   // Check if required environment variables are present
//   if (!process.env.OPENAI_API_KEY) {
//     throw new Error('OPENAI_API_KEY environment variable is required');
//   }
//   if (!process.env.SUPABASE_URL) {
//     throw new Error('SUPABASE_URL environment variable is required');
//   }
//   if (!process.env.SUPABASE_ANON_KEY) {
//     throw new Error('SUPABASE_ANON_KEY environment variable is required');
//   }

//   openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//   });

//   supabase = createClient(
//     process.env.SUPABASE_URL,
//     process.env.SUPABASE_ANON_KEY
//   );

//   console.log('OpenAI and Supabase clients initialized successfully');
// } catch (error) {
//   console.error('Error initializing clients:', error.message);
//   // Don't throw here, let the functions handle the error gracefully
// }

// /**
//  * Fetches data from Supabase for all levels
//  */
// async function fetchMarketingData(timeRange = 'last_7d', level = 'all') {
//   try {
//     if (!supabase) {
//       throw new Error('Supabase client not initialized. Check your environment variables.');
//     }
    
//     const dateFilter = getDateRange(timeRange);
//     let data = {};
    
//     // Fetch data based on requested level
//     if (level === 'all' || level === 'campaign') {
//       console.log('Fetching campaign level data...');
//       const { data: campaignData, error: campaignError } = await supabase
//         .from('campaignLevelMetric')
//         .select('*')
//         .gte('createdAt', dateFilter);
      
//       if (campaignError) throw campaignError;
//       data.campaign = campaignData;
//       console.log(Found ${campaignData?.length || 0} campaign records);
//     }
    
//     if (level === 'all' || level === 'adset') {
//       console.log('Fetching adset level data...');
//       const { data: adsetData, error: adsetError } = await supabase
//         .from('adSetLevelMetric')
//         .select('*')
//         .gte('createdAt', dateFilter);
      
//       if (adsetError) throw adsetError;
//       data.adset = adsetData;
//       console.log(Found ${adsetData?.length || 0} adset records);
//     }
    
//     if (level === 'all' || level === 'ad') {
//       console.log('Fetching ad level data...');
//       const { data: adData, error: adError } = await supabase
//         .from('adLevelMetric')
//         .select('*')
//         .gte('createdAt', dateFilter);
      
//       if (adError) throw adError;
//       data.ad = adData;
//       console.log(Found ${adData?.length || 0} ad records);
//     }
    
//     return data;
//   } catch (error) {
//     console.error('Error fetching marketing data:', error.message);
//     return {};
//   }
// }

// /**
//  * Helper function to calculate date ranges
//  */
// function getDateRange(timeRange) {
//   const now = new Date();
//   switch(timeRange) {
//     case 'last_3d':
//       return new Date(now.setDate(now.getDate() - 3)).toISOString();
//     case 'last_7d':
//     default:
//       return new Date(now.setDate(now.getDate() - 7)).toISOString();
//   }
// }

// /**
//  * Generates insights using GPT-3.5-turbo for all levels
//  */
// async function generateMultiLevelInsights(marketingData) {
//   try {
//     if (!openai) {
//       throw new Error('OpenAI client not initialized. Check your API key.');
//     }
    
//     const prompt = createMultiLevelAnalysisPrompt(marketingData);
    
//     console.log('Sending request to OpenAI API...');
//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: `You are a digital marketing analyst specializing in Meta advertising campaigns. 
//           Provide concise, actionable insights with specific observations, analysis, and recommended actions.
//           Analyze data at campaign, ad set, and ad levels. Provide separate insights for each level when relevant.`
//         },
//         {
//           role: "user",
//           content: prompt
//         }
//       ],
//       temperature: 0.7,
//       max_tokens: 1500
//     });
    
//     console.log('OpenAI API response received successfully');
//     return completion.choices[0].message.content;
//   } catch (error) {
//     console.error('Error generating insights:', error.message);
    
//     // Provide more specific error messages
//     if (error.code === 'invalid_api_key') {
//       console.error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
//     } else if (error.code === 'insufficient_quota') {
//       console.error('OpenAI API quota exceeded. Please check your billing details.');
//     } else if (error.code === 'rate_limit_exceeded') {
//       console.error('OpenAI API rate limit exceeded. Please try again later.');
//     }
    
//     return null;
//   }
// }

// /**
//  * Creates a structured prompt for multi-level GPT analysis
//  */
// function createMultiLevelAnalysisPrompt(marketingData) {
//   // Format the data for the prompt
//   const formattedData = {};
  
//   if (marketingData.campaign && marketingData.campaign.length > 0) {
//     formattedData.campaign = marketingData.campaign.map(item => ({
//       name: item.campaignName || item.name,
//       id: item.id,
//       roas: item.roas,
//       cpa: item.cpa,
//       spend: item.spend,
//       impressions: item.impressions,
//       clicks: item.clicks,
//       conversions: item.conversions,
//       createdAt: item.createdAt,
//       // Add other relevant campaign metrics
//     }));
//   }
  
//   if (marketingData.adset && marketingData.adset.length > 0) {
//     formattedData.adset = marketingData.adset.map(item => ({
//       name: item.adSetName || item.name,
//       id: item.id,
//       campaignId: item.campaignId,
//       roas: item.roas,
//       cpa: item.cpa,
//       ctr: item.ctr,
//       frequency: item.frequency,
//       reach: item.reach,
//       atcRate: item.atcRate,
//       icRate: item.icRate, // Initiate Checkout Rate
//       createdAt: item.createdAt,
//       // Add other relevant adset metrics
//     }));
//   }
  
//   if (marketingData.ad && marketingData.ad.length > 0) {
//     formattedData.ad = marketingData.ad.map(item => ({
//       name: item.adName || item.name,
//       id: item.id,
//       adSetId: item.adSetId,
//       creative: item.creative,
//       ctr: item.ctr,
//       cpc: item.cpc,
//       cpm: item.cpm,
//       conversionRate: item.conversionRate,
//       createdAt: item.createdAt,
//       // Add other relevant ad metrics
//     }));
//   }
  
//   // Check if we have any data to analyze
//   const hasData = Object.values(formattedData).some(levelData => levelData && levelData.length > 0);
  
//   if (!hasData) {
//     return "No marketing data available for analysis. Please provide campaign, adset, or ad level data.";
//   }
  
//   return `
//   Analyze this multi-level marketing performance data and provide insights in the following format for each relevant level:
  
//   For each level (campaign, ad set, ad), provide:
//   Observation: [Key performance changes]
//   Analysis: [Root cause analysis]
//   Action: [Specific recommendations]
  
//   Marketing Data:
//   ${JSON.stringify(formattedData, null, 2)}
  
//   Please provide insights similar to these examples:
  
//   Example 1: (On campaign level – ROAS drop issue)
//   Observation: ROAS fell to 1.4 this week (−25% vs last week). CPA increased to $42 (target ≤ $35). Funnel leak at ATC rate = 6% (low vs benchmark 10–12%).
//   Analysis: Traffic quality is fine (CTR Link 1.2%, LPV rate 82%). Drop mainly from weak product fit/price perception → low ATC rate.
//   Action:
//   - Update product page with stronger trust badges + highlight "Free returns" USP.
//   - Add price anchoring (bundle discount, limited-time offer).
//   - Launch new creative angle focusing on value/offer instead of generic product shots.
  
//   Example 2: (On ad set level – checkout friction issue)
//   Observation: CPA stable at $38, but IC rate dropped to 35% (benchmark 40–70%). CPIC increased to $19.
//   Analysis: ATC rate 12% (healthy), so product appeal is fine. Problem is checkout friction. Likely due to limited payment options on mobile (Geo: NL) → users drop at payment step.
//   Action:
//   - Enable guest checkout.
//   - Add iDEAL + Klarna for NL users.
//   - Show shipping/taxes upfront (currently only visible on step 2).
  
//   Example 3: (On ad level – creative fatigue issue)
//   Observation: CTR Link dropped from 1.5% → 0.8% over 10 days at flat budget. CPM increased from $6 → $8. CPC rose to $1.00 (previously $0.60).
//   Analysis: Classic creative fatigue: same ads running too long. Audience is still broad (CPM acceptable), but thumb-stop power is down.
//   Action:
//   - Rotate in 3 new creatives with distinct angles:
//     * Social proof (UGC/reviews).
//     * Problem/solution demo.
//     * Offer-driven (bundle discount).
//   - Refresh thumbnail & hook in first 3 seconds.
//   `;
// }

// /**
//  * Saves insights to Supabase with level information
//  */
// async function saveInsightsToSupabase(insights, timeRange, level = 'all') {
//   try {
//     if (!supabase) {
//       throw new Error('Supabase client not initialized');
//     }
    
//     const { data, error } = await supabase
//       .from('marketing_insights')
//       .insert([
//         {
//           insights: insights,
//           time_range: timeRange,
//           level: level,
//           created_at: new Date().toISOString()
//         }
//       ]);
    
//     if (error) throw error;
//     console.log('Insights saved to Supabase successfully');
//     return data;
//   } catch (error) {
//     console.error('Error saving insights to Supabase:', error.message);
    
//     // Check if table exists
//     if (error.code === '42P01') {
//       console.error('Table "marketing_insights" does not exist. Please create it in Supabase.');
//       console.error('Run this SQL in Supabase SQL Editor:');
//       console.error(`
//         CREATE TABLE marketing_insights (
//           id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//           insights TEXT NOT NULL,
//           time_range TEXT NOT NULL,
//           level TEXT NOT NULL DEFAULT 'all',
//           created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
//         );
//       `);
//     }
    
//     return null;
//   }
// }

// /**
//  * Main function to run the analysis for all levels
//  */
// async function runMarketingAnalysis(timeRange = 'last_7d', level = 'all') {
//   console.log(Starting marketing analysis for ${level} level(s) with ${timeRange} data...);
  
//   // Check if clients are initialized
//   if (!openai || !supabase) {
//     console.error('Analysis aborted: Clients not initialized properly');
//     return;
//   }
  
//   // Fetch data from Supabase
//   const marketingData = await fetchMarketingData(timeRange, level);
  
//   // Check if we have data for the requested level
//   const hasData = Object.values(marketingData).some(levelData => levelData && levelData.length > 0);
  
//   if (!hasData) {
//     console.log('No marketing data found for the specified time range and level.');
//     return;
//   }
  
//   // Generate insights using GPT
//   const insights = await generateMultiLevelInsights(marketingData);
  
//   if (insights) {
//     // Save insights to Supabase
//     await saveInsightsToSupabase(insights, timeRange, level);
//     console.log('Multi-level insights generated and saved successfully');
//     console.log('Insights preview:', insights.substring(0, 200) + '...');
//   } else {
//     console.log('Failed to generate insights.');
//   }
// }

// /**
//  * Individual level analysis functions
//  */
// async function runCampaignAnalysis(timeRange = 'last_7d') {
//   return runMarketingAnalysis(timeRange, 'campaign');
// }

// async function runAdSetAnalysis(timeRange = 'last_7d') {
//   return runMarketingAnalysis(timeRange, 'adset');
// }

// async function runAdAnalysis(timeRange = 'last_7d') {
//   return runMarketingAnalysis(timeRange, 'ad');
// }

// module.exports = {
//   runMarketingAnalysis,
//   runCampaignAnalysis,
//   runAdSetAnalysis,
//   runAdAnalysis
// };
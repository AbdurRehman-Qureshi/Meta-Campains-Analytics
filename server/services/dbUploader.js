const pullMetaInsights = require('./metaInsightsPuller');
const supabase = require('../config/supabaseClient').default


async function uploadMetaInsightsToDB() {
    try {
        const { campaignsArr, metricsArr } = await pullMetaInsights();
        
        console.log('Uploading to database...');

        if (campaignsArr.length === 0 || metricsArr.length === 0) {
            console.log('No data to upload to the database.');
            return;
        }

        // Upsert campaigns
        const { error: campaignError } = await supabase
            .from('campaigns')
            .upsert(campaignsArr, { onConflict: 'campaign_id' });

        if (campaignError) {
            throw campaignError;
        }
        console.log(`Upserted ${campaignsArr.length} campaigns.`);

        // Insert metrics
        const { error: metricsError } = await supabase
            .from('metrics')
            .insert(metricsArr);

        if (metricsError) {
            throw metricsError;
        }
        console.log(`Inserted ${metricsArr.length} metrics.`);
        console.log('Meta insights successfully uploaded to the database.');
    } catch (err) {
        console.error('Error uploading Meta insights to DB:', err.message);
    }
}
module.exports = uploadMetaInsightsToDB;
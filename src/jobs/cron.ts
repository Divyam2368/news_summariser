import cron from 'node-cron';
import {runNewsPipeline} from "./news_pipeline";



// Tip for local testing: Use '*/5 * * * *' to fire it every 5 minutes instead!
// 0 0 * * * every midnight
// keeping it to 30 minutes to freshen the news
cron.schedule('*/30 * * * *', async () => {
    console.log('\n⏰ [CRON] Heartbeat detected. Triggering automated news pipeline...');

    try {
        // This fetches the top news and dumps them rapidly into the BullMQ queue
        await runNewsPipeline();
        console.log('⏰ [CRON] Pipeline tasks successfully pushed to active background workers.');
    } catch (error) {
        console.error('🚨 [CRON] Pipeline failed during automated execution:', error);
    }
});

console.log('📅 [CRON] Automated scheduling engine is initialized and active.');

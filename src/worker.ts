import express from 'express';
import { Worker } from 'bullmq';
import { processArticle } from './services/article_processor';
import { connectionConfig } from './jobs/queue';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
    res.status(200).send('Worker is alive and processing queue!');
});

app.listen(PORT, () => {
    console.log(`\n🕵️‍♂️ [FREE TIER HACK] Dummy web server listening on port ${PORT}`);
});
console.log('👷 [WORKER BOOT] Background Worker process is starting...');

export const articleWorker = new Worker(
    'news-processing-queue',
    async (job) => {
        const { title, url } = job.data;
        await processArticle(title, url);
    },
    {
        connection: connectionConfig,
        concurrency: 2,
    }
);

articleWorker.on('completed', (job) => {
    console.log(`🏁 [QUEUE] Job ${job.id} completed successfully.`);
});

articleWorker.on('failed', (job, err) => {
    console.log(`⚠️ [QUEUE] Job skipped (${job?.data.url || 'Unknown URL'}): ${err.message}`);
});

process.on('SIGTERM', async () => {
    console.log('👋 [WORKER SHUTDOWN] SIGTERM received. Closing worker connections...');
    await articleWorker.close();
    process.exit(0);
});

console.log('🚀 [WORKER READY] BullMQ worker is actively listening for jobs...');
import { Queue, Worker } from 'bullmq';
import { processArticle } from '../services/article_processor';

// Define the connection settings directly (bypassing the IORedis type clash)
const connectionConfig = {
    host: '127.0.0.1',
    port: 6379,
};

// 1. Instantiate the Queue using the config object
export const articleQueue = new Queue('news-processing-queue', {
    connection: connectionConfig
});

// 2. Instantiate the Worker using the same config object
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

// Optional: Global Event Listeners for clean terminal logs
articleWorker.on('completed', (job) => {
    console.log(`🏁 [QUEUE] Job ${job.id} completed successfully.`);
});

articleWorker.on('failed', (job, err) => {
    console.error(`🚨 [QUEUE] Job ${job?.id} failed:`, err.message);
});
import { Queue } from 'bullmq';
import { processArticle } from '../services/article_processor';

// Define the connection settings directly (bypassing the IORedis type clash)
export const connectionConfig = {
    host: process.env.REDIS_HOST,
};

// 1. Instantiate the Queue using the config object
export const articleQueue = new Queue('news-processing-queue', {
    connection: connectionConfig
});


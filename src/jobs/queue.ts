import { Queue } from 'bullmq';
import { processArticle } from '../services/article_processor';
import Redis from 'ioredis';
// Define the connection settings directly (bypassing the IORedis type clash)
export const redisConnection = process.env.REDIS_HOST
    ? new Redis(process.env.REDIS_HOST, { maxRetriesPerRequest: null })
    : new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null });

// 1. Instantiate the Queue using the config object
export const articleQueue = new Queue('news-processing-queue', {
    connection: redisConnection as any
});


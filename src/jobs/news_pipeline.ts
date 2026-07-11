import 'dotenv/config';


import { fetchTopNews } from '../services/news_service';
import { articleQueue } from './queue';

/**
 * The core business logic for fetching, scraping, summarizing, and caching news.
 * Designed to be called by an API route, cron job, or message queue.
 */
export async function runNewsPipeline() {
  console.log("\n🚀 [JOB] Starting News Summarizer Pipeline...");

  try {
    const articles = await fetchTopNews(20);
    for (const article of articles) {
      await articleQueue.add(
          'process-article',
          { title: article.title, url: article.url },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
          }
      );
    }

    console.log(`\n✅ [JOB] Pipeline execution complete.`);

  } catch (error) {
    console.error("❌ [JOB] Pipeline failed with critical error:", error);
    throw error; // Rethrow to let the Express route know the job failed
  }
}
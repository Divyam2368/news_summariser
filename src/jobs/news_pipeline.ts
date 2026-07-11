import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { fetchTopNews } from '../services/news_service';

import {processArticle} from "../services/article_processor";

/**
 * The core business logic for fetching, scraping, summarizing, and caching news.
 * Designed to be called by an API route, cron job, or message queue.
 */
export async function runNewsPipeline() {
  console.log("\n🚀 [JOB] Starting News Summarizer Pipeline...");

  try {
    // Step 1: Fetch the cleaned top 5 articles from NewsAPI
    const articles = await fetchTopNews(5);

    // Loop through each article one by one
    for (const article of articles) {
           await processArticle(article.title, article.url);
    }

    console.log(`\n✅ [JOB] Pipeline execution complete.`);

  } catch (error) {
    console.error("❌ [JOB] Pipeline failed with critical error:", error);
    throw error; // Rethrow to let the Express route know the job failed
  }
}
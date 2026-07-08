import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Note: We use '../' because we are now inside the 'jobs' folder
import { fetchTopNews } from '../services/news_service';
import { scrapeAndTruncateArticle } from '../services/scraper';
import { summarizeArticle } from '../services/ai_service';

// 1. Initialize the raw Postgres connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it in the Prisma Driver Adapter (Required for Prisma v7)
const adapter = new PrismaPg(pool);

// 3. Instantiate Prisma passing the adapter and logging preferences
const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

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
      console.log(`\n--------------------------------------------------`);
      console.log(`🔍 Processing: ${article.title}`);

      // Step 2: Database Cache Check
      const existingArticle = await prisma.article.findUnique({
        where: { original_url: article.url },
      });

      if (existingArticle) {
        // Cache HIT: Skip to the next article
        console.log("⚡ [CACHED] Article found in database. Skipping Scrape & LLM.");
        console.log(`📝 Cached Summary:\n${existingArticle.summary}`);
        continue;
      }

      console.log("⏳ [NEW] Article not found in cache. Initiating processing...");

      try {
        // Step 3: Scrape and aggressively truncate the text
        const scrapedText = await scrapeAndTruncateArticle(article.url);

        // Step 4: Pass the truncated text to Groq for a 3-bullet summary
        const summary = await summarizeArticle(scrapedText);

        console.log("\n📝 Generated Summary:");
        console.log(summary);

        // Step 5: Save the final result to the PostgreSQL database
        await prisma.article.create({
          data: {
            title: article.title,
            original_url: article.url,
            summary: summary,
          }
        });

        console.log("💾 Successfully saved new article to PostgreSQL!");

      } catch (processingError) {
        console.error(`❌ Failed to process article: ${article.url}`);
        console.error(processingError);
      }
    }

    console.log(`\n✅ [JOB] Pipeline execution complete.`);

  } catch (error) {
    console.error("❌ [JOB] Pipeline failed with critical error:", error);
    throw error; // Rethrow to let the Express route know the job failed
  }
}
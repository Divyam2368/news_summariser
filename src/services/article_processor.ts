import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { scrapeAndTruncateArticle } from './scraper';
import { summarizeArticle } from './ai_service';
import {generateEmbedings} from "./embedding_service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ['warn', 'error'],
});

export async function processArticle(title:string , url :string) {
    const existingArticle = await prisma.article.findUnique({
        where: { original_url: url },
    });

    if (existingArticle) {
        // Cache HIT: Skip to the next article
        console.log("⚡ [CACHED] Article found in database. Skipping Scrape & LLM.");
        console.log(`📝 Cached Summary:\n${existingArticle.summary}`);
        return;
    }

    console.log("⏳ [NEW] Article not found in cache. Initiating processing...");

    try {
        // Step 3: Scrape and aggressively truncate the text
        const scrapedText = await scrapeAndTruncateArticle(url);

        // Step 4: Pass the truncated text to Groq for a 3-bullet summary
        const summary = await summarizeArticle(scrapedText);
        if (summary.trim() === 'INVALID_ARTICLE') {
            console.warn(`[BLOCKED] Skipping URL: ${url} - WAF firewall or invalid CSS payload detected.`);
            return;
        }
        console.log("\n📝 Generated Summary:");
        console.log(summary);



        // Step new 4.1 : create vector embedding for summary
        const textToEmbed = `Title: ${title}\nSummary: ${summary}\n`;
        const embedding = await generateEmbedings(textToEmbed);
        const embedding_string = JSON.stringify(embedding);
        console.log("Saving embedding and summary to DB:")

        // Step 5: Save the final result to the PostgreSQL database using Raw SQL
        const newArticle = await prisma.article.create({
            data: {
                title: title,
                original_url: url,
                summary: summary,
            }
        });

        console.log(`✅ Base row created with ID: ${newArticle.id}. Injecting vector...`);

        // Step 5b: Inject the vector using a targeted UPDATE statement
        await prisma.$executeRaw`
          UPDATE "Article" 
          SET embedding = CAST(${embedding_string} AS vector) 
          WHERE id = ${newArticle.id}
        `;

        console.log("✅ Successfully injected the 1024-dimension vector!");

    } catch (processingError) {
        console.error(`Failed to process article: ${url}`);
        console.error(processingError);
    }
}

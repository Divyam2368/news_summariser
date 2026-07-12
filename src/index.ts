import express, { Request, Response } from 'express';
import { runNewsPipeline } from './jobs/news_pipeline';
import {generateEmbedings} from './services/embedding_service'
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import cors from 'cors';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['warn', 'error'],
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://news-summariser-frontend.vercel.app'
    ],
    credentials: true
}));
// Middleware to parse incoming JSON bodies (essential for future features like keyword search)
app.use(express.json());

// The API endpoint to trigger our news summarization job
app.post('/api/trigger-summary', async (req: Request, res: Response) => {
  console.log("\n📥 Received POST request to /api/trigger-summary");
  
  try {
    // Run our decoupled business logic
    await runNewsPipeline();
    
    // Send a success response back to the client
    res.status(200).json({ 
      success: true, 
      message: "News pipeline executed successfully! Check your database." 
    });
  } catch (error) {
    console.error("Error in /api/trigger-summary route:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to execute pipeline." 
    });
  }
});

app.post('/api/search' , async (req: Request, res: Response) => {
    console.log("\n Searching :");
    try {
        const query = req.body.query;
        if(!query || typeof query != 'string'){
          return res.status(400).json({error :"Give valid input."});
        }
        const query_vector = await generateEmbedings(query);
        const query_vector_string = JSON.stringify(query_vector);

        // searching for this embedding in db
      const results = await prisma.$queryRaw`
      SELECT 
        id, 
        title, 
        summary, 
        original_url,
        timestamp,
        (1 - (embedding <=> ${query_vector_string}::vector)) AS similarity_score
      FROM "Article"
      ORDER BY embedding <=> ${query_vector_string}::vector ASC
      LIMIT 5;
    `;
      console.log(`[SEARCH] Match calculation finished. Returning top results.`);
      res.status(200).json({ results });
    }
    catch(error) {
      console.error("[SEARCH ERROR] Semantic search execution failed:", error);
      res.status(500).json({ error: "Internal server error during similarity calculation." });
    }
});

// The Home Page Endpoint: Serves the freshest news instantly
app.get('/api/news/latest', async (req, res) => {
    try {
        const limit =  10;
        const page = 1;
        const skip = (page - 1) * limit;

        console.log(`🏠 [HOME] Fetching page ${page} of latest news (limit: ${limit})...`);

        // 2. Fetch directly from Prisma ordered by newest first
        const articles = await prisma.article.findMany({
            take: limit,
            skip: skip,
            orderBy: {
                timestamp: 'desc',
            },
            select: {
                id: true,
                title: true,
                summary: true,
                original_url: true,
                timestamp: true,

            },
        });

        // 3. (Optional but professional) Get total count for frontend pagination math
        const totalArticles = await prisma.article.count();

        res.status(200).json({
            meta: {
                total: totalArticles,
                page,
                limit,
                totalPages: Math.ceil(totalArticles / limit),
            },
            results: articles,
        });

    } catch (error) {
        console.error("[HOME ERROR] Failed to fetch latest headlines:", error);
        res.status(500).json({ error: "Internal server error while fetching latest news." });
    }
});
app.listen(PORT, () => {
  console.log(`\n🚀 Server is actively listening on http://localhost:${PORT}`);
  console.log(`👉 Test the server by navigating to: http://localhost:${PORT}/ping`);
  console.log(`👉 Trigger the pipeline by making a POST request to: http://localhost:${PORT}/api/trigger-summary\n`);
});
import express, { Request, Response } from 'express';
import { runNewsPipeline } from './jobs/news_pipeline';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies (essential for future features like keyword search)
app.use(express.json());

// A simple health-check route to ensure our server is up
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: '✅ TypeScript Server is running smoothly!' });
});

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
    console.error("❌ Error in /api/trigger-summary route:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to execute pipeline." 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server is actively listening on http://localhost:${PORT}`);
  console.log(`👉 Test the server by navigating to: http://localhost:${PORT}/ping`);
  console.log(`👉 Trigger the pipeline by making a POST request to: http://localhost:${PORT}/api/trigger-summary\n`);
});
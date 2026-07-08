import 'dotenv/config';

export interface CleanedArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
}

interface RawArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: RawArticle[];
  code?: string;
  message?: string;
}
/**
 * Fetches the top headlines from NewsAPI, removes invalid/removed articles, 
 * and maps the data down to a token-efficient summary format.
 * * @param limit The maximum number of clean articles to return (Default: 5)
 */
export async function fetchTopNews(limit: number = 5): Promise<CleanedArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    throw new Error(" Error: NEWS_API_KEY is not defined in your .env file!");
  }

  const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;

  console.log("Fetching raw data from News API...");

  try {
    const response = await fetch(url);
    const data = (await response.json()) as NewsApiResponse;

    if (data.status !== 'ok' || !data.articles) {
      throw new Error(`NewsAPI Error: ${data.message || 'Unknown error occurred'}`);
    }

    console.log(` Raw JSON Data Received. Total articles: ${data.articles.length}`);

    const cleanedArticles: CleanedArticle[] = data.articles
      .filter((article) => {
        const hasRequiredFields = !!(article.title && article.description && article.url);
        const isNotRemoved = article.title !== '[Removed]' && article.description !== '[Removed]';

        return hasRequiredFields && isNotRemoved;
      })
      .map((article) => ({
        title: article.title,
        description: article.description!, 
        url: article.url,
        publishedAt: article.publishedAt
      }))
      .slice(0, limit); 

    console.log(`Successfully cleaned and filtered down to top ${cleanedArticles.length} articles.`);
    return cleanedArticles;

  } catch (error) {
    console.error("Network or API error occurred:", error);
    throw error; 
  }
}

// ---------------------------------------------------------
// 3. Local Execution Test
// ---------------------------------------------------------
// This block only runs if you execute this file directly via `npx ts-node`
if (require.main === module) {
  fetchTopNews(5)
    .then(data => {
      console.log("🚀 Final Cleaned Output Ready for DB/LLM:");
      console.dir(data, { depth: null, colors: true });
    })
    .catch(console.error);
}
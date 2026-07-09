// Make sure to install these dependencies if you haven't already:
// npm install @langchain/community langchain cheerio

// The Cheerio loader path varies between langchain package versions. Use the
// canonical path for newer langchain releases:
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Scrapes a news article URL and applies the "Inverted Pyramid" truncation strategy
 * by returning only the first major chunk of text to save LLM tokens.
 * @param url The URL of the news article to scrape
 * @returns A string containing the dense, highly relevant opening text of the article
 */
export async function scrapeAndTruncateArticle(url: string): Promise<string> {
  console.log(`\n🕸️ Scraping URL: ${url}`);

  try {
    // 1. Load the raw HTML and extract text using Cheerio
    const loader = new CheerioWebBaseLoader(url, {
      selector: "article, h1, p, h2, h3"
    });

    const docs = await loader.load();

    if (!docs || docs.length === 0) {
      throw new Error("No content could be extracted from this URL.");
    }

    // 2. The Cleanup: Remove massive gaps, tabs, and line breaks left by Cheerio
    let rawText = docs[0].pageContent;
    rawText = rawText.replace(/\s+/g, ' ').trim();
    console.log(`📄 Raw text extracted: ${rawText.length} characters.`);

    // 3. Inverted Pyramid Strategy: Truncate the text
    // We set a chunk size of 4000 characters (roughly 800-1000 tokens).
    // This captures the headline, lead paragraph, and immediate supporting details.
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000,
      chunkOverlap: 0, // Overlap is 0 because we only care about the very first chunk
    });

    const splitDocs = await splitter.createDocuments([rawText]);

    if (splitDocs.length === 0) {
      throw new Error("Text splitting resulted in empty documents.");
    }

    // 4. Extract and return ONLY the first chunk
    const topOfPyramidText = splitDocs[0].pageContent;

    console.log(`✂️ Truncated down to ${topOfPyramidText.length} characters to save tokens!`);
    return topOfPyramidText;

  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error);
    throw error;
  }
}

// ---------------------------------------------------------
// Local Execution Test
// ---------------------------------------------------------
// Run this via: npx ts-node src/services/scraper_service.ts
if (require.main === module) {
  // Let's test it with one of the URLs from your raw payload
  const testUrl = 'https://www.bbc.com/sport/tennis/articles/c1dy7grv4y3o';

  scrapeAndTruncateArticle(testUrl)
      .then(truncatedText => {
        console.log("\n🚀 Final Text Ready for LLM Prompt:");
        console.log("--------------------------------------------------");
        console.log(truncatedText);
        console.log("--------------------------------------------------");
      })
      .catch(console.error);
}
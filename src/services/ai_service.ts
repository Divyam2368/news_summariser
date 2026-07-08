import 'dotenv/config';
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Takes truncated article text and uses Groq (Llama 3) to generate a strict 3-bullet summary.
 * @param text The truncated article text from the scraper service
 * @returns A string containing exactly 3 bullet points summarizing the text
 */
export async function summarizeArticle(text: string): Promise<string> {
  console.log("🧠 Sending text to Groq LLM for summarization...");

  // Initialize the Groq model
  // We use a low temperature (0.2) to keep the summary factual and deterministic.
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2, 
  });

  // The System Message sets the strict persona and rules for the LLM
  const systemPrompt = new SystemMessage(
    "You are a highly efficient news editor. Your task is to summarize the provided news article text into exactly three concise bullet points. " +
    "Focus on the 'who, what, where, when, and why'. " +
    "Do not include any pleasantries, introductions, or concluding remarks. Just output the three bullet points starting with '-'."
  );

  // The Human Message contains our scraped, truncated data
  const humanPrompt = new HumanMessage(`Here is the article text to summarize:\n\n${text}`);

  try {
    const response = await model.invoke([systemPrompt, humanPrompt]);
    console.log("✅ Summary generated successfully!");
    
    // LangChain returns complex message objects, so we extract the string content
    return response.content.toString();
  } catch (error) {
    console.error("❌ Error generating summary:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// Local Execution Test
// ---------------------------------------------------------
// Run this via: npx ts-node src/services/ai_service.ts
if (require.main === module) {
  // Using a snippet of the truncated BBC text you just successfully scraped!
  const sampleScrapedText = `Teenager Mirra Andreeva won her first Grand Slam title as Polish qualifier Maja Chwalinska was denied a fairytale French Open victory.Andreeva, 19, fulfilled the potential she has long shown with a 6-3 6-2 victory over an opponent who was a 500-1 outsider before the tournament.Russian eighth seed Andreeva is the youngest woman to win the Roland Garros title since Monica Seles in 1992.`;
  
  summarizeArticle(sampleScrapedText)
    .then(summary => {
      console.log("\n📝 Final 3-Bullet Summary:");
      console.log("--------------------------------------------------");
      console.log(summary);
      console.log("--------------------------------------------------");
    })
    .catch(console.error);
}
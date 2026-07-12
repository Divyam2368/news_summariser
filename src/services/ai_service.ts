import 'dotenv/config';
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Takes truncated article text and uses Groq (Llama 3) to generate a strict 3-bullet summary.
 * @param text The truncated article text from the scraper service
 * @returns A string containing exactly 3 bullet points, or 'INVALID_ARTICLE' if blocked.
 */
export async function summarizeArticle(text: string): Promise<string> {
  console.log("🧠 Sending text to Groq LLM for summarization...");

  // Initialize the Groq model
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
  });

  // The System Message sets the strict persona, rules, AND the WAF guardrail
  const systemPrompt = new SystemMessage(
      "You are a highly efficient news editor. Your task is to summarize the provided news article text into exactly three concise bullet points. " +
      "Focus on the 'who, what, where, when, and why'. " +
      "Do not include any pleasantries, introductions, or concluding remarks. Just output the three bullet points starting with '-'.\n\n" +
      "CRITICAL INSTRUCTION: If the provided text appears to be raw CSS, HTML code, or a bot-protection/firewall warning (e.g., phrases like 'Access Denied', 'IP address', 'contact support', 'Verify you are human'), you must respond ONLY with the exact string: INVALID_ARTICLE. Do not output a summary. Do not output anything else."
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
if (require.main === module) {
  // Testing the guardrail against a fake Cloudflare WAF warning
  const sampleScrapedText = `Access Denied. Please enable JavaScript. Readers experiencing access issues should contact support@people.inc for assistance. Your IP address is 192.168.1.1.`;

  summarizeArticle(sampleScrapedText)
      .then(summary => {
        console.log("\n📝 Final Output:");
        console.log("--------------------------------------------------");
        console.log(summary);
        console.log("--------------------------------------------------");
      })
      .catch(console.error);
}
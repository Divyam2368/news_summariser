import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Hugging Face client pointing to the BGE-M3 model
const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGING_FACE_API_TOKEN,
    model: "BAAI/bge-m3",
});

export async function generateEmbedings(text:string) : Promise<number[]> {
    try {
        console.log("Generating embedding for text :")
        const embedding = await embeddings.embedQuery(text);
        return embedding;
    }
    catch(error){
        console.error("Error generating embeddings");
        throw error;
    }
}
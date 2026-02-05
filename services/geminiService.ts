
import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet, SentenceSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "";
  if (category === Category.OPIC) {
    systemInstruction = "You are an expert OPIc English coach. Generate high-frequency, natural conversational expressions strictly for IH (Intermediate High) level. Focus on clear, idiomatic expressions that are practical for speaking tests.";
  } else if (category === Category.SENTENCE_STRUCTURE) {
    systemInstruction = "You are an English linguistics expert. Your task is to generate simple sentences categorized by the 5 English Sentence Types (1st to 5th). 1st: S+V, 2nd: S+V+C, 3rd: S+V+O, 4th: S+V+IO+DO, 5th: S+V+O+OC. Keep them simple and focused on the structure.";
  } else {
    systemInstruction = "You are an English syntax specialist. You create short 'Subject + Verb' pattern chunks. The Korean translation MUST use slashes (/) to match the English word order exactly.";
  }

  const prompt = `Generate a JSON array of 30 English training items for topic: "${topic}".
  Category: ${category}.

  ${category === Category.SENTENCE_STRUCTURE ? 
    `CRITICAL RULES for Sentence Structure category:
    1. Distribute items across all 5 types (1st, 2nd, 3rd, 4th, 5th).
    2. Mark the type in 'partOfSpeech' field (e.g., "1st Type (S+V)").
    3. Keep sentences simple but relevant to the topic "${topic}".`
    : category === Category.SUBJECT_VERB ? 
    `CRITICAL RULES for S+V Pattern category:
    1. Items MUST be short 'Subject + Verb' pattern chunks.
    2. Korean field MUST use slashes (/) to mirror English word order.` 
    : 
    `Include a realistic IH level conversational example sentence for each item.`
  }
  
  Return ONLY the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              korean: { type: Type.STRING },
              english: { type: Type.STRING },
              partOfSpeech: { type: Type.STRING },
              example: { type: Type.STRING }
            },
            required: ["korean", "english", "partOfSpeech", "example"]
          },
        },
      },
    });

    const wordsData = JSON.parse(response.text || "[]");
    const words: WordItem[] = wordsData.map((w: any, idx: number) => ({
      ...w,
      id: `${category}-${Date.now()}-${idx}`,
      reviewCount: 0
    }));

    return {
      id: `set-${Date.now()}`,
      category,
      topic,
      createdAt: new Date().toISOString(),
      words
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateSentenceSet = async (wordSet: WordSet): Promise<SentenceSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const expressions = wordSet.words.map(w => w.english).slice(0, 15).join(", ");
  
  const systemInstruction = `You are a professional OPIc trainer. Create 10 natural OPIc responses strictly at IH (Intermediate High) level. 
  Focus on structures that demonstrate fluency.`;
  
  const prompt = `Topic: "${wordSet.topic}". 
  Create 10 expressive OPIc answer sentences in a JSON array. 
  CRITICAL: You MUST naturally incorporate expressions like [${expressions}].`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { 
              korean: { type: Type.STRING }, 
              english: { type: Type.STRING } 
            },
            required: ["korean", "english"]
          }
        }
      }
    });

    const sentenceData = JSON.parse(response.text || "[]");
    return {
      id: `sentset-${Date.now()}`,
      wordSetId: wordSet.id,
      topic: wordSet.topic,
      createdAt: new Date().toISOString(),
      sentences: sentenceData.map((s: any, idx: number) => ({
        id: `sent-${Date.now()}-${idx}`,
        ...s,
        partOfSpeech: 'OPIc IH Response',
        reviewCount: 0
      }))
    };
  } catch (error) { 
    console.error("Gemini Sentence Generation Error:", error);
    throw error; 
  }
};

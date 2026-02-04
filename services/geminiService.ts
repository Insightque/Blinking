
import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet, SentenceSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "";
  if (category === Category.OPIC) {
    systemInstruction = "You are an expert OPIc English coach. Generate high-frequency, natural conversational expressions for AL level. Focus on idiomatic expressions.";
  } else {
    systemInstruction = "You are an English syntax specialist. You create short 'Subject + Verb' pattern chunks (e.g., 'I've decided to', 'She is planning on'). Your goal is to help students practice the core 'Subject + Verb' structure. The Korean translation MUST use slashes (/) to match the English word order exactly.";
  }

  const prompt = `Generate a JSON array of 50 English training items for topic: "${topic}".
  Category: ${category}.

  ${category === Category.SUBJECT_VERB ? 
    `CRITICAL RULES for S+V Pattern category:
    1. Items MUST be short 'Subject + Verb' pattern chunks (max 4-6 words). NOT full complex sentences.
    2. Korean field MUST use slashes (/) to mirror English word order. 
       Example: English: "I'm planning to", Korean: "나는 / 계획 중이다"
    3. The 'partOfSpeech' MUST be "pattern".` 
    : 
    `Include a realistic professional example sentence.`
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
  const systemInstruction = `You are a professional OPIc trainer. Create 10 natural OPIc responses (AL level) with fillers (Well, Actually, You know).`;
  const prompt = `Topic "${wordSet.topic}". Generate 10 expressive OPIc answer sentences in JSON array.`;

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
            properties: { korean: { type: Type.STRING }, english: { type: Type.STRING } },
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
        partOfSpeech: 'OPIc Response',
        reviewCount: 0
      }))
    };
  } catch (error) { throw error; }
};


import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "";
  if (category === Category.OPIC) {
    systemInstruction = "You are an OPIc English coach. Generate natural, conversational expressions.";
  } else if (category === Category.AI_ENGINEERING) {
    systemInstruction = "You are a senior AI researcher. Generate professional technical terminology used in papers and meetings.";
  } else {
    systemInstruction = "You are an English sentence pattern coach. Focus on 'Subject + Verb' chunks. Korean translation MUST be in English word order (Subject / Verb / Object).";
  }

  const prompt = `Generate a JSON array of 30 distinct English vocabulary/expressions for the topic: "${topic}".
  Category context: ${category}.
  ${category === Category.SUBJECT_VERB ? "CRITICAL: The 'korean' field MUST be formatted with slashes(/) reflecting English order (e.g., '나는 / 간다 / 학교에')." : ""}
  Provide keys: "korean", "english", "partOfSpeech", "example".`;

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
            required: ["korean", "english", "partOfSpeech", "example"],
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

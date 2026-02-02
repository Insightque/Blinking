
import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
  // 가이드라인: API 호출 직전에 인스턴스 생성
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "";
  if (category === Category.OPIC) {
    systemInstruction = "You are an expert OPIc English coach. Generate high-frequency, natural conversational expressions that help students achieve AL (Advanced Low) scores. Focus on idiomatic expressions and complex sentence structures.";
  } else if (category === Category.AI_ENGINEERING) {
    systemInstruction = "You are a senior AI research engineer. Generate professional technical terminology and industry-standard jargon used in state-of-the-art AI papers, system architecture meetings, and engineering documentations.";
  } else {
    systemInstruction = "You are a syntax expert specializing in English sentence patterns. Focus on the 'Subject + Verb' chunking method to help learners build intuition for English word order. The Korean translation MUST reflect English word order using slashes(/).";
  }

  const prompt = `Generate a JSON array of 50 distinct English vocabulary items or expressions for the specific topic: "${topic}".
  Category context: ${category}.
  ${category === Category.SUBJECT_VERB ? "CRITICAL: The 'korean' field MUST be formatted with slashes(/) reflecting English word order (e.g., '나는 / 간다 / 학교에')." : ""}
  Include a realistic professional example sentence for each item.
  Return ONLY the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // 가이드라인 권장 텍스트 모델
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
            propertyOrdering: ["korean", "english", "partOfSpeech", "example"]
          },
        },
      },
    });

    // response.text는 getter 프로퍼티임 (메서드 아님)
    let rawJson = response.text || "[]";
    
    // 마크다운 코드 블록 제거 로직 (혹시라도 포함될 경우 대비)
    rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();

    const wordsData = JSON.parse(rawJson);
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

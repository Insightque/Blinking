
import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet, SentenceSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "";
  if (category === Category.OPIC) {
    systemInstruction = "You are an expert OPIc English coach. Generate high-frequency, natural conversational expressions strictly for IH (Intermediate High) level. Focus on clear, idiomatic expressions that are practical for speaking tests.";
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
    `Include a realistic professional example sentence for each item.`
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
  
  // 학습 세트 내의 핵심 표현들을 추출하여 프롬프트에 포함
  const expressions = wordSet.words.map(w => w.english).slice(0, 15).join(", ");
  
  const systemInstruction = `You are a professional OPIc trainer. Create 10 natural OPIc responses strictly at IH (Intermediate High) level. 
  The responses should be conversational, enthusiastic, and clear, using common fillers like 'You know', 'I mean', 'Well', and 'Let me see'. 
  Focus on structures that demonstrate a high level of fluency without being overly academic.`;
  
  const prompt = `Topic: "${wordSet.topic}". 
  Please create 10 expressive OPIc answer sentences in a JSON array. 
  CRITICAL: You MUST naturally incorporate some of these expressions from the current study set: [${expressions}].
  Each sentence should sound like a real person answering Eva in a conversational way.`;

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


import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet, SentenceSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let systemInstruction = "";
  if (category === Category.OPIC) {
    systemInstruction = "You are an expert OPIc English coach. Generate high-frequency, natural conversational expressions that help students achieve AL (Advanced Low) scores. Focus on idiomatic expressions and complex sentence structures.";
  } else if (category === Category.AI_ENGINEERING) {
    systemInstruction = "You are a technical recruiter. Generate standard professional terminology used in AI and software engineering.";
  } else {
    // SUBJECT_VERB 전문 지침: 짧고 명확한 주어+동사 패턴에 집중
    systemInstruction = "You are an English syntax specialist. You create short 'Subject + Verb' pattern chunks (e.g., 'I've decided to', 'She is planning on', 'We are about to'). Your goal is to help students practice the core 'Subject + Verb' structure. The Korean translation MUST use slashes (/) to strictly match the English word order.";
  }

  const prompt = `Generate a JSON array of 50 distinct English training items for the topic: "${topic}".
  Category: ${category}.

  ${category === Category.SUBJECT_VERB ? 
    `CRITICAL RULES for Subject+Verb category:
    1. Each item MUST be a short pattern focusing on the Subject and Verb (maximum 5-7 words total).
    2. The 'korean' field MUST use slashes (/) to mirror the English word order exactly.
       Example: English: "I'm planning to visit", Korean: "나는 / 계획 중이다 / 방문하기를"
    3. The 'partOfSpeech' field MUST be "pattern".` 
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
            required: ["korean", "english", "partOfSpeech", "example"],
            propertyOrdering: ["korean", "english", "partOfSpeech", "example"]
          },
        },
      },
    });

    let rawJson = response.text || "[]";
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

export const generateSentenceSet = async (wordSet: WordSet): Promise<SentenceSet> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const vocabList = wordSet.words.map(w => w.english).join(", ");
  
  const systemInstruction = `You are a professional OPIc trainer and English editor. 
  Your goal is to create 10 natural, conversational sentences that a high-scoring candidate (AL level) would actually use in an OPIc test answer.
  
  RULES:
  1. Use the provided vocabulary in a natural context.
  2. The sentences MUST be part of an 'Answer' or 'Response' to a prompt, NEVER a question.
  3. MANDATORY: Incorporate natural fillers effectively (e.g., "Well," "You know," "Actually," "To be honest," "I mean," "Looking back," "If I remember correctly," "What I want to say is...").
  4. Make them sound expressive, emotional, and authentic.
  5. The Korean translation should be natural but follow the tone. ${wordSet.category === Category.SUBJECT_VERB ? "Format Korean translations with slashes(/) to reflect English word order." : ""}`;

  const prompt = `Using words from this list: [${vocabList}], generate exactly 10 high-quality OPIc-style answer sentences for the topic "${wordSet.topic}". 
  Ensure each sentence sounds like a spontaneous and natural response with fillers.
  Return a JSON array of objects with keys: "korean", "english".`;

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

    let rawJson = response.text || "[]";
    rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();

    const sentenceData = JSON.parse(rawJson);
    const sentences: WordItem[] = sentenceData.map((s: any, idx: number) => ({
      id: `sent-${Date.now()}-${idx}`,
      korean: s.korean,
      english: s.english,
      partOfSpeech: 'OPIc Response',
      reviewCount: 0
    }));

    return {
      id: `sentset-${Date.now()}`,
      wordSetId: wordSet.id,
      topic: wordSet.topic,
      createdAt: new Date().toISOString(),
      sentences
    };
  } catch (error) {
    console.error("Gemini Sentence Generation Error:", error);
    throw error;
  }
};

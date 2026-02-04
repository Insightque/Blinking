
import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem, WordSet, SentenceSet } from "../types";

export const generateWordSet = async (category: Category, topic: string): Promise<WordSet> => {
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

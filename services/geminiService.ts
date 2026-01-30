
import { GoogleGenAI, Type } from "@google/genai";
import { Category, WordItem } from "../types";

const apiKey = process.env.API_KEY;

// Mock data to use as fallback if API fails or for immediate testing without API key
// Fix: Added missing 'reviewCount' property to satisfy WordItem interface
const MOCK_OPIC_DATA: WordItem[] = [
  { id: '1', korean: '설명하다', english: 'describe', partOfSpeech: 'verb', example: 'Can you describe your house?', reviewCount: 1 },
  { id: '2', korean: '경험', english: 'experience', partOfSpeech: 'noun', example: 'I had a memorable experience.', reviewCount: 1 },
  { id: '3', korean: '최근에', english: 'recently', partOfSpeech: 'adverb', example: 'I recently visited a park.', reviewCount: 1 },
  { id: '4', korean: '인상적인', english: 'impressive', partOfSpeech: 'adjective', example: ' The view was impressive.', reviewCount: 1 },
  { id: '5', korean: '대처하다', english: 'deal with', partOfSpeech: 'verb', example: 'How do you deal with stress?', reviewCount: 1 },
];

// Fix: Added missing 'reviewCount' property to satisfy WordItem interface
const MOCK_AI_DATA: WordItem[] = [
  { id: '1', korean: '알고리즘', english: 'algorithm', partOfSpeech: 'noun', example: 'We optimized the sorting algorithm.', reviewCount: 1 },
  { id: '2', korean: '배포하다', english: 'deploy', partOfSpeech: 'verb', example: 'The model was deployed to production.', reviewCount: 1 },
  { id: '3', korean: '확장성', english: 'scalability', partOfSpeech: 'noun', example: 'Scalability is key for this system.', reviewCount: 1 },
  { id: '4', korean: '반복적인', english: 'iterative', partOfSpeech: 'adjective', example: 'We used an iterative approach.', reviewCount: 1 },
  { id: '5', korean: '지연 시간', english: 'latency', partOfSpeech: 'noun', example: 'Low latency is required for real-time inference.', reviewCount: 1 },
];

export const generateWordList = async (category: Category, count: number): Promise<WordItem[]> => {
  if (!apiKey) {
    console.warn("No API Key found. Using mock data.");
    return category === Category.OPIC ? MOCK_OPIC_DATA : MOCK_AI_DATA;
  }

  // Always use a named parameter for apiKey when initializing GoogleGenAI.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let promptContext = "";
  if (category === Category.OPIC) {
    promptContext = "OPIc (Oral Proficiency Interview - computer) English speaking test preparation. Focus on high-frequency verbs, adjectives, and connecting words used to describe daily life, hobbies, and experiences.";
  } else {
    promptContext = "Professional Software Engineering, Artificial Intelligence Research, and Data Science. Focus on technical terminology, verbs used in development/research processes, and adjectives describing system properties.";
  }

  const prompt = `
    Generate a list of exactly ${count} distinct vocabulary items for ${promptContext}.
    The words should be practical and highly frequently used in this specific domain.
    Mix nouns, verbs, adjectives, and adverbs.
    
    Output strictly in JSON format.
  `;

  try {
    // Generate content using gemini-3-flash-preview for basic text tasks.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              korean: { type: Type.STRING, description: "The Korean meaning of the word" },
              english: { type: Type.STRING, description: "The English word or phrase" },
              partOfSpeech: { type: Type.STRING, description: "Part of speech (e.g., Verb, Noun)" },
              example: { type: Type.STRING, description: "A short simple example sentence in English using the word" }
            },
            required: ["korean", "english", "partOfSpeech", "example"],
          },
        },
      },
    });

    // Access the text property directly from the GenerateContentResponse.
    const data = JSON.parse(response.text || "[]");
    
    // Fix: Added 'reviewCount' to the returned items to satisfy the WordItem interface.
    return data.map((item: any, index: number) => ({
      id: `${category}-${Date.now()}-${index}`,
      reviewCount: 1,
      ...item
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback to mock data if generation fails
    return category === Category.OPIC ? MOCK_OPIC_DATA : MOCK_AI_DATA;
  }
};

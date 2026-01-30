
import { Category, WordItem } from "../types";
import { OPIC_DATABASE, AI_DATABASE } from "../data/database";
import { getStoredReviewCount } from "./storageService";

export const getWordsFromDatabase = async (category: Category, count: number, customData?: WordItem[]): Promise<WordItem[]> => {
  let sourceData: WordItem[] = [];
  
  if (category === Category.CUSTOM && customData) {
    sourceData = customData;
  } else {
    sourceData = category === Category.OPIC ? OPIC_DATABASE : AI_DATABASE;
  }
  
  // Clone and inject REAL review counts from storage
  const processed = sourceData.map(word => ({
    ...word,
    reviewCount: getStoredReviewCount(word.id)
  }));
  
  const shuffled = [...processed];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(shuffled.slice(0, count));
    }, 300);
  });
};

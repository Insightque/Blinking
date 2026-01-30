import { Category, WordItem } from "../types";
import { OPIC_DATABASE, AI_DATABASE } from "../data/database";

/**
 * Retrieves a random subset of words from the local database.
 * 
 * @param category The category of words to retrieve (OPIC or AI_ENGINEERING)
 * @param count The number of words to retrieve (e.g., 100)
 * @returns A promise that resolves to an array of WordItems
 */
export const getWordsFromDatabase = async (category: Category, count: number): Promise<WordItem[]> => {
  // Select the correct database
  const sourceData = category === Category.OPIC ? OPIC_DATABASE : AI_DATABASE;
  
  // Clone the array to avoid modifying the original database during shuffle
  const shuffled = [...sourceData];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the requested number of items, or all items if count > length
  // Add a small artificial delay to simulate "loading" a large database if needed, 
  // but for local static data it's instant. We'll make it async to match the interface.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(shuffled.slice(0, count));
    }, 300); // 300ms delay for UI smoothness
  });
};
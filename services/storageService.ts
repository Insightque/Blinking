
import { Category, WordSet, WordItem } from "../types";
import { OPIC_JSON, AI_JSON } from "../data/database";
import { SUBJECT_VERB_JSON } from "../data/subjectVerbDatabase";

const SETS_KEY = 'lingofocus_word_sets_v2'; // Versioning key to reset data for new structure
const COUNTS_KEY = 'lingofocus_review_counts';

const mapToWordItems = (raw: Partial<WordItem>[], prefix: string): WordItem[] => {
  return raw.map((item, idx) => ({
    id: `${prefix}-${idx}`,
    korean: item.korean || '',
    english: item.english || '',
    partOfSpeech: item.partOfSpeech || '',
    example: item.example || '',
    reviewCount: 0
  }));
};

// 초기 시드 데이터 생성
const createSeedSets = (): WordSet[] => [
  {
    id: 'seed-sv-1',
    category: Category.SUBJECT_VERB,
    topic: 'S+V Basic Patterns (System)',
    createdAt: new Date().toISOString(),
    words: mapToWordItems(SUBJECT_VERB_JSON, 'sv-seed')
  },
  {
    id: 'seed-opic-1',
    category: Category.OPIC,
    topic: 'OPIc Essential (System)',
    createdAt: new Date().toISOString(),
    words: mapToWordItems(OPIC_JSON, 'opic-seed')
  },
  {
    id: 'seed-ai-1',
    category: Category.AI_ENGINEERING,
    topic: 'AI/Tech Essential (System)',
    createdAt: new Date().toISOString(),
    words: mapToWordItems(AI_JSON, 'ai-seed')
  }
];

export const getAllSets = (): WordSet[] => {
  const stored = localStorage.getItem(SETS_KEY);
  if (!stored) {
    const seeds = createSeedSets();
    localStorage.setItem(SETS_KEY, JSON.stringify(seeds));
    return seeds;
  }
  return JSON.parse(stored);
};

export const saveNewSet = (newSet: WordSet) => {
  const sets = getAllSets();
  sets.push(newSet);
  localStorage.setItem(SETS_KEY, JSON.stringify(sets));
};

export const deleteSet = (setId: string) => {
  const sets = getAllSets().filter(s => s.id !== setId);
  localStorage.setItem(SETS_KEY, JSON.stringify(sets));
};

export const getSetsByCategory = (category: Category): WordSet[] => {
  return getAllSets().filter(s => s.category === category);
};

export const getStoredReviewCount = (wordId: string): number => {
  const counts = JSON.parse(localStorage.getItem(COUNTS_KEY) || '{}');
  return counts[wordId] || 0;
};

export const incrementReviewCount = (wordId: string): number => {
  const counts = JSON.parse(localStorage.getItem(COUNTS_KEY) || '{}');
  const newCount = (counts[wordId] || 0) + 1;
  counts[wordId] = newCount;
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
  return newCount;
};

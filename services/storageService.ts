
import { Category, WordSet, WordItem } from "../types";
import { OPIC_SEED_DATA } from "../data/opicData";
import { AI_SEED_DATA } from "../data/aiData";
import { SV_SEED_DATA } from "../data/svData";

const SETS_KEY = 'lingofocus_word_sets_v3'; 
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

const createSeedSets = (): WordSet[] => [
  {
    id: 'seed-sv-basic',
    category: Category.SUBJECT_VERB,
    topic: 'Basic Sentence Patterns (System)',
    createdAt: new Date().toISOString(),
    words: mapToWordItems(SV_SEED_DATA, 'sv-seed')
  },
  {
    id: 'seed-opic-basic',
    category: Category.OPIC,
    topic: 'OPIc Essential Phrases (System)',
    createdAt: new Date().toISOString(),
    words: mapToWordItems(OPIC_SEED_DATA, 'opic-seed')
  },
  {
    id: 'seed-ai-basic',
    category: Category.AI_ENGINEERING,
    topic: 'AI/Tech Core Vocab (System)',
    createdAt: new Date().toISOString(),
    words: mapToWordItems(AI_SEED_DATA, 'ai-seed')
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

export const clearAllData = () => {
  localStorage.removeItem(SETS_KEY);
  localStorage.removeItem(COUNTS_KEY);
  window.location.reload();
};

export const exportBackup = () => {
  const data = {
    sets: getAllSets(),
    counts: JSON.parse(localStorage.getItem(COUNTS_KEY) || '{}'),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lingofocus_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBackup = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.sets && Array.isArray(data.sets)) {
      localStorage.setItem(SETS_KEY, JSON.stringify(data.sets));
      if (data.counts) {
        localStorage.setItem(COUNTS_KEY, JSON.stringify(data.counts));
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
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

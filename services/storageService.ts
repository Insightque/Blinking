
const STORAGE_KEY = 'lingofocus_review_counts';

export const getStoredReviewCount = (wordId: string): number => {
  const counts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  return counts[wordId] || 0;
};

export const incrementReviewCount = (wordId: string): number => {
  const counts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const newCount = (counts[wordId] || 0) + 1;
  counts[wordId] = newCount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  return newCount;
};

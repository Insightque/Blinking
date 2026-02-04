
export enum AppMode {
  WELCOME = 'WELCOME',
  SET_LIST = 'SET_LIST',
  GENERATOR = 'GENERATOR',
  LOADING = 'LOADING',
  SESSION = 'SESSION',
  SUMMARY = 'SUMMARY'
}

export enum Category {
  OPIC = 'OPIC',
  SUBJECT_VERB = 'SUBJECT_VERB',
  AI_ENGINEERING = 'AI_ENGINEERING' // 내부 호환성을 위해 유지
}

export interface WordItem {
  id: string;
  korean: string;
  english: string;
  partOfSpeech: string;
  example?: string;
  reviewCount: number;
}

export interface WordSet {
  id: string;
  category: Category;
  topic: string;
  createdAt: string;
  words: WordItem[];
}

export interface SentenceSet {
  id: string;
  wordSetId: string;
  topic: string;
  createdAt: string;
  sentences: WordItem[];
}

export interface SessionSettings {
  category: Category;
  revealDelay: number;
  autoAdvanceDelay: number;
  batchSize: number;
  readKoreanAloud: boolean;
}

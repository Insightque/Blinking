
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
  AI_ENGINEERING = 'AI_ENGINEERING',
  SUBJECT_VERB = 'SUBJECT_VERB'
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
  sentences: WordItem[]; // Reuse WordItem structure for sentences
}

export interface SessionSettings {
  category: Category;
  revealDelay: number;
  autoAdvanceDelay: number;
  batchSize: number;
  readKoreanAloud: boolean;
}


export enum AppMode {
  WELCOME = 'WELCOME',
  LOADING = 'LOADING',
  SESSION = 'SESSION',
  SUMMARY = 'SUMMARY'
}

export enum Category {
  OPIC = 'OPIC',
  AI_ENGINEERING = 'AI_ENGINEERING'
}

export interface WordItem {
  id: string;
  korean: string;
  english: string;
  partOfSpeech: string; // verb, noun, adjective, adverb
  example?: string;
  reviewCount: number; // 몇 회독째인지 기록
}

export interface SessionSettings {
  category: Category;
  revealDelay: number; // Seconds to wait before showing English
  autoAdvanceDelay: number; // Seconds to wait before moving to next word
  batchSize: number; // usually 100
}

export interface FlashcardState {
  currentIndex: number;
  isEnglishRevealed: boolean;
  words: WordItem[];
  isPaused: boolean;
}

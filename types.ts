
export enum AppMode {
  WELCOME = 'WELCOME',
  LOADING = 'LOADING',
  SESSION = 'SESSION',
  SUMMARY = 'SUMMARY',
  CUSTOM_INPUT = 'CUSTOM_INPUT'
}

export enum Category {
  OPIC = 'OPIC',
  AI_ENGINEERING = 'AI_ENGINEERING',
  SUBJECT_VERB = 'SUBJECT_VERB',
  CUSTOM = 'CUSTOM'
}

export interface WordItem {
  id: string;
  korean: string;
  english: string;
  partOfSpeech: string;
  example?: string;
  reviewCount: number;
}

export interface SessionSettings {
  category: Category;
  revealDelay: number;
  autoAdvanceDelay: number;
  batchSize: number;
}

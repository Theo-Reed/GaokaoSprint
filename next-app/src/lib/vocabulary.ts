import vocabularyData from '@/data/vocabulary_app_data_refined_final.json';

export interface Meaning {
  cn: string[];
  en: string[];
}

export interface Examples {
  teach: string[];
  exams: { year: number; text: string }[];
}

export interface VocabStats {
  freq: number;
  years_count: number;
  last_seen: number;
  stars: number;
  pos_distribution: Record<string, number>;
}

export interface VocabEntry {
  word: string;
  stats: VocabStats;
  tags: string[];
  pos: string[];
  meanings: Meaning;
  examples: Examples;
  _mcp_refined?: boolean;
}

// Create a Map for O(1) lookup
// Normalize keys to lowercase for case-insensitive matching if needed
export const vocabMap = new Map<string, VocabEntry>();

(vocabularyData as VocabEntry[]).forEach((entry) => {
  if (entry.word) {
    vocabMap.set(entry.word.toLowerCase(), entry);
  }
});

export const getVocabEntry = (word: string): VocabEntry | undefined => {
  return vocabMap.get(word.toLowerCase());
};

export const getAllVocab = (): VocabEntry[] => {
  return vocabularyData as VocabEntry[];
};

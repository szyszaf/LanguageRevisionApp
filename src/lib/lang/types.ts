import type { DiffOp } from '../answer';

export interface Diagnosis {
  title: string;
  explanation: string;
}

/** Jedno źle wpisane słowo: `w` – wpisane, `x` – oczekiwane. */
export interface WordContext {
  w: string;
  x: string;
  /** Słowa poprawnej odpowiedzi stojące przed tym miejscem. */
  expectedBefore: string[];
  user: string[];
  expected: string[];
}

export interface SentenceContext {
  user: string[];
  expected: string[];
  ops: DiffOp[];
  extras: string[];
  missing: string[];
}

export interface SentenceResult {
  diagnoses: Diagnosis[];
  /** Słowa już wyjaśnione – nie będą powtórzone w ogólnym „brakujące / zbędne słowa”. */
  consumed?: string[];
}

/** Wszystko, co zależy od języka: nazwa, synteza mowy, normalizacja i wykrywanie typowych błędów. */
export interface LanguagePack {
  code: string;
  /** Nazwa po polsku w bierniku: „Przetłumacz na …”. */
  nameTo: string;
  /** Kod głosu do syntezy mowy, np. ro-RO. */
  speech: string;
  /** Dodatkowa normalizacja (tekst jest już małymi literami). */
  normalize?: (text: string) => string;
  checkWord?: (ctx: WordContext) => Diagnosis | null;
  checkSentence?: (ctx: SentenceContext) => SentenceResult;
  /**
   * Forma z łącznikiem z dwóch osobno wpisanych słów, np. („mă”, „am”) → „m-am”.
   * Domyślnie po prostu „a-b” (np. „văzut o” → „văzut-o”).
   */
  hyphenate?: (a: string, b: string) => string;
  /** Wyjaśnienie dodawane, gdy zabrakło łącznika. */
  hyphenNote?: string;
  /** Wskazówka dodawana przy błędnym szyku zdania. */
  wordOrderHint?: string;
}

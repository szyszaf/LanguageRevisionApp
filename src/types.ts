// Model danych aplikacji. Każdy dział (np. "Czas przeszły") to jeden obiekt Category.
// Szczegółowy opis formatu: docs/FORMAT.md

/** Zdanie przykładowe z tłumaczeniem. */
export interface Example {
  text: string;
  translation: string;
  /** Opcjonalny komentarz, np. "forma nieregularna". */
  note?: string;
}

/** Typowy błąd: zła wersja, poprawna wersja i wyjaśnienie dlaczego. */
export interface CommonMistake {
  wrong: string;
  correct: string;
  why: string;
}

export interface GrammarTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

/** Jeden temat gramatyczny w dziale, np. "Pytania w Past Simple". */
export interface GrammarTopic {
  id: string;
  title: string;
  /** Akapity wyjaśnienia (każdy element = osobny akapit). */
  explanation: string[];
  /** Wzory budowy zdania, np. "Podmiot + did not + czasownik w formie podstawowej". */
  patterns?: string[];
  tables?: GrammarTable[];
  examples: Example[];
  commonMistakes?: CommonMistake[];
  tips?: string[];
}

export interface Synonym {
  word: string;
  translation: string;
  /** Czym różni się od słowa głównego. */
  note?: string;
}

/** Słówko z tłumaczeniem, przykładami użycia i synonimami. */
export interface VocabEntry {
  id: string;
  word: string;
  translation: string;
  partOfSpeech: string;
  /** Formy, np. "go – went – gone". */
  forms?: string;
  pronunciation?: string;
  usage: Example[];
  synonyms: Synonym[];
  notes?: string;
  /** Akceptowane odpowiedzi przy tłumaczeniu PL → obcy (domyślnie: word). */
  acceptedAnswers?: string[];
}

/** Wskazówka do konkretnego błędu: jeśli odpowiedź pasuje do wyrażenia regularnego, pokaż wyjaśnienie. */
export interface MistakeHint {
  /**
   * Wyrażenie regularne (bez ukośników), sprawdzane na znormalizowanej odpowiedzi (małe litery, bez interpunkcji).
   * Uwaga: \b nie działa z literami ă, â, î, ș, ț – zamiast niego używaj spacji, ^ lub $.
   */
  match: string;
  explanation: string;
}

interface ExerciseBase {
  id: string;
  /** Id tematu gramatycznego, do którego prowadzi link "Zobacz teorię". */
  grammarRef?: string;
  /** Pełne wyjaśnienie poprawnej odpowiedzi (pokazywane zawsze po sprawdzeniu). */
  explanation: string;
  mistakes?: MistakeHint[];
}

/** Przetłumacz całe zdanie. Domyślnie z polskiego na język nauki; `reverse: true` – z języka nauki na polski. */
export interface TranslateExercise extends ExerciseBase {
  type: 'translate';
  prompt: string;
  answers: string[];
  reverse?: boolean;
}

/** Uzupełnij lukę (___) w zdaniu. */
export interface GapExercise extends ExerciseBase {
  type: 'gap';
  sentence: string;
  /** Podpowiedź, np. czasownik w nawiasie "(go)". */
  hint?: string;
  translation?: string;
  answers: string[];
}

/** Wybierz poprawną odpowiedź. */
export interface ChoiceExercise extends ExerciseBase {
  type: 'choice';
  question: string;
  options: string[];
  correct: number;
  /** Wyjaśnienie dla każdej opcji (dlaczego dobra / zła). */
  optionExplanations?: string[];
}

export type Exercise = TranslateExercise | GapExercise | ChoiceExercise;

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  /** Język, którego się uczysz, np. "ro" (moduły językowe: src/lib/lang). */
  language: string;
  level?: string;
  description: string;
  icon?: string;
  grammar: GrammarTopic[];
  vocabulary: VocabEntry[];
  exercises: Exercise[];
}

import type { Category, TranslateExercise } from '../types';
import { roPerfectCompus } from './categories/roPerfectCompus';

// Tu dopisuj kolejne działy (np. z kolejnych lekcji Duolingo).
export const categories: Category[] = [roPerfectCompus];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** Klucze postępu – wspólne dla całej aplikacji. */
export const exKey = (cat: string, id: string) => `${cat}:ex:${id}`;
export const wordKey = (cat: string, id: string) => `${cat}:w:${id}`;

/** Ćwiczenia generowane automatycznie ze słówek: przetłumacz słowo z polskiego. */
export function vocabExercises(cat: Category): TranslateExercise[] {
  return cat.vocabulary.map((v) => ({
    id: `w:${v.id}`,
    type: 'translate',
    prompt: v.translation,
    answers: v.acceptedAnswers ?? [v.word],
    explanation:
      `„${v.translation}” = „${v.word}” (${v.partOfSpeech}${v.forms ? `: ${v.forms}` : ''}).` +
      (v.usage[0] ? ` Przykład: ${v.usage[0].text} – ${v.usage[0].translation}` : '') +
      (v.notes ? ` ${v.notes}` : ''),
  }));
}

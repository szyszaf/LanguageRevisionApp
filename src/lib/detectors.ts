// Wykrywanie i wyjaśnianie błędów w odpowiedziach.
// Część ogólna (szyk, literówki, znaki diakrytyczne, brakujące/zbędne słowa) działa dla każdego języka,
// a reguły konkretnego języka są w src/lib/lang/<kod>.ts.

import { diffWords, levenshtein, normalize, stripDiacritics, tokenize, type DiffOp } from './answer';
import type { MistakeHint } from '../types';
import { getPack, type Diagnosis } from './lang';

export type { Diagnosis };

const list = (words: string[]) => words.map((w) => `„${w}”`).join(', ');

export function detectMistakes(user: string, expected: string, lang: string, hints: MistakeHint[] = []): Diagnosis[] {
  const pack = getPack(lang);
  const found: Diagnosis[] = [];
  // Jeden komunikat na rodzaj błędu (pierwszy jest zwykle najbardziej konkretny).
  const add = (d: Diagnosis) => {
    if (!found.some((f) => f.title === d.title)) found.push(d);
  };

  // 1. Wskazówki zapisane przy samym ćwiczeniu.
  const nUser = normalize(user, lang);
  for (const h of hints) {
    try {
      if (new RegExp(h.match, 'iu').test(nUser)) add({ title: 'Wskazówka do tego błędu', explanation: h.explanation });
    } catch {
      /* błędne wyrażenie w danych – pomijamy */
    }
  }

  let u = tokenize(user, lang);
  const e = tokenize(expected, lang);
  if (u.length === 0) return found;

  // 2a. Dwa słowa wpisane osobno, które powinny być jednym z łącznikiem („mă am” → „m-am”, „văzut o” → „văzut-o”).
  const join = pack.hyphenate ?? ((a: string, b: string) => `${a}-${b}`);
  const eKeys = new Set(e.filter((t) => t.includes('-')).map((t) => stripDiacritics(t)));
  if (eKeys.size > 0) {
    const merged: string[] = [];
    for (let i = 0; i < u.length; i++) {
      const joined = i + 1 < u.length ? join(u[i], u[i + 1]) : '';
      if (joined && eKeys.has(stripDiacritics(joined))) {
        const target = e.find((t) => stripDiacritics(t) === stripDiacritics(joined))!;
        add({
          title: 'Brakuje łącznika',
          explanation: `Zamiast „${u[i]} ${u[i + 1]}” piszemy jedno słowo z łącznikiem: „${target}”. ${pack.hyphenNote ?? ''}`.trim(),
        });
        merged.push(joined);
        i++;
      } else merged.push(u[i]);
    }
    u = merged;
  }

  // 2. Te same słowa w innej kolejności.
  const sameWords = u.length === e.length && [...u].sort().join(' ') === [...e].sort().join(' ');
  if (sameWords && u.join(' ') !== e.join(' ')) {
    add({ title: 'Szyk zdania', explanation: `Słowa są dobre, ale w złej kolejności. ${pack.wordOrderHint ?? ''}`.trim() });
  }

  const ops: DiffOp[] = diffWords(u, e);

  // Odpowiedź prawie w całości inna – lista słów nic nie wyjaśni.
  const matching = ops.filter((o) => o.kind === 'same' || o.kind === 'wrong').length;
  if (e.length >= 3 && matching / Math.max(u.length, e.length) < 0.34) {
    add({
      title: 'To zupełnie inne zdanie',
      explanation: 'Twoja odpowiedź prawie w całości różni się od poprawnej. Przeczytaj jeszcze raz zdanie do przetłumaczenia i porównaj je z poprawną odpowiedzią powyżej.',
    });
    return found;
  }
  const expectedBefore = (idx: number) =>
    ops.slice(0, idx).flatMap((op) => (op.kind === 'same' || op.kind === 'missing' ? [op.word] : op.kind === 'wrong' ? [op.expected] : []));

  // 3. Słowo po słowie.
  ops.forEach((op, idx) => {
    if (op.kind !== 'wrong') return;
    const { word: w, expected: x } = op;

    if (stripDiacritics(w) === stripDiacritics(x)) {
      add({ title: 'Znaki diakrytyczne', explanation: `Napisałeś „${w}”, a poprawnie jest „${x}”. Różnica jest tylko w znakach diakrytycznych.` });
      return;
    }
    const specific = pack.checkWord?.({ w, x, expectedBefore: expectedBefore(idx), user: u, expected: e });
    if (specific) {
      add(specific);
      return;
    }
    if (w.length >= 3 && x.length >= 3 && levenshtein(stripDiacritics(w), stripDiacritics(x)) <= (x.length > 6 ? 2 : 1)) {
      add({ title: 'Literówka', explanation: `Napisałeś „${w}” zamiast „${x}”. Sprawdź pisownię.` });
      return;
    }
    add({ title: 'Inne słowo', explanation: `W miejscu „${w}” powinno być „${x}”.` });
  });

  // 4. Reguły całego zdania dla danego języka.
  const extras = ops.flatMap((o) => (o.kind === 'extra' ? [o.word] : []));
  const missing = ops.flatMap((o) => (o.kind === 'missing' ? [o.word] : []));
  const sentence = pack.checkSentence?.({ user: u, expected: e, ops, extras, missing });
  sentence?.diagnoses.forEach(add);
  const consumed = new Set(sentence?.consumed ?? []);

  // 5. Przestawione, brakujące i zbędne słowa.
  const moved = missing.filter((w) => extras.includes(w));
  if (moved.length > 0 && !sameWords) {
    add({ title: 'Szyk zdania', explanation: `Słowa ${list(moved)} stoją w złym miejscu. ${pack.wordOrderHint ?? ''}`.trim() });
  }
  const otherMissing = missing.filter((w) => !consumed.has(w) && !moved.includes(w));
  if (otherMissing.length > 0) add({ title: 'Brakujące słowa', explanation: `Zabrakło: ${list(otherMissing)}.` });
  const otherExtra = extras.filter((w) => !consumed.has(w) && !moved.includes(w));
  if (otherExtra.length > 0) add({ title: 'Zbędne słowa', explanation: `Te słowa są niepotrzebne: ${list(otherExtra)}.` });

  return found;
}

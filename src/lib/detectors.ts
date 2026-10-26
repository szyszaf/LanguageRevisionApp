// Automatyczne wykrywanie typowych błędów w odpowiedziach (angielski).
// Działa na porównaniu słowo po słowie odpowiedzi użytkownika z najbliższą poprawną odpowiedzią.

import { diffWords, levenshtein, normalize, tokenize, type DiffOp } from './answer';
import type { MistakeHint } from '../types';
import { IRREGULAR_VERBS, NAIVE_TO_BASE, PAST_TO_BASE, naiveEd } from './irregularVerbs';

export interface Diagnosis {
  title: string;
  explanation: string;
}

function pastFormsOf(base: string): string[] {
  const irr = IRREGULAR_VERBS[base];
  return irr ? irr[0].split('/') : naiveEd(base);
}

/** Czy `past` jest formą przeszłą od `base`? */
function isPastOf(past: string, base: string): boolean {
  if (past === base) return false;
  return pastFormsOf(base).includes(past);
}

export function detectMistakes(user: string, expected: string, hints: MistakeHint[] = []): Diagnosis[] {
  const found: Diagnosis[] = [];
  const add = (d: Diagnosis) => {
    if (!found.some((f) => f.title === d.title && f.explanation === d.explanation)) found.push(d);
  };

  // 1. Wskazówki zdefiniowane w samym ćwiczeniu.
  const nUser = normalize(user);
  for (const h of hints) {
    try {
      if (new RegExp(h.match, 'i').test(nUser)) add({ title: 'Wskazówka do tego błędu', explanation: h.explanation });
    } catch {
      /* zły regex w danych – pomijamy */
    }
  }

  const u = tokenize(user);
  const e = tokenize(expected);
  if (u.length === 0) return found;

  // 2. Te same słowa, inna kolejność → szyk zdania.
  if (u.length === e.length && [...u].sort().join(' ') === [...e].sort().join(' ') && u.join(' ') !== e.join(' ')) {
    add({
      title: 'Szyk zdania',
      explanation:
        'Użyłeś dobrych słów, ale w złej kolejności. W angielskim szyk jest stały: w zdaniu oznajmującym Podmiot + Czasownik + Reszta, a w pytaniu Did/Was/Were + Podmiot + Czasownik. Określenia czasu (yesterday, last week) stawiamy zwykle na końcu lub na początku zdania.',
    });
  }

  const ops: DiffOp[] = diffWords(u, e);

  // Słowo poprzedzające daną pozycję w poprawnej odpowiedzi.
  const expectedBefore = (idx: number): string[] => {
    const words: string[] = [];
    for (let k = 0; k < idx; k++) {
      const op = ops[k];
      if (op.kind === 'same' || op.kind === 'missing') words.push(op.word);
      if (op.kind === 'wrong') words.push(op.expected);
    }
    return words;
  };

  ops.forEach((op, idx) => {
    if (op.kind !== 'wrong') return;
    const w = op.word;
    const x = op.expected;

    // goed / buyed / eated …
    const naiveBase = NAIVE_TO_BASE[w];
    if (naiveBase && pastFormsOf(naiveBase).includes(x)) {
      add({
        title: `„${naiveBase}” to czasownik nieregularny`,
        explanation: `Napisałeś „${w}”, ale „${naiveBase}” nie tworzy czasu przeszłego przez dodanie -ed. Poprawna forma to „${x}” (${naiveBase} – ${IRREGULAR_VERBS[naiveBase][0]} – ${IRREGULAR_VERBS[naiveBase][1]}). Czasowniki nieregularne trzeba zapamiętać – zajrzyj do tabeli w teorii.`,
      });
      return;
    }

    // was ↔ were
    if ((w === 'was' && x === 'were') || (w === 'were' && x === 'was')) {
      add({
        title: 'Was czy were?',
        explanation:
          '„Was” używamy z I, he, she, it oraz rzeczownikami w liczbie pojedynczej. „Were” z you, we, they oraz liczbą mnogą. Uwaga: „you” zawsze ma „were”, nawet gdy mówimy do jednej osoby.',
      });
      return;
    }

    // forma podstawowa (lub z -s) zamiast przeszłej: "I go"/"she goes" zamiast "went"
    const stripped = w.replace(/(es|s)$/, '');
    const base3 = [stripped, w.replace(/s$/, ''), w.replace(/ies$/, 'y')].find((b) => b !== w && isPastOf(x, b));
    if (base3) {
      add({
        title: 'Czas teraźniejszy zamiast przeszłego',
        explanation: `„${w}” to forma czasu teraźniejszego (3. osoba, końcówka -s). Zdanie dotyczy przeszłości, więc potrzebne jest „${x}”. W Past Simple nie ma końcówki -s – forma jest taka sama dla wszystkich osób.`,
      });
      return;
    }
    if (isPastOf(x, w)) {
      add({
        title: 'Brak formy przeszłej',
        explanation: `Użyłeś formy podstawowej „${w}”, a zdanie jest w czasie przeszłym, więc potrzebna jest forma „${x}”. W zdaniach twierdzących Past Simple czasownik zawsze zmienia formę (regularne: +ed, nieregularne: druga kolumna tabeli).`,
      });
      return;
    }

    // forma przeszła tam, gdzie powinna być podstawowa: "didn't went", "did you saw"
    if (isPastOf(w, x)) {
      const before = expectedBefore(idx);
      const afterDid = before.includes('did');
      add({
        title: afterDid ? 'Po „did” forma podstawowa' : 'Niepotrzebna forma przeszła',
        explanation: afterDid
          ? `Napisałeś „${w}”, a powinno być „${x}”. Czas przeszły jest już pokazany przez „did” (lub „did not / didn't”), więc czasownik główny wraca do formy podstawowej. Czas „zaznaczamy” tylko raz: didn't go, did you see – nigdy didn't went, did you saw.`
          : `Napisałeś „${w}”, a w tym miejscu potrzebna jest forma podstawowa „${x}”.`,
      });
      return;
    }

    // literówka
    if (w.length >= 3 && x.length >= 3 && levenshtein(w, x) <= (x.length > 6 ? 2 : 1)) {
      add({
        title: 'Literówka',
        explanation: `Napisałeś „${w}” zamiast „${x}”. To wygląda na błąd w pisowni – sprawdź litery.`,
      });
      return;
    }

    add({
      title: 'Inne słowo',
      explanation: `W miejscu „${w}” oczekiwane było „${x}”.`,
    });
  });

  // Present Perfect zamiast Past Simple (have/has + …) przy określeniu czasu przeszłego
  const extras = ops.filter((o) => o.kind === 'extra').map((o) => o.word);
  const wrongUser = ops.filter((o) => o.kind === 'wrong').map((o) => (o as { word: string }).word);
  if ([...extras, ...wrongUser].some((w) => w === 'have' || w === 'has') && !e.includes('have') && !e.includes('has')) {
    add({
      title: 'Present Perfect zamiast Past Simple',
      explanation:
        'Użyłeś „have/has + III forma” (Present Perfect). Gdy w zdaniu jest konkretny moment w przeszłości (yesterday, last week, in 2019, two days ago), używamy wyłącznie Past Simple. To bardzo częsty błąd Polaków, bo po polsku mamy jeden czas przeszły.',
    });
  }

  // did + be: "did you were", "I didn't was"
  if (extras.includes('did') && (e.includes('was') || e.includes('were'))) {
    add({
      title: 'Z „be” nie używamy „did”',
      explanation:
        'Czasownik „be” (was/were) tworzy pytania i przeczenia samodzielnie: „Were you tired?”, „I wasn\'t at home”. Nie mówimy „Did you were…?” ani „I didn\'t was…”.',
    });
  } else if (extras.includes('did') && !e.includes('did')) {
    add({
      title: 'Niepotrzebne „did”',
      explanation:
        'W tym zdaniu nie ma miejsca na „did”. „Did” pojawia się tylko w pytaniach i przeczeniach (i nie w pytaniach o podmiot, np. „Who called you?”). W zwykłym zdaniu twierdzącym używamy samej formy przeszłej: „I went”, a nie „I did go”.',
    });
  }

  // brak did w pytaniu / przeczeniu
  const missing = ops.filter((o) => o.kind === 'missing').map((o) => o.word);
  if (missing.includes('did') && !u.includes('did')) {
    add({
      title: 'Brakuje „did”',
      explanation:
        'Pytania i przeczenia w Past Simple (z wyjątkiem czasownika „be”) tworzymy z pomocą „did”: Did + podmiot + forma podstawowa (Did you go?), oraz podmiot + did not/didn\'t + forma podstawowa (I didn\'t go).',
    });
  }

  // Słowa przestawione (są i w "brakujących", i w "zbędnych")
  const moved = missing.filter((w) => extras.includes(w));
  if (moved.length > 0) {
    add({
      title: 'Szyk zdania',
      explanation: `Słowa ${moved.map((w) => `„${w}”`).join(', ')} stoją w złym miejscu. W pytaniach operator (did / was / were) stoi przed podmiotem: „Where were you?”, „Did you go?”.`,
    });
  }

  // Słowa pominięte
  const otherMissing = missing.filter((w) => w !== 'did' && !moved.includes(w));
  if (otherMissing.length > 0) {
    add({
      title: 'Brakujące słowa',
      explanation: `W twojej odpowiedzi zabrakło: ${otherMissing.map((w) => `„${w}”`).join(', ')}.`,
    });
  }
  const otherExtra = extras.filter((w) => !['did', 'have', 'has'].includes(w) && !moved.includes(w));
  if (otherExtra.length > 0) {
    add({
      title: 'Zbędne słowa',
      explanation: `Te słowa są niepotrzebne: ${otherExtra.map((w) => `„${w}”`).join(', ')}.`,
    });
  }

  return found;
}

/** Dla ćwiczeń wyboru: pokazuje formę podstawową słowa przeszłego (pomocnicze). */
export function baseOf(word: string): string | undefined {
  return PAST_TO_BASE[word.toLowerCase()];
}

// Porównywanie odpowiedzi użytkownika z poprawnymi wersjami.

import { getPack } from './lang';

/**
 * Małe litery, ujednolicone apostrofy i znaki rumuńskie (ş/ţ z ogonkiem → ș/ț z przecinkiem),
 * normalizacja zależna od języka (np. skróty), bez interpunkcji i podwójnych spacji.
 * Myślniki zostają, bo w rumuńskim są częścią form typu „m-am”, „l-am”.
 */
export function normalize(text: string, lang?: string): string {
  let t = text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/ş/g, 'ș')
    .replace(/ţ/g, 'ț')
    .replace(/[‐‑–]/g, '-')
    .trim();
  const pack = lang ? getPack(lang) : undefined;
  if (pack?.normalize) t = pack.normalize(t);
  return t
    .replace(/[.,!?;:"„”()«»¿¡…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Usuwa znaki diakrytyczne: ă â → a, î → i, ș → s, ț → t, ą → a, ł → l … */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L');
}

export function tokenize(text: string, lang?: string): string[] {
  const n = normalize(text, lang);
  return n ? n.split(' ') : [];
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export function isCorrect(user: string, answers: string[], lang?: string): boolean {
  const u = normalize(user, lang);
  return answers.some((a) => normalize(a, lang) === u);
}

/** Poprawna odpowiedź, która różni się od wpisanej tylko znakami diakrytycznymi (np. „facut” zamiast „făcut”). */
export function matchIgnoringDiacritics(user: string, answers: string[], lang?: string): string | undefined {
  const u = stripDiacritics(normalize(user, lang));
  return answers.find((a) => stripDiacritics(normalize(a, lang)) === u);
}

/** Poprawna odpowiedź najbardziej podobna do tego, co wpisał użytkownik. */
export function closestAnswer(user: string, answers: string[], lang?: string): string {
  const u = normalize(user, lang);
  let best = answers[0];
  let bestDist = Infinity;
  for (const a of answers) {
    const d = levenshtein(u, normalize(a, lang));
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

export type DiffOp =
  | { kind: 'same'; word: string }
  | { kind: 'missing'; word: string }
  | { kind: 'extra'; word: string }
  | { kind: 'wrong'; word: string; expected: string };

/** Czy dwa słowa to „to samo miejsce” w zdaniu: identyczne, różne tylko znakami diakrytycznymi albo z drobną literówką. */
function similar(a: string, b: string): boolean {
  if (a === b) return true;
  const x = stripDiacritics(a);
  const y = stripDiacritics(b);
  return x === y || (x.length >= 4 && y.length >= 4 && levenshtein(x, y) <= 1);
}

/**
 * Porównanie słowo po słowie (LCS). Słowa podobne (diakrytyki, literówka) są dopasowywane do siebie i oznaczane
 * jako "wrong", żeby nie rozbijać reszty porównania. Sąsiednie "extra"+"missing" też łączymy w "wrong".
 */
export function diffWords(userTokens: string[], expectedTokens: string[]): DiffOp[] {
  const n = userTokens.length;
  const m = expectedTokens.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] = similar(userTokens[i], expectedTokens[j])
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const raw: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (similar(userTokens[i], expectedTokens[j])) {
      raw.push(
        userTokens[i] === expectedTokens[j]
          ? { kind: 'same', word: userTokens[i] }
          : { kind: 'wrong', word: userTokens[i], expected: expectedTokens[j] },
      );
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      raw.push({ kind: 'extra', word: userTokens[i++] });
    } else {
      raw.push({ kind: 'missing', word: expectedTokens[j++] });
    }
  }
  while (i < n) raw.push({ kind: 'extra', word: userTokens[i++] });
  while (j < m) raw.push({ kind: 'missing', word: expectedTokens[j++] });

  // Połącz pary extra+missing w zamianę słowa.
  const out: DiffOp[] = [];
  for (let k = 0; k < raw.length; k++) {
    const a = raw[k];
    const b = raw[k + 1];
    if (a.kind === 'extra' && b?.kind === 'missing') {
      out.push({ kind: 'wrong', word: a.word, expected: b.word });
      k++;
    } else if (a.kind === 'missing' && b?.kind === 'extra') {
      out.push({ kind: 'wrong', word: b.word, expected: a.word });
      k++;
    } else {
      out.push(a);
    }
  }
  return out;
}

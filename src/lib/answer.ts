// Porównywanie odpowiedzi użytkownika z poprawnymi wersjami.

const CONTRACTIONS: [RegExp, string][] = [
  // skróty wpisane bez apostrofu (częste na telefonie)
  [/\b(did|do|does|was|were|is|are|has|have|had|could|would|should)nt\b/g, "$1n't"],
  [/\bcant\b/g, "can't"],
  [/\bwont\b/g, "won't"],
  [/\bcan't\b/g, 'cannot'],
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/\b(\w+)n't\b/g, '$1 not'],
  [/\bi'm\b/g, 'i am'],
  [/\b(\w+)'re\b/g, '$1 are'],
  [/\b(\w+)'ve\b/g, '$1 have'],
  [/\b(\w+)'ll\b/g, '$1 will'],
  [/\b(it|that|what|there|here|who|where|he|she)'s\b/g, '$1 is'],
];

/** Małe litery, ujednolicone apostrofy, rozwinięte skróty, bez interpunkcji i podwójnych spacji. */
export function normalize(text: string): string {
  let t = text.toLowerCase().replace(/[’‘`´]/g, "'").trim();
  for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
  return t
    .replace(/[.,!?;:"„”()«»¿¡]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text: string): string[] {
  const n = normalize(text);
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

export function isCorrect(user: string, answers: string[]): boolean {
  const u = normalize(user);
  return answers.some((a) => normalize(a) === u);
}

/** Poprawna odpowiedź najbardziej podobna do tego, co wpisał użytkownik. */
export function closestAnswer(user: string, answers: string[]): string {
  const u = normalize(user);
  let best = answers[0];
  let bestDist = Infinity;
  for (const a of answers) {
    const d = levenshtein(u, normalize(a));
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

/** Porównanie słowo po słowie (LCS), sąsiednie "extra"+"missing" łączone w "wrong". */
export function diffWords(userTokens: string[], expectedTokens: string[]): DiffOp[] {
  const n = userTokens.length;
  const m = expectedTokens.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      lcs[i][j] =
        userTokens[i] === expectedTokens[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const raw: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (userTokens[i] === expectedTokens[j]) {
      raw.push({ kind: 'same', word: userTokens[i] });
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

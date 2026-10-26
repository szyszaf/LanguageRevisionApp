// Angielski: skróty (didn't → did not) i typowe błędy w Past Simple.
import type { Diagnosis, LanguagePack } from './types';
import { IRREGULAR_VERBS, NAIVE_TO_BASE, naiveEd } from './enIrregularVerbs';

const CONTRACTIONS: [RegExp, string][] = [
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

function pastFormsOf(base: string): string[] {
  const irr = IRREGULAR_VERBS[base];
  return irr ? irr[0].split('/') : naiveEd(base);
}

function isPastOf(past: string, base: string): boolean {
  return past !== base && pastFormsOf(base).includes(past);
}

export const en: LanguagePack = {
  code: 'en',
  nameTo: 'angielski',
  speech: 'en-GB',
  wordOrderHint:
    'W angielskim szyk jest stały: w zdaniu oznajmującym Podmiot + Czasownik + Reszta, a w pytaniu Did/Was/Were + Podmiot + Czasownik.',

  normalize(t) {
    for (const [re, rep] of CONTRACTIONS) t = t.replace(re, rep);
    return t;
  },

  checkWord({ w, x, expectedBefore }): Diagnosis | null {
    const naiveBase = NAIVE_TO_BASE[w];
    if (naiveBase && pastFormsOf(naiveBase).includes(x)) {
      const [past, pp] = IRREGULAR_VERBS[naiveBase];
      return {
        title: `„${naiveBase}” to czasownik nieregularny`,
        explanation: `Napisałeś „${w}”, ale „${naiveBase}” nie tworzy czasu przeszłego przez -ed. Poprawnie: „${x}” (${naiveBase} – ${past} – ${pp}).`,
      };
    }
    if ((w === 'was' && x === 'were') || (w === 'were' && x === 'was')) {
      return {
        title: 'Was czy were?',
        explanation: '„Was” z I, he, she, it; „were” z you, we, they. „You” zawsze ma „were”.',
      };
    }
    const base3 = [w.replace(/(es|s)$/, ''), w.replace(/s$/, ''), w.replace(/ies$/, 'y')].find((b) => b !== w && isPastOf(x, b));
    if (base3) {
      return {
        title: 'Czas teraźniejszy zamiast przeszłego',
        explanation: `„${w}” to forma czasu teraźniejszego. Zdanie dotyczy przeszłości, więc potrzebne jest „${x}”.`,
      };
    }
    if (isPastOf(x, w)) {
      return {
        title: 'Brak formy przeszłej',
        explanation: `Użyłeś formy podstawowej „${w}”, a potrzebna jest forma przeszła „${x}”.`,
      };
    }
    if (isPastOf(w, x)) {
      const afterDid = expectedBefore.includes('did');
      return {
        title: afterDid ? 'Po „did” forma podstawowa' : 'Niepotrzebna forma przeszła',
        explanation: afterDid
          ? `Napisałeś „${w}”, a powinno być „${x}”. Czas przeszły pokazuje już „did”, więc czasownik wraca do formy podstawowej: didn't go, did you see.`
          : `Napisałeś „${w}”, a w tym miejscu potrzebna jest forma podstawowa „${x}”.`,
      };
    }
    return null;
  },

  checkSentence({ user, expected, extras, missing, ops }) {
    const diagnoses: Diagnosis[] = [];
    const wrongUser = ops.flatMap((o) => (o.kind === 'wrong' ? [o.word] : []));
    if ([...extras, ...wrongUser].some((w) => w === 'have' || w === 'has') && !expected.includes('have') && !expected.includes('has')) {
      diagnoses.push({
        title: 'Present Perfect zamiast Past Simple',
        explanation: 'Przy konkretnym momencie w przeszłości (yesterday, last week, two days ago) używamy Past Simple, nie „have/has + III forma”.',
      });
    }
    if (extras.includes('did') && (expected.includes('was') || expected.includes('were'))) {
      diagnoses.push({
        title: 'Z „be” nie używamy „did”',
        explanation: '„Be” tworzy pytania i przeczenia samodzielnie: „Were you tired?”, „I was not at home”.',
      });
    } else if (extras.includes('did') && !expected.includes('did')) {
      diagnoses.push({
        title: 'Niepotrzebne „did”',
        explanation: '„Did” pojawia się tylko w pytaniach i przeczeniach (poza pytaniami o podmiot).',
      });
    }
    if (missing.includes('did') && !user.includes('did')) {
      diagnoses.push({
        title: 'Brakuje „did”',
        explanation: 'Pytania i przeczenia tworzymy z „did”: Did you go? / I did not go.',
      });
    }
    return { diagnoses, consumed: ['did', 'have', 'has'] };
  },
};

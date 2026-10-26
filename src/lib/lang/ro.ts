// Rumuński: normalizacja (n-am = nu am) i typowe błędy w czasie przeszłym (perfectul compus).
import type { Diagnosis, LanguagePack } from './types';
import { RO_PARTICIPLE_TO_INF, RO_VERBS, naiveParticiples } from './roVerbs';

/** Krótkie formy „a avea” używane jako czasownik posiłkowy. */
const AUX: Record<string, string> = {
  am: 'eu (ja) albo noi (my)',
  ai: 'tu (ty)',
  a: 'el / ea (on / ona)',
  ați: 'voi (wy) albo forma grzecznościowa dumneavoastră',
  au: 'ei / ele (oni / one)',
};

/** Pełne formy „a avea” (czas teraźniejszy: „mam, masz…”), mylone z posiłkowymi. */
const FULL_AVEA: Record<string, string> = { are: 'a', avem: 'am', aveți: 'ați' };

const AUX_TABLE = 'eu am, tu ai, el/ea a, noi am, voi ați, ei/ele au';

/** Posiłkowy ukryty w słowie: „am”, „m-am” → „am”, „s-au” → „au”, „n-ai” → „ai”. */
function auxOf(token: string): string | undefined {
  const last = token.split('-').pop()!;
  return last in AUX ? last : undefined;
}

/** Zaimek doklejony do posiłkowego: „m-am” → „m”, „l-am” → „l”. */
function cliticOf(token: string): string | undefined {
  const parts = token.split('-');
  return parts.length > 1 && auxOf(token) ? parts[0] : undefined;
}

const CLITIC_NAMES: Record<string, string> = {
  m: 'mă (się – ja)',
  te: 'te (się – ty)',
  s: 'se (się – on/ona/oni)',
  ne: 'ne (się – my)',
  v: 'vă (się – wy)',
  l: 'îl (go)',
  i: 'îi / i (mu, jej, im lub ich)',
  le: 'le (je, im)',
  mi: 'îmi (mi)',
  ți: 'îți (ci)',
  n: 'nu (nie)',
};

/** Pełne formy zaimków → forma przed łącznikiem: mă + am → m-am. */
const CLITIC_SHORT: Record<string, string> = { mă: 'm', ma: 'm', se: 's', vă: 'v', va: 'v', îl: 'l', il: 'l', îi: 'i', ii: 'i', nu: 'n' };

const before = '(?<=^|\\s)';
const after = '(?=\\s|$)';

export const ro: LanguagePack = {
  code: 'ro',
  nameTo: 'rumuński',
  speech: 'ro-RO',
  wordOrderHint:
    'W czasie przeszłym kolejność jest stała: (podmiot) + (nu) + (zaimek-)posiłkowy + imiesłów, np. „Eu nu am mâncat”, „L-am văzut”. Zaimek „o” (ją) stoi wyjątkowo po imiesłowie: „Am văzut-o”.',

  hyphenate: (a, b) => `${CLITIC_SHORT[a] ?? a}-${b}`,
  hyphenNote:
    'Krótkie zaimki łączą się z posiłkowym w jedno słowo z łącznikiem (m-am, s-a, te-ai, l-am), a zaimek „o” (ją) dołączamy łącznikiem po imiesłowie (am văzut-o).',

  // „n-am” i „nu am” znaczą to samo – porównujemy w pełnej formie.
  normalize(t) {
    return t.replace(new RegExp(`${before}n-(am|ai|a|ați|au)${after}`, 'g'), 'nu $1');
  },

  checkWord({ w, x }): Diagnosis | null {
    const auxW = auxOf(w);
    const auxX = auxOf(x);

    // Zły posiłkowy: „el am mâncat” zamiast „el a mâncat”
    if (auxW && auxX && auxW !== auxX) {
      return {
        title: 'Zła forma czasownika posiłkowego',
        explanation: `Napisałeś „${auxW}” – to forma dla: ${AUX[auxW]}. Tutaj potrzebne jest „${auxX}” – forma dla: ${AUX[auxX]}. Posiłkowy zmienia się przez osoby (${AUX_TABLE}), a imiesłów zostaje bez zmian.`,
      };
    }

    // Imiesłów bez doklejonego zaimka: „văzut” zamiast „văzut-o”
    if (x.startsWith(w + '-')) {
      const pron = x.slice(w.length + 1);
      return pron === 'o'
        ? {
            title: 'Zaimek „o” stoi po imiesłowie',
            explanation: `Powinno być „${x}”. Zaimek „o” (ją) dołączamy łącznikiem na końcu, po imiesłowie: „Am văzut-o” (widziałem ją).`,
          }
        : { title: 'Brakuje zaimka', explanation: `Powinno być „${x}” – z doklejonym zaimkiem „${pron}”.` };
    }

    // Zaimek osobowy zamiast posiłkowego: „eu fost” zamiast „am fost”
    if (auxX && !cliticOf(x) && ['eu', 'tu', 'el', 'ea', 'noi', 'voi', 'ei', 'ele'].includes(w)) {
      return {
        title: 'Brakuje czasownika posiłkowego',
        explanation: `W miejscu „${w}” potrzebny jest posiłkowy „${auxX}”. Zaimek możesz dodać („${w} ${auxX} …”), ale posiłkowego nie wolno pominąć – to on pokazuje osobę (${AUX_TABLE}).`,
      };
    }

    // Brak zaimka zwrotnego / osobowego: „am trezit” zamiast „m-am trezit”
    const clX = cliticOf(x);
    if (clX && !cliticOf(w) && auxW === auxX) {
      return {
        title: clX === 'n' ? 'Brakuje przeczenia' : 'Brakuje zaimka przed posiłkowym',
        explanation:
          clX === 'n'
            ? `Powinno być „${x}” (= nu ${auxX}). Przeczenie „nu” stoi przed czasownikiem posiłkowym.`
            : `Powinno być „${x}”. Zaimek ${CLITIC_NAMES[clX] ?? clX} łączy się z posiłkowym przez łącznik: „m-am trezit” (obudziłem się), „l-am văzut” (widziałem go), „s-a dus” (poszedł).`,
      };
    }

    // „are mâncat” – pełna forma „a avea” zamiast krótkiej
    if (FULL_AVEA[w] && FULL_AVEA[w] === auxX) {
      return {
        title: 'Pełna forma „a avea” zamiast posiłkowej',
        explanation: `„${w}” znaczy „ma / mamy / macie” (czas teraźniejszy). W czasie przeszłym używamy krótkiej formy posiłkowej: „${auxX}”. Krótkie formy: ${AUX_TABLE}.`,
      };
    }

    // Imiesłów
    const inf = RO_PARTICIPLE_TO_INF[x];
    if (inf) {
      const [present, part, meaning] = RO_VERBS[inf];
      if (w === inf || w === present) {
        return {
          title: w === inf ? 'Bezokolicznik zamiast imiesłowu' : 'Czas teraźniejszy zamiast imiesłowu',
          explanation: `„${w}” to ${w === inf ? 'bezokolicznik' : 'forma czasu teraźniejszego'} czasownika „a ${inf}” (${meaning}). Po czasowniku posiłkowym potrzebny jest imiesłów: „${part}”.`,
        };
      }
      if (naiveParticiples(inf).includes(w)) {
        return {
          title: `Nieregularny imiesłów: a ${inf} → ${part}`,
          explanation: `„${w}” to forma utworzona „z reguły”, ale „a ${inf}” (${meaning}) ma imiesłów „${part}”. Ten trzeba zapamiętać – zajrzyj do tabeli imiesłowów w teorii.`,
        };
      }
      if ([part + 'ă', part + 'i', part + 'e', part + 'ți'].includes(w)) {
        return {
          title: 'Imiesłów się nie odmienia',
          explanation: `W czasie przeszłym imiesłów ma zawsze tę samą formę: „${part}”, niezależnie od rodzaju i liczby. Po polsku „zjadłem / zjadłam / zjedli” – po rumuńsku zawsze „am / au mâncat”.`,
        };
      }
    }
    return null;
  },

  checkSentence({ user, expected, missing }) {
    const diagnoses: Diagnosis[] = [];
    const consumed: string[] = [];
    const u = user.join(' ');

    // „o am văzut” – zaimek „o” przed posiłkowym
    const oFirst = u.match(new RegExp(`${before}o\\s(am|ai|a|ați|ati|au)${after}`));
    if (oFirst) {
      diagnoses.push({
        title: 'Zaimek „o” stoi po imiesłowie',
        explanation: `Nie piszemy „o ${oFirst[1]} …”. Zaimek „o” (ją) dołączamy na końcu, po imiesłowie: „Am văzut-o” (widziałem ją), „Ai citit-o?” (przeczytałeś ją?).`,
      });
      consumed.push('o');
    }

    // „am nu mâncat” – przeczenie po posiłkowym
    if (new RegExp(`${before}(am|ai|a|ați|au) nu${after}`).test(u)) {
      diagnoses.push({
        title: 'Przeczenie przed posiłkowym',
        explanation: '„Nu” stoi przed czasownikiem posiłkowym: „Nu am mâncat” lub krócej „N-am mâncat”, a nie „Am nu mâncat”.',
      });
      consumed.push('nu');
    }

    // Brak posiłkowego – Polacy często go pomijają, bo po polsku osoba jest w końcówce („zjadłem”).
    const missingAux = missing.filter((m) => auxOf(m) && !cliticOf(m));
    if (missingAux.length > 0 && !user.some((t) => auxOf(t))) {
      diagnoses.push({
        title: 'Brakuje czasownika posiłkowego',
        explanation: `Czas przeszły (perfectul compus) zawsze składa się z dwóch części: posiłkowego (${AUX_TABLE}) i imiesłowu. Sam imiesłów nie wystarczy: „Am mâncat”, nie „Mâncat”. Tutaj zabrakło „${missingAux[0]}”.`,
      });
      consumed.push(...missingAux);
    }

    // Zbędne „nu”, gdy w odpowiedzi nie ma przeczenia
    if (user.includes('nu') && !expected.includes('nu')) {
      diagnoses.push({
        title: 'Niepotrzebne przeczenie',
        explanation: 'To zdanie jest twierdzące – nie ma w nim „nu”.',
      });
      consumed.push('nu');
    }
    return { diagnoses, consumed };
  },
};

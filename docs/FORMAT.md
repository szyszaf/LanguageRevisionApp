# Jak dodać nowy dział

Każdy dział to jeden plik w `src/data/categories/`, np. `roPerfectCompus.ts`.
Po utworzeniu pliku dopisz go do listy w `src/data/index.ts`:

```ts
import { roPerfectCompus } from './categories/roPerfectCompus';
import { roPrezent } from './categories/roPrezent';

export const categories: Category[] = [roPerfectCompus, roPrezent];
```

Pełne typy są w `src/types.ts`. Skrót:

## Dział (`Category`)

| Pole | Opis |
|---|---|
| `id` | unikalny identyfikator w adresie, np. `past-simple` |
| `title`, `subtitle` | np. „Czas przeszły”, „Perfectul compus” |
| `language` | język nauki, np. `ro` (reguły języka: `src/lib/lang/ro.ts`) |
| `level`, `icon`, `description` | poziom, emoji, krótki opis |
| `grammar` | lista tematów gramatycznych |
| `vocabulary` | lista słówek |
| `exercises` | lista ćwiczeń |

## Temat gramatyczny (`GrammarTopic`)

- `explanation`: akapity wyjaśnienia
- `patterns`: wzory budowy zdania
- `tables`: tabele (nagłówki + wiersze)
- `examples`: zdania z tłumaczeniem (`text`, `translation`, opcjonalnie `note`)
- `commonMistakes`: `wrong` / `correct` / `why`
- `tips`: wskazówki

## Słówko (`VocabEntry`)

- `word`, `translation`, `partOfSpeech`, opcjonalnie `forms` i `pronunciation`
- `usage`: przykłady użycia z tłumaczeniem
- `synonyms`: `word`, `translation`, `note` (czym się różni)
- `acceptedAnswers`: odpowiedzi akceptowane w teście PL → RO (np. `['a mânca', 'mânca']`)

Ze słówek automatycznie powstaje test „Słówka” oraz fiszki.

## Ćwiczenia (`Exercise`)

Trzy typy:

```ts
// Uzupełnij lukę (luka oznaczona ___)
{ id: 'g1', type: 'gap', sentence: 'Ea a ___ la Cluj.', hint: 'a merge', answers: ['mers'], explanation: '…', grammarRef: 'participle' }

// Wybór
{ id: 'c1', type: 'choice', question: 'El ___ o scrisoare.', options: ['a scris', 'are scris'], correct: 0,
  optionExplanations: ['Dobrze…', '„are” to pełna forma „a avea”'], explanation: '…' }

// Tłumaczenie zdania z polskiego
{ id: 't1', type: 'translate', prompt: 'Kupiłem chleb.', answers: ['Am cumpărat pâine.'], explanation: '…' }

// Tłumaczenie na polski (reverse) – podaj warianty rodzaju: Przeczytałem / Przeczytałam
{ id: 'r1', type: 'translate', reverse: true, prompt: 'Am citit o carte.', answers: ['Przeczytałem książkę.', 'Przeczytałam książkę.'], explanation: '…' }
```

- `answers`: wszystkie akceptowane wersje. Wielkość liter, interpunkcja i skróty (n-am = nu am) nie mają znaczenia.
  Odpowiedź bez znaków diakrytycznych jest zaliczana z ostrzeżeniem.
- `grammarRef`: `id` tematu, który można otworzyć pod pytaniem.
- `mistakes`: własne podpowiedzi do konkretnych błędów: `{ match: 'regex', explanation: '…' }`.
  Regex jest sprawdzany na odpowiedzi zapisanej małymi literami, ze skrótami rozwiniętymi do pełnych form.
  Uwaga: `\b` nie działa z literami ă, â, î, ș, ț – używaj spacji, `^` i `$`.

Typowe błędy aplikacja wykrywa sama: ogólne (szyk, literówki, diakrytyki, brak łącznika) w `src/lib/detectors.ts`,
a rumuńskie (posiłkowy, imiesłowy, zaimki m-am / l-am / am văzut-o, przeczenie) w `src/lib/lang/ro.ts`.
Nowe czasowniki do tabeli i wykrywania imiesłowów dopisuje się w `src/lib/lang/roVerbs.ts`.

## Ze zdjęć z Duolingo

Wrzuć zrzuty ekranu lekcji. Słówka, zdania i tematy z nich trafią do odpowiedniego działu w powyższym formacie,
uzupełnione o wyjaśnienia, synonimy i przykłady.

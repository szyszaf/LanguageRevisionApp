# Jak dodać nowy dział

Każdy dział to jeden plik w `src/data/categories/`, np. `pastSimple.ts`.
Po utworzeniu pliku dopisz go do listy w `src/data/index.ts`:

```ts
import { pastSimple } from './categories/pastSimple';
import { presentPerfect } from './categories/presentPerfect';

export const categories: Category[] = [pastSimple, presentPerfect];
```

Pełne typy są w `src/types.ts`. Skrót:

## Dział (`Category`)

| Pole | Opis |
|---|---|
| `id` | unikalny identyfikator w adresie, np. `past-simple` |
| `title`, `subtitle` | np. „Czas przeszły”, „Past Simple” |
| `language` | język nauki, np. `en` |
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
- `acceptedAnswers`: odpowiedzi akceptowane w teście PL → EN (np. `['go', 'to go']`)

Ze słówek automatycznie powstaje test „Słówka” oraz fiszki.

## Ćwiczenia (`Exercise`)

Trzy typy:

```ts
// Uzupełnij lukę (luka oznaczona ___)
{ id: 'g1', type: 'gap', sentence: 'Yesterday I ___ home.', hint: 'go', answers: ['went'], explanation: '…', grammarRef: 'irregular' }

// Wybór
{ id: 'c1', type: 'choice', question: 'I ___ him yesterday.', options: ['saw', 'have seen'], correct: 0,
  optionExplanations: ['Dobrze…', 'Present Perfect nie łączy się z yesterday'], explanation: '…' }

// Tłumaczenie zdania
{ id: 't1', type: 'translate', prompt: 'Kupiłem telefon.', answers: ['I bought a phone.'], explanation: '…' }
```

- `answers`: wszystkie akceptowane wersje. Wielkość liter, interpunkcja i skróty (didn't = did not) nie mają znaczenia.
- `grammarRef`: `id` tematu, który można otworzyć pod pytaniem.
- `mistakes`: własne podpowiedzi do konkretnych błędów: `{ match: 'regex', explanation: '…' }`.
  Regex jest sprawdzany na odpowiedzi zapisanej małymi literami, ze skrótami rozwiniętymi do pełnych form.

Typowe błędy w angielskim (goed, didn't went, was/were, literówki, brak „did”, Present Perfect z „yesterday”,
zły szyk) aplikacja wykrywa sama (`src/lib/detectors.ts`).

## Ze zdjęć z Duolingo

Wrzuć zrzuty ekranu lekcji. Słówka, zdania i tematy z nich trafią do odpowiedniego działu w powyższym formacie,
uzupełnione o wyjaśnienia, synonimy i przykłady.

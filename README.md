# Powtórki językowe

Aplikacja do powtarzania słówek i gramatyki z Duolingo.

- **Gramatyka**: tematy z wyjaśnieniami, wzorami, tabelami, przykładami z tłumaczeniem i typowymi błędami.
- **Słówka**: tłumaczenie, formy, wymowa, przykłady użycia i synonimy z tłumaczeniem; wyszukiwarka i odsłuchiwanie.
- **Ćwiczenia**: luki, wybór, tłumaczenie zdań i test ze słówek. Po każdej złej odpowiedzi aplikacja pokazuje
  porównanie słowo po słowie, rozpoznaje typ błędu (np. „goed”, „didn't went”, was/were, literówka) i wyjaśnia go.
  Złe odpowiedzi wracają na koniec rundy, a tryb „Moje błędy” pozwala je powtórzyć później.
- **Fiszki** z systemem powtórek Leitnera.
- Postęp zapisuje się w przeglądarce (localStorage).

Na razie jest jeden dział pokazowy: **Czas przeszły (Past Simple)**.

## Uruchomienie

```bash
npm install
npm run dev      # serwer deweloperski
npm test         # testy
npm run build    # wersja produkcyjna w dist/
```

## Struktura

```
src/
  data/categories/   treść działów (gramatyka, słówka, ćwiczenia)
  data/index.ts      lista działów
  lib/answer.ts      normalizacja i porównywanie odpowiedzi
  lib/detectors.ts   automatyczne rozpoznawanie i wyjaśnianie błędów
  lib/progress.ts    zapis postępu
  components/        widoki aplikacji
docs/FORMAT.md       jak dodać nowy dział
```

Treść jest oddzielona od kodu, więc później można dodać backend (np. API z bazą słówek i kontami użytkowników)
bez przepisywania widoków.

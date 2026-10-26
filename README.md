# Powtórki językowe

Aplikacja do powtarzania słówek i gramatyki z Duolingo. Obecnie: **język rumuński**.

- **Gramatyka**: tematy z wyjaśnieniami, wzorami, tabelami, przykładami z tłumaczeniem i typowymi błędami.
- **Słówka**: tłumaczenie, formy, wymowa, przykłady użycia i synonimy z tłumaczeniem; wyszukiwarka i odsłuchiwanie.
- **Ćwiczenia**: luki, wybór, tłumaczenie zdań (PL → RO i RO → PL) i test ze słówek. Po każdej złej odpowiedzi
  aplikacja pokazuje porównanie słowo po słowie, rozpoznaje typ błędu (np. zły czasownik posiłkowy „ei a” zamiast
  „ei au”, „vedut” zamiast „văzut”, brak łącznika w „m-am”, brak znaków diakrytycznych) i wyjaśnia go.
  Pod polem odpowiedzi są przyciski ă â î ș ț.
  Złe odpowiedzi wracają na koniec rundy, a tryb „Moje błędy” pozwala je powtórzyć później.
- **Fiszki** z systemem powtórek Leitnera.
- Postęp zapisuje się w przeglądarce (localStorage).

Na razie jest jeden dział pokazowy: **Czas przeszły (perfectul compus)**.

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
  lib/detectors.ts   ogólne rozpoznawanie błędów (szyk, literówki, diakrytyki, łączniki)
  lib/lang/          reguły dla języków: ro.ts (rumuński), en.ts (angielski), pl.ts
  lib/progress.ts    zapis postępu
  components/        widoki aplikacji
docs/FORMAT.md       jak dodać nowy dział
```

Treść jest oddzielona od kodu, więc później można dodać backend (np. API z bazą słówek i kontami użytkowników)
bez przepisywania widoków.

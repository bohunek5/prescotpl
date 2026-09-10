# Prescot — strona firmowa

Statyczna wersja strony publikowana z gałęzi `main` w GitHub Pages:
https://bohunek5.github.io/prescotpl/.

## Podgląd lokalny

W katalogu repozytorium uruchom:

```sh
python3 -m http.server 4178 --bind 127.0.0.1
```

Otwórz http://127.0.0.1:4178/. Strona nie wymaga kompilacji.

## Wspólne style i nawigacja

- `prescot-global.css` zawiera wspólne style, w tym przyciski i układ tekstów karuzeli.
- `local-navigation.js` obsługuje menu, przewijanie i kontrolki karuzeli.
- Eksport zawiera równoległe adresy, np. `kontakt.html` i `kontakt/index.html`. Zmiany treści należy nanosić w obu plikach.
- Po zmianach wspólnych plików zaktualizuj ich parametr `?v=` we wszystkich plikach HTML, aby przeglądarki pobrały poprawki.
- Starsze skrypty generujące pliki zawierają ścieżki do wcześniejszego środowiska. Nie są częścią procesu publikacji.

## Sprawdzenie układu

```sh
npm ci
npx playwright install chromium webkit
# Przy uruchomionym serwerze lokalnym:
npm run test:layout
BROWSER=webkit TEST_WIDTHS=390 npm run test:layout
```

Test obejmuje ofertę, wszystkie modele taśm i pozostałe kategorie produktów,
strzałki strony głównej i dystrybucji oraz kontakt. Sprawdza nakładanie tekstów,
przełączanie modeli rzeczywistymi kliknięciami, cienie przycisków, szerokość
menu i strony oraz błędy JavaScript. Domyślne szerokości: 320, 390, 768 i 1440 px.
Zrzuty i raporty trafiają do pomijanego przez Git katalogu `output/layout-review/`.

Opcjonalnie `BASE_URL` wskazuje inny serwer, `TEST_WIDTHS` ogranicza szerokości,
a `ONLY_EXTRA=1` sprawdza dodatkowe kategorie produktów oraz kontakt.

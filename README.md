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

## Asystent doboru zestawu

Przycisk sklepu w docku otwiera panel `shop-assistant/panel.mjs`. Na kartach
produktów pojawia się również mała podpowiedź. Jej zamknięcie jest pamiętane
w obrębie sesji. `?dobierz=1` otwiera panel bezpośrednio.

Dobór działa lokalnie na parametrach katalogu, bez wywołań modeli i bez
ciągłego nasłuchu. Rozpoznaje metraż, napięcie, moc zasilacza, MONO/CCT/RGB/RGBW/
RGB+CCT, COB/SMD i serię PR Touch. Nie jest ogólnym czatem z modelem językowym.
Dyktowanie jest opcjonalne i zależy od Web Speech API przeglądarki. Uruchamia
się wyłącznie przyciskiem mikrofonu i zatrzymuje po zamknięciu panelu.

Katalog ładuje się dopiero przy otwarciu panelu. Eksport obejmuje publiczne dane
taśm, zasilaczy Scharfer i PR Touch ze sklepSC, bez cen i stanów magazynowych:

```sh
node scripts/export-shop-catalog.mjs ../sklepSC/js/products-data.js
npm run test:set
# Uruchom także sklepSC na porcie 4179:
npm run test:set-ui
BROWSER=webkit npm run test:set-ui
```

Taśma `24EC840-036-12-RGBCC` ma uzupełnione parametry z jej oficjalnej karty PDF
(odnośnik w katalogu). Moc RGB+CCT to 20 W/m, a 10 W/m dotyczy samego CCT.
Silnik przyjmuje zapas zasilacza 20%, rozróżnia długość montowaną od kupowanych
rolek i blokuje potwierdzenie przy brakach danych lub niezgodnych parametrach.

Przekazanie do `https://bohunek5.github.io/sklepSC/zestaw.html` zawiera w hashu
wyłącznie parametry, identyfikatory produktów i ilości. Sklep ponownie weryfikuje
dobór oraz pobiera własne nazwy i ceny. Dodanie do koszyka wymaga kliknięcia
na stronie zestawu; dotychczasowe pozycje pozostają zachowane.

Po zmianie silnika lub eksportu synchronizuj `engine.mjs` i `catalog.json`
z `sklepSC/js/set-assistant/`, testuj oba projekty i publikuj najpierw sklepSC.

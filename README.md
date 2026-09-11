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
- `prescot-mobile.css` i `site-experience.mjs` uzupełniają widok mobilny,
  menu „Więcej”, katalogi i animację produkcji. Nie są generowane z WordPressa.
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

## Responsywność — 11 września 2026

Oferta i taśmy LED na telefonie mają osobny, dotykowy katalog oparty na tych
samych nazwach, opisach, zdjęciach i adresach, co eksport desktopowy. Pierwszy
ekran pokazuje jeden model, a poniżej znajduje się pełna lista 7 kategorii lub
15 serii. Obsługiwane są gesty, przyciski i klawisze strzałek. Widok desktopowy
zachowuje dotychczasowy slider. Uzupełnienie działa przy włączonym JavaScript;
bez niego pozostaje bazowy eksport.

Mobilny dock pokazuje Start, Ofertę, Taśmy, Produkcję, Dystrybucję i „Więcej”.
W „Więcej” są kontakt, baza wiedzy, sklep B2C/asystent oraz bezpośredni link do
WAPRO B2B (`https://prescot.abstore.pl/`). Przełącznik języka jest w nagłówku
tego okna, dzięki czemu sześć przycisków docka ma co najmniej 44 px szerokości.
Automatyczna podpowiedź asystenta jest ukryta na telefonie, aby nie zasłaniać
wejścia. Panel nadal otwiera się z menu lub przez `?dobierz=1`.

Strzałka przewijania jest wspólna dla stron z treścią; nie jest dublowana na
kartach produktów. Produkcja używa lokalnej animacji przewijania zamiast
zewnętrznego dema Webflow. Oryginalny znak `PRESCOT_pattern2-1.svg` jest maską
dziewięciu filmów. Znak obraca się przy przewijaniu, a przeciwobrót warstwy filmów
utrzymuje kadry prosto i w stałym miejscu. Całość wygasa przy wejściu kolejnego
bloku. Przy ograniczeniu ruchu znak pozostaje nieruchomy; filmy są pauzowane
poza widokiem. Pionowy film hero produkcji został zachowany.

Start i `/prescotled/` używają lokalnego `START.mp4` — istniejącej wersji filmu
`START.mov` ze strony tasmaled.com.pl/prescotled/. Źródło nie zawiera osobnego
filmu mobilnego; na telefonach działa wyśrodkowane `object-fit: cover`.
Film wypełnia cały hero, a po rozpoczęciu odtwarzania znika tło zapasowe.
Usunięto trójkątny separator. Hero ma sześć ikon, w tym linię SMT i laboratorium
pomiarowe. Podpisy wejścia głównego i produkcji mają wspólną dolną linię.

Showcase marek używa `IntersectionObserver` zamiast `ScrollTrigger.refresh`,
który przy zmianach wysokości okna na telefonie wykonywał skoki do zera.
Pozostają animacje wejścia i tła; nie zmieniają pozycji przewijania. Mniejsze
teksty ofert i przyciski są testowane na wszystkich 22 slajdach mobilnych.

Karty PR-MAD i sterowników mają zdjęcia bez przycinania, bezwzględnego
pozycjonowania i nakładania na specyfikacje. Zmiany tych kart obejmują także
desktop; pozostałe pojedyncze serie zachowują swoją prezentację. Poprawiono
ścieżki zdjęć dla prefiksu `/prescotpl/` i brakujące tło współpracy B2B.

```sh
npm run test:responsive
npm run test:brand-mask
npm run test:mobile-polish
BROWSER=webkit TEST_WIDTHS=320,390,768,1440 npm run test:responsive
npm run test:mobile-interactions
node scripts/check-set-fallbacks.mjs
TEST_WIDTHS=1440 npm run test:layout
```

Raporty i zrzuty są w `output/responsive-verification/`. Test interakcji serwuje
lokalne pliki pod docelowym adresem przez przechwytywanie żądań, bez publikacji.
Wyłącza tylko spekulacyjne pobieranie HTML w tej symulacji, żeby Chromium nie
pobrał starej wersji z GitHub z pominięciem przechwytywania. Testuje także gest
dotykowy w Chromium oraz menu, asystenta i odnośniki w obu silnikach.

Warstwa mobilna i nawigacja mają wersję `20260911-brand2`, pozostałe wspólne
zasoby zachowują `20260911-mobile1`. Mechaniczną aktualizację ich
odnośników we wszystkich wariantach HTML wykonuje
`node scripts/update-responsive-assets.mjs`. Bazowy adres jest zapisany w HTML
przed zasobami, żeby uniknąć spekulacyjnych żądań do błędnych podkatalogów.
Skrypt dopasowuje bazę do lokalnego podglądu; wersja bez JS używa GitHub Pages.

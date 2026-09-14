# Katalog KLUŚ — 14.09.2026

Konfigurator zawiera 72 profile i 42 osłony. Dodano 46 rodzin, zaktualizowano MICRO-PLUS do bieżącego przekroju 15,6 × 6 mm i usunięto archiwalny MICRO-K. Rejestr obejmuje 391 różnych SKU akcesoriów i 1899 przypisań do profili. Każde przypisanie akcesorium występuje w karcie KLUŚ oraz cenniku 1.09.2026. Publikowane dane nie zawierają cen ani rabatów; obecność w cenniku nie jest deklaracją stanu magazynowego.

Wybór osłony i wykończenia korzysta z rzeczywistych symboli. Potwierdzone zmiany oznaczeń osłon migrują przy odczycie konfiguracji. Archiwalny MICRO-K otwiera MICRO-NK z widocznym wymogiem sprawdzenia aktualnego profilu.

Zaślepki mają wybór wariantu, a MICRO-30DEG-KOZ, KOPRO-30 i OLIS dedykowane pary lewe/prawe. Wariant OTW zastępuje jedną pełną zaślepkę. Dodatkowe akcesoria trafiają do JSON i karty zestawu; ilości mocowników wymagają doboru. Wymiary zaślepek pochodzą z ich kart. Bez potwierdzonych gabarytów model zakończenia pozostaje niewyświetlany. Specjalne mocowniki są w zestawieniu i instrukcji, bez fikcyjnej uniwersalnej animacji.

Przekroje odtworzono z rysunków KLUŚ, z zachowaniem otworów materiałowych oraz szerokości i wysokości korpusu. Linie wymiarowe i przykładowe PCB nie stają się aluminium. Płaszczyzna klejenia i drobne zatrzaski są uproszczone; model nie jest dokumentacją wykonawczą. HSP i HR pozostają sztywne podczas składania.

[Rejestr źródeł i przypisań](../konfigurator/assets/sources/catalog-2026-09/registry.json) i [zakres rodzin](../konfigurator/assets/sources/catalog-2026-09/coverage.json) opisują również pozostałą pracę: 30 komponentów systemowych, 14 rodzin wielokanałowych i 30 rodzin wymagających dalszej weryfikacji źródeł/geometrii. Ta aktualizacja obsługuje jeden kanał LED; nie jest pełną obsługą wszystkich 146 rodzin z cennika.

Walidacja: 68 testów źródła PASS; 7 testów opublikowanego katalogu PASS; 47 nowych/zmienionych przekrojów w Chromium PASS i kontrola zrzutów; wybór akcesoriów i układ w Chromium 1440 px oraz WebKit 390 px PASS. Pobrane JSON, HTML i GLB mają poprawne symbole, długość 375/350 mm i dwie różne zaślepki KOPRO-30. W bezruchu brak kolejnych klatek.

Odtwarzanie kontroli: `npm run test:configurator-catalog`, `node scripts/check-configurator-catalog-ui.mjs`, `node scripts/check-configurator-catalog-models.mjs`. Testy przeglądarkowe używają lokalnego serwera 4178. Źródło aplikacji jest w sąsiednim katalogu prescot-led-studio; synchronizacja przez `npm run sync:configurator`.

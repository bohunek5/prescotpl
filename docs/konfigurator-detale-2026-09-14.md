# Detale konfiguratora — 14.09.2026

Slim ma logo PRESCOT LED w poprzek PCB, w wolnym miejscu między elementami. Kontrola geometrii sprawdza odstęp od diod, lutów, rezystorów i pól cięcia. Nowy model Delux Low Brightness 4014 ma parametry pozycji 24D001-050-10-WW; łącznie w konfiguratorze jest 18 taśm.

Obudowy 2835 / 2216 / 4014 / 5050 mają osobne proporcje i zagłębione pola optyczne. Zdjęcia PRESCOT wyznaczają wygląd dwudzielnej CCT i RGBW: półkole luminoforu bieli plus trzy małe struktury RGB. Dokumentacja obudów innych producentów służy jako odniesienie geometryczne, bez wskazywania dostawcy chipów PRESCOT.

Sześć koszulek PRO korzysta z dostarczonych przekrojów. Żółte obszary optyczne i szare ścianki są oddzielnymi materiałami. SIDE ma pionowe PCB i główne wyjście światła górą; TOP — kopułą; OVAL — dookoła. Białe nasadki silikonowe, przepusty i przypisane uchwyty są niezależne od akcesoriów KLUŚ i trafiają do eksportu. Przewody zbiegają się do przepustu. Detale wykonawcze pozostają poglądowe; ilość uchwytów wymaga doboru.

HS-12 i KA-13 mają szerokości 13,1 / 14,8 mm oraz osobne wartości przepuszczalności. Podgląd pokazuje miękką poświatę wychodzącą z powierzchni optycznej. Intensywność i zasięg reagują na ściemniacz. To ilustracja światła, nie obliczenie fotometryczne. Aluminium i spodnia strona PCB nie emitują światła.

Produkt jest centrowany niezależnie od kamery, a odklejany papier nie rozszerza kadru całej animacji. STOS ma gładkie skrzydła. Bufor obrazu odzyskuje rozdzielczość Retina po zakończeniu ruchu; scena nie renderuje w bezruchu.

Weryfikacja: `npm run check` w źródle `prescot-led-studio` obejmuje 50 testów danych i geometrii. W repozytorium strony: `node scripts/check-configurator-studio.mjs`, `node scripts/check-configurator-housing.mjs`, `node scripts/check-configurator-optics.mjs`. Zrzuty i eksporty są zapisywane w ignorowanym katalogu `output/configurator`. Rejestr źródeł: `konfigurator/assets/sources/studio-v9-sources.json`.

## Późniejszy moduł: „Wyślij zdjęcie — oświetlimy Twoją przestrzeń”

Zachowana decyzja użytkownika: aktualny konfigurator koncentruje się na produkcie i montażu. W kolejnym etapie klient przesyła zdjęcie, zaznacza strefy, podaje wymiary i oczekiwany efekt. Wynikiem będzie wizualizacja oraz zestaw produktów PRESCOT. Wariant z rzutem z wymiarami może obejmować rozmieszczenie opraw, obwody i zestawienie; obliczenia wymagają danych fotometrycznych i weryfikacji projektu. Formularz, przechowywanie zdjęć i generowanie wizualizacji nie są obecnie wdrożone.

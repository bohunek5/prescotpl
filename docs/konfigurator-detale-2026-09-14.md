# Detale konfiguratora — 14.09.2026

Slim ma logo PRESCOT LED w poprzek PCB, w wolnym miejscu między elementami. Kontrola geometrii sprawdza odstęp od diod, lutów, rezystorów i pól cięcia. Nowy model Delux Low Brightness 4014 ma parametry pozycji 24D001-050-10-WW; łącznie w konfiguratorze jest 18 taśm.

Obudowy 2835 / 2216 / 4014 / 5050 mają osobne proporcje i zagłębione pola optyczne. Zdjęcia PRESCOT wyznaczają wygląd dwudzielnej CCT i RGBW: półkole luminoforu bieli plus trzy małe struktury RGB. Dokumentacja obudów innych producentów służy jako odniesienie geometryczne, bez wskazywania dostawcy chipów PRESCOT.

Sześć koszulek PRO korzysta z dostarczonych przekrojów. Żółte obszary optyczne i szare ścianki są oddzielnymi materiałami. SIDE ma pionowe PCB i główne wyjście światła górą; TOP — kopułą; OVAL — dookoła. Białe nasadki silikonowe, przepusty i przypisane uchwyty są niezależne od akcesoriów KLUŚ i trafiają do eksportu. Przewody zbiegają się do przepustu. Detale wykonawcze pozostają poglądowe; ilość uchwytów wymaga doboru.

HS-12 i KA-13 mają szerokości 13,1 / 14,8 mm oraz osobne wartości przepuszczalności. Podgląd pokazuje miękką poświatę wychodzącą z powierzchni optycznej. Intensywność i zasięg reagują na ściemniacz. To ilustracja światła, nie obliczenie fotometryczne. Aluminium i spodnia strona PCB nie emitują światła.

Produkt jest centrowany niezależnie od kamery, a odklejany papier nie rozszerza kadru całej animacji. STOS ma gładkie skrzydła. Bufor obrazu odzyskuje rozdzielczość Retina po zakończeniu ruchu; scena nie renderuje w bezruchu.

Weryfikacja: `npm run check` w źródle `prescot-led-studio` obejmuje 61 testów danych, geometrii i odtwarzania. W repozytorium strony: `node scripts/check-configurator-studio.mjs`, `node scripts/check-configurator-housing.mjs`, `node scripts/check-configurator-optics.mjs`. Zrzuty i eksporty są zapisywane w ignorowanym katalogu `output/configurator`. Rejestr źródeł: `konfigurator/assets/sources/studio-v9-sources.json`.

## Późniejszy moduł: „Wyślij zdjęcie — oświetlimy Twoją przestrzeń”

Zachowana decyzja użytkownika: aktualny konfigurator koncentruje się na produkcie i montażu. W kolejnym etapie klient przesyła zdjęcie, zaznacza strefy, podaje wymiary i oczekiwany efekt. Wynikiem będzie wizualizacja oraz zestaw produktów PRESCOT. Wariant z rzutem z wymiarami może obejmować rozmieszczenie opraw, obwody i zestawienie; obliczenia wymagają danych fotometrycznych i weryfikacji projektu. Formularz, przechowywanie zdjęć i generowanie wizualizacji nie są obecnie wdrożone.

## WCOB — zakończenia i podkład

Dodano białą nasadkę silikonową z przewodami i pełną zaślepkę dopasowane do półokrągłego przekroju. Zamknięte końce zachowują ciągłość świecenia; zdjęte nasadki i spód są nieemisyjne. Występowanie akcesoriów potwierdził właściciel PRESCOT; ich SKU pozostaje nieustalone. Nie używamy kodów akcesoriów PRO.

Zdjęcie `reference-19377-1.jpg` potwierdza jasny podkład z czerwonym 3M, bez wskazania serii kleju. WCOB pokazuje go na spodzie, a przy montażu odkleja od środka w obu kierunkach przed osadzeniem taśmy. Reguła jest wspólna dla sceny i GLB. Zestaw zakończeń trafia do JSON i karty także w wariancie z profilem.

Test `node scripts/check-configurator-wcob.mjs`: Chromium 1440 px i WebKit 390 px, WCOB mono/CCT, zakończenia, kolejność odklejania, zachowanie kamery, animowany GLB i brak renderowania w bezruchu.

## 3w1 i krańcówka

LOW / MEDIUM / HIGH są obok jasności w podglądzie, z mocą 3 / 6 / 11 W/m i wartością strumienia dla wybranego wariantu. Wspólna proporcja emisji 460 / 930 / 1750 lm/m obejmuje także przesłonę i koszulkę. Zmiana wariantu zachowuje jasność, barwę i kamerę.

Model strefy oraz LED/suwak korzystają ze wspólnego stanu wyjściowego krańcówki. Zamknięcie szuflady lub szafki pokazuje 0% i wyłącza światło, bez kasowania ustawienia do przywrócenia. Synchronizacja działa podczas animacji i przy ograniczonym ruchu. Front szuflady dochodzi do górnej listwy z niewielką szczeliną zamiast pozostawiać otwarty pas nad frontem. Ręczne wyłączenie i ręczny tryb sterowania są zachowane.

Kontrola: `node scripts/check-configurator-light-controls.mjs` — Chromium 1440/320 px i WebKit 390 px.

## Pomysł do rozmowy: zestaw komponentów i dokumentacja

Inspiracja użytkownika: ekran Kanlux z listą elementów zestawu, instrukcjami, kartami produktów i pobraniem wszystkich dokumentów. Połączyć temat z przyszłymi projektami ze zdjęć/rzutów oraz realizacjami. Do przedyskutowania przed wdrożeniem; obecne poprawki nie uruchamiają tej usługi.

## Oznaczenie dystrybutora i ruch przesłony

Nagłówek pokazuje oryginalną grafikę „KLUŚ Official Distributor” z zasobów strony, następnie logo PRESCOT LED i powrót na www.prescot.pl. Tryb nocny zachowuje czerwony znak KLUŚ; napis dystrybutora jest biały. Na wąskim ekranie powrót ma postać ikony z dostępną nazwą, a oba znaki pozostają widoczne.

Przesłony mają wspólne, łagodne wygięcie wzdłuż odcinka. Po osadzeniu taśmy wygięta przesłona opada do kanału, środek dochodzi pierwszy, następnie prostują się końce i zamykają zaślepki. Rozkładanie odwraca tę kolejność. Jeden morph na GPU zachowuje przekrój i nie przebudowuje siatki w każdej klatce. Wygięcie trafia także do animacji GLB obok odklejania podkładu. Promień wygięcia jest zabiegiem prezentacyjnym, nie parametrem materiałowym producenta.

Testy geometrii obejmują wszystkie 38 przesłon. `node scripts/check-configurator-cover-flex.mjs` sprawdza rodziny MICRO, STOS, 45-ALU, LENSO i PIKO-O, pełne odtwarzanie, odwrócenie na telefonie, ograniczony ruch, stałość kamery, bezruch renderera, nagłówek dzień/noc oraz morph przesłony i papieru w pobranym GLB. Rozmiary: Chromium 1440/320 px i WebKit 390 px.

## Strefy, przymiarka i zestawienie

Ruchome strefy mają przycisk Odtwórz/Pauza: otwieranie i zamykanie w pętli z postojem na końcach oraz wspólnym sterowaniem krańcówką. Pauza zachowuje pozycję. Zmiana wykończenia nie resetuje kamery ani położenia frontu. Ukrycie karty zatrzymuje pętlę, a ograniczony ruch przełącza pozycję bez ciągłej animacji. Strefy statyczne zachowują wybór wykończenia bez przycisku ruchu.

Osiem wykończeń: biały, czarny, szary, ecru, dąb naturalny, dąb bielony, orzech i jesion. Cztery osobne proceduralne tekstury drewna są używane także w próbkach wyboru. To warianty wizualne, bez przypisania do dekorów konkretnego producenta płyt.

W standardowym montażu we frezie pierwszy krok pokazuje samo podłoże, drugi — przymiarkę samego profilu. Taśma pojawia się w trzecim, przewody w czwartym, przesłona w piątym. Procedury KOZUS, LARKO i profili do płyt g-k zachowują własną kolejność z dokumentacji. Przewody wychodzą z rzeczywistych pozycji pól w modelu wybranej taśmy: mono ma dwa połączenia, 3w1 zawsze cztery (+24V/L/M/H), CCT trzy, RGBW pięć. W 3w1 wybór mocy zmienia aktywny kanał, a wszystkie przewody pozostają w modelu i eksporcie. Wybrana zaślepka ma przepust; jeśli nie ma przypisanego wariantu z otworem, model pokazuje przygotowanie otworu bez nadawania nowego symbolu produktu. Geometria przepustu i trasy pozostaje poglądowa.

Blok Zestawienie ma własne białe tło, łagodną obwódkę i parametry w dwóch kolumnach. W trybie nocnym zachowuje ciemną powierzchnię. `node scripts/check-configurator-zone-playback.mjs` obejmuje odtwarzanie, osiem wykończeń, przymiarkę i połączenia przewodów na komputerze oraz telefonie.


Kontrola czterech żył 3w1: `node scripts/check-configurator-threeinone-wires.mjs` — LOW/MEDIUM/HIGH zachowują +24V/L/M/H w detalu, profilu, montażu i strefie. Zmienia się wyłącznie oznaczenie aktywnej pary i moc. Test obejmuje też eksport GLB, stałość kamery, zachowanie kroku montażu oraz niezmienione liczby żył mono/CCT/RGBW. Strefy korzystają z połączeń pól PCB zamiast pojedynczej zastępczej linii przewodu.

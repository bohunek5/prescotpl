# Czytelne profile i pokaz trzech mocy

Korekta po zrzutach telefonu: srebrne ścianki profili traciły krawędzie w białych odbiciach, a dwukolumnowy wybór osłon POLI wyjeżdżał poza panel.

- Aluminium ma łagodniejsze odbicie i bardziej matową powierzchnię szczotkowaną. Ekspozycja trybu dziennego została nieznacznie obniżona; sterowanie jasnością LED działa niezależnie.
- Karty osłon dopasowują wysokość do nazwy, referencji, transmisji i ograniczenia mocy. Na telefonie mają jedną kolumnę, na większych ekranach układ dopasowuje liczbę kolumn do dostępnego miejsca.
- Stały przekrój i przycisk Złóż/Rozłóż mają wspólną ramkę, promień 16 px i jednakową wysokość. Miniatura przekroju na telefonie ma 68 × 58 px; miniatury wyboru profili 70 × 60 px.
- Film nadal trwa 5 sekund. Po odklejeniu podkładu 3M, wklejeniu PCB oraz złożeniu osłony i zaślepek pokazuje LOW, MEDIUM i HIGH po 0,7 s każdy. Moce 3 / 6 / 11 W/m pochodzą z karty DELUX 3 w 1. Zmieniają się rzeczywiste emisje PCB, osłony, poświaty i światła odbitego, zgodnie z proporcjami strumienia 460 / 930 / 1750 przyjętymi w katalogu konfiguratora.
- Wszystkie cztery przewody pozostają widoczne. Aktywna para to kolejno +24V/−L, +24V/−M i +24V/−H. Aktywne pole mocy jest wyróżnione także w podpisie filmu.
- Film ma dokładniejsze cienie i dodatkowe światło podkreślające obrys. Zatrzymuje renderowanie po zakończeniu, respektuje ograniczenie ruchu i usuwa swój podgląd po wejściu do konfiguratora.

Kontrola źródła: 75 testów przeszło. Chromium 1440 i WebKit 390 sprawdzają wszystkie 42 karty osłon, wykończenia profili dzień/noc i brak przewijania poziomego. Osobny test filmu potwierdza kolejność montażu, cztery przewody, wzrost emisji w trzech trybach oraz sprzątanie renderera. Układ dodatkowo sprawdzony przy szerokościach 320, 768 i 834 px.

Źródło aplikacji pozostaje w `prescot-led-studio`; publikowana kopia powstaje przez `npm run sync:configurator`. Strona `prescotled` korzysta z tego samego filmu i otrzymuje zaktualizowane podpisy faz oraz numer jego wersji.

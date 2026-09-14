# Light Studio: schody, sterowanie i wejście

Po wyborze profilu jego przekrój z aktualną osłoną i światłem pozostaje przy przycisku składania. Model jest kadrowany nieco wyżej; ręczny obrót i kadr pozostają zachowane podczas zmiany produktów i parametrów. Nagłówki wyboru mają delikatne wyróżnienie i większe plusy. Dzień/noc korzysta z przełącznika z ikonami.

Przebudowa modelu pokazuje animację znaku D PRESCOT i lekko rozmyte tło. Zmiany trafiają do kolejki uwzględniającej najnowszy wybór. Eksport czeka na zakończenie przebudowy. Pole długości koszulek zachowuje wybrany detal; wsuwanie PCB w nieruchomą koszulkę można odtwarzać i zatrzymywać. Świeci część zawierająca wsuniętą taśmę. Eksport pozostaje złożonym zestawem pełnej długości.

Dodano dwie strefy schodów: pod noskiem oraz w bocznej zabudowie. Regulacja obejmuje grubość, odsunięcie, wysokość linii, powierzchnię/frez i podstopnice. Frez jest otworem w geometrii; ograniczenie odsunięcia pozostawia miejsce przed podstopnicą. Dziewięć emiterów rzuca cienie, a niewielkie przybliżone odbicie pochodzi od powierzchni przeciętej promieniem. Fragment i wymiary służą prezentacji montażu, nie wymiarowaniu konstrukcji ani obliczeniom fotometrycznym.

Strona powitalna pokazuje 12,8-sekundowy montaż istniejących modeli: PRESCOT 3w1 z czterema przewodami, obrót, MICRO-PLUS, taśma, osłona, zaślepki, podłączenie i światło. Hasło końcowe: „Zobacz, jakie to proste!”. Rozpoczęcie konfiguracji jest dostępne przez cały czas. Pokaz ma pauzę, powtórzenie, statyczny wariant przy ograniczeniu ruchu i usuwa swój renderer po przejściu do studia.

Źródło: sąsiedni katalog `prescot-led-studio`; synchronizacja `npm run sync:configurator`. Dane katalogu pozostają na poziomie 72 profili, 42 osłon i 391 różnych SKU akcesoriów.

Walidacja: 73 testy źródła, 7 testów katalogu publikacji, Chromium i WebKit dla nowych kontrolek, schodów, suwaka, pauzy wsuwania oraz kolejnych ujęć wejścia. `npm run test:configurator-studio` sprawdza szerokości 320/390/834/1440 i brak stałego renderowania. `node scripts/check-configurator-housing.mjs` obejmuje eksport JSON/HTML/GLB i dotychczasowe rodziny obudów. Nowe scenariusze: `node scripts/check-configurator-polish.mjs`, `node scripts/check-configurator-welcome.mjs`.

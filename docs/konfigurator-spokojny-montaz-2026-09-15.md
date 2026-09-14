# Spokojniejszy pokaz montażu — 15.09.2026

Build `1deadf165ec6` realizuje najnowszą korektę użytkownika: intro trwa 6 sekund i kończy się jednym łagodnym zapaleniem światła. Usunięto demonstrację LOW/MEDIUM/HIGH i belkę promocyjną z wejścia. Pozostają cztery przewody, odklejenie podkładu 3M, osadzenie PCB, osłona i zaślepki. Sterowanie mocą w głównym konfiguratorze działa jak wcześniej.

Przycisk Złóż / Rozłóż zachowuje szerokość 100 px; tekst ma 14 px, padding 6 px. Wysokość pozostaje dopasowana do ramki przekroju: 70 px mobile, 66 px desktop. Dłuższe etykiety przycisków koszulek nie zostały objęte stałą szerokością.

Weryfikacja: 75/75 testów źródła, film Chromium 1440 i WebKit 390 DPR 2, faktyczne cykle składania przy 320/390/1440 px oraz test przygotowanej kopii publikacji w WebKit 390. Potwierdzono kolejność montażu, jedno narastanie rzeczywistej emisji po zamknięciu, cztery przewody, widoczny przycisk startu, ograniczenie ruchu, zwolnienie renderera i brak bezczynnego renderowania.

Poprzednia notatka o trzech mocach opisuje wcześniejsze życzenie, zastąpione tą korektą. Oddzielna strona prescotled aktualizuje wyłącznie wspólny film, jego czas, podpisy i wersję modułu.

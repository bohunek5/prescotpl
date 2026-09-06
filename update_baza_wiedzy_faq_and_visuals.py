# -*- coding: utf-8 -*-
import re
import os

base_dir = "/Users/karolbohdanowicz/safe_backup/tasmaled-local/public"
target_files = [
    os.path.join(base_dir, "baza-wiedzy", "index.html"),
    os.path.join(base_dir, "wiedza.html"),
    os.path.join(base_dir, "wiedza", "index.html")
]

# Image replacement mapping (Raw packshots -> 3D Visualizations)
img_replacements = {
    "/wp-content/uploads/2026/03/akceosria-her-3-1024x744.webp": "/wp-content/uploads/2026/02/black-minimalist-interior-of-modern-living-room-3d-2026-01-05-05-45-04-utc-1536x865.webp",
    "/wp-content/uploads/2026/03/24e003-033-10-w_1424e003-033-10-w-1024x683.webp": "/wp-content/uploads/2026/02/interior-of-empty-modern-living-room-3d-rendering-2024-10-18-01-17-34-utc-1536x865.webp",
    "/wp-content/uploads/2026/03/AdobeStock_1392520552-1024x574.webp": "/wp-content/uploads/2026/02/modern-small-bathroom-interior-design-2026-01-09-07-47-29-utc.webp",
    "/wp-content/uploads/2026/03/profil-zlaczka-zapalona-768x974.webp": "/wp-content/uploads/2026/wizualizacje/onecut/03_onecut_kuchnia_wyspa_4000k_neutralna.webp",
    "/wp-content/uploads/2026/03/led-strip-installation-on-wooden-stairs-2026-01-09-01-02-16-utc.webp": "/wp-content/uploads/2026/02/AdobeStock_1269122204-1536x861.webp",
    "/wp-content/uploads/2026/03/tasma-cri97-biala-zimna_4-2.webp": "/wp-content/uploads/2026/01/schodycri97_optimized-1536x861.webp",
    "/wp-content/uploads/2026/03/s-shape_29s-shape-1024x683.webp": "/wp-content/uploads/2026/02/AdobeStock_894924616-1536x914.webp",
    "/wp-content/uploads/2026/03/rozdzielacz-napiecia-768x900.webp": "/wp-content/uploads/2026/02/3d-interior-of-dark-bedroom-black-walls-luxury-r-2026-01-07-06-02-50-utc-768x512.webp",
    "/wp-content/uploads/2026/03/24e006-033-10-ww_1224e006-033-10-ww-1024x659.webp": "/wp-content/uploads/2026/wizualizacje/onecut/04_onecut_kuchnia_6500k_zimna.webp",
    "/wp-content/uploads/2026/03/maga2-1-1024x1024.webp": "/wp-content/uploads/2026/01/FirmaPRESCOTLED.webp",
    "/wp-content/uploads/2026/03/front-oprawy.webp": "/wp-content/uploads/2026/02/AdobeStock_909243902-1024x574.webp",
    "/wp-content/uploads/2025/12/wiz1-1-1024x585.png": "/wp-content/uploads/2026/wizualizacje/onecut/02_onecut_pergola_schody_3000k.webp",
}

# New 16 Comprehensive FAQ HTML
expanded_faq_html = """      <div class="faq-grid" id="faqAccordion">
        <!-- Q1: COB vs SMD -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Czym różnią się taśmy LED COB od tradycyjnych taśm SMD?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Taśmy <strong>COB (Chip on Board)</strong> posiadają miniaturowe chipy LED gęsto upakowane bezpośrednio na elastycznym laminacie PCB i zalane ciągłą warstwą luminoforu (np. 320–528 chipów/m). Dzięki temu emitują idealnie jednolitą, gładką linię światła bez efektu „kropkowania” (tzw. punktów świetlnych), nawet w bardzo płytkich profilach meblowych z mlecznym kloszem. W klasycznych taśmach SMD odstępy między diodami są widoczne, co przy płytkim profilu daje nieestetyczne cienie.</p>
          </div>
        </div>

        <!-- Q2: Spadki napięcia -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Dlaczego na długich odcinkach taśmy LED występuje spadek jasności?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Zjawisko to wynika z oporu elektrycznego miedzianych ścieżek na laminacie PCB (zgodnie z prawem Ohma). Im dłuższy odcinek taśmy, tym większy opór i spadek napięcia na końcu linii, co objawia się słabszym świeceniem diod i ich przegrzewaniem na początku odcinka. Dla taśm <strong>12V maksymalny bezpieczny odcinek zasilany jednostronnie to 5 metrów</strong>. Dla taśm <strong>24V dystans ten wynosi do 10 metrów</strong>. Powyżej tych długości należy bezwzględnie zastosować zasilanie dwustronne lub poprowadzić magistralę zasilającą (np. przewód 2x1.5mm² równolegle do profilu).</p>
          </div>
        </div>

        <!-- Q3: Zapas mocy zasilacza -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Jaki zapas mocy powinien mieć profesjonalny zasilacz LED?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Złota reguła inżynieryjna Prescot nakazuje dobór zasilacza z minimum <strong>20% (rekomendowane 25%) bezpiecznego zapasu mocy</strong> ponad sumaryczną moc pobieraną przez podłączoną taśmę LED. Przykład: jeśli 8 metrów taśmy o mocy 14.4 W/m pobiera 115.2 W, optymalny zasilacz to model <strong>150W 24V</strong> (115.2 W x 1.20 = 138.24 W). Zapas zapobiega pracy przetwornicy impulsowej na granicy wydajności termicznej, wycisza cewki i wydłuża żywotność kondensatorów elektrolitycznych do ponad 50 000 godzin.</p>
          </div>
        </div>

        <!-- Q4: Profil jako radiator -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Czy taśmę LED można nakleić bezpośrednio na mebel lub ścianę bez profilu aluminiowego?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p><strong>Kategorycznie odradzamy montaż bez profilu!</strong> Profil aluminiowy pełni fundamentalną funkcję radiatora odprowadzającego ciepło ze złącza p-n diod LED. Płyta meblowa, drewno i tynk są doskonałymi izolatorami termicznymi. Taśma LED naklejona bezpośrednio na drewno nagrzewa się do ponad 70°C, co skutkuje szybką degradacją luminoforu (światło żółknie lub szarzeje), spadkiem strumienia świetlnego o 50% w ciągu kilku miesięcy oraz utratą gwarancji producenta.</p>
          </div>
        </div>

        <!-- Q5: CRI Ra > 90 i Ra > 97 -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Co oznacza parametr CRI / Ra &gt; 90 i Ra &gt; 97 w taśmach Prescot?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Wskaźnik oddawania barw <strong>CRI (Colour Rendering Index, Ra)</strong> określa, jak naturalnie i wiernie postrzegamy kolory oświetlanych powierzchni w porównaniu ze światłem słonecznym (Ra = 100). Standardowe taśmy marketowe mają niski wskaźnik Ra 70–80, przez co ludzka skóra wygląda blado, a jedzenie i drewno nienaturalnie. Seria <strong>Prescot TrueColor i COB High CRI (Ra &gt; 90 / Ra &gt; 97, z wysokim indeksem R9 dla nasyconej czerwieni)</strong> zapewnia muzealną czystość spektralną – idealną do salonów, kuchni, garderób oraz ekspozycji handlowych.</p>
          </div>
        </div>

        <!-- Q6: Szybkozłączki bez lutowania -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Jak bezpiecznie łączyć taśmy bez lutownicy za pomocą szybkozłączek Prescot?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Szybkozłączki Prescot z serii <strong>MX2045 (szerokość 8mm)</strong> oraz <strong>MN20 (szerokość 10mm)</strong> wykorzystują technologię nożowych pinów ząbkowanych. Wystarczy uciąć taśmę dokładnie w oznaczonym punkcie cięcia, wsunąć laminat do złączki bez konieczności zdzierania silikonu czy odklejania taśmy klejącej, a następnie zacisnąć przezroczystą pokrywę zwykłymi szczypcami. Ostre piny przebijają izolację i wbijają się bezpośrednio w miedziany pad PCB, gwarantując połączenie odporne na wstrząsy, prąd do 5A i kompaktowe wymiary mieszczące się w standardowym profilu aluminiowym.</p>
          </div>
        </div>

        <!-- Q7: 12V vs 24V vs 48V -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>12V vs 24V vs 48V – jakie napięcie zasilania wybrać do instalacji?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p><strong>Napięcie 24V DC to obecnie bezwzględny standard w profesjonalnym oświetleniu domowym i komercyjnym.</strong> Przy tej samej mocy prąd płynący w obwodzie 24V jest dwukrotnie mniejszy niż w 12V (I = P/U), co oznacza czterokrotnie mniejsze straty ciepła i spadki napięcia. System <strong>12V DC</strong> stosuje się obecnie wyłącznie w bardzo krótkich odcinkach meblowych (poniżej 2m) lub w motoryzacji i camperach. Z kolei <strong>48V DC</strong> dedykowane jest do magnetycznych systemów szynowych i wielkich ciągów liniowych powyżej 20–30 metrów bez dodatkowego doasilania.</p>
          </div>
        </div>

        <!-- Q8: Klasy szczelności IP w łazienkach -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Jakie stopnie szczelności (IP) stosować w łazienkach, pod prysznicem i na elewacjach?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Dobór klasy ochrony zależy od strefy wilgoci według normy PN-EN 60364-7-701:
            <br>• <strong>IP20</strong> – strefy suche (sufity podwieszane, meble pokojowe, wnęki ścienne).
            <br>• <strong>IP65 z nanopowłoką hydrofobową</strong> – strefa 2 w łazience (wokół wanny, nad umywalką, w kuchni nad płytą indukcyjną). Nanopowłoka nie żółknie i nie zatrzymuje ciepła jak stary gruby silikon.
            <br>• <strong>IP68 w ekstrudowanym wężu silikonowym</strong> – strefa 0 i 1 (wnętrze kabiny walk-in, fugi podłogowe, obrzeża wanien, baseny i elewacje zewnętrzne narażone na deszcz i mróz).</p>
          </div>
        </div>

        <!-- Q9: Ściemnianie i sterowanie -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Jakie standardy ściemniania i sterowania obsługują taśmy i zasilacze Prescot?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Oferujemy pełną kompatybilność z każdym wiodącym ekosystemem sterowania:
            <br>• <strong>Radiowe 2.4GHz (MiBoxer / Mi-Light)</strong> – bezprzewodowe piloty, panele naścienne szklane, bramki Wi-Fi Tuya z aplikacją na smartfona i sterowaniem głosowym Google Home / Alexa.
            <br>• <strong>Ściemnianie fazowe Triac / Phase-cut 230V</strong> – bezpośrednie podłączenie zasilacza ściemnianego Prescot pod tradycyjne ściemniacze obrotowe (np. Gira, Berker, Kontakt-Simon).
            <br>• <strong>DALI-2 / PUSH-DIM</strong> – profesjonalna automatyka budynkowa BMS w hotelach, biurowcach i rezydencjach.
            <br>• <strong>0/1-10V oraz PWM</strong> – sterowniki przemysłowe i integracje Smart Home (np. Loxone, KNX, Fibaro).</p>
          </div>
        </div>

        <!-- Q10: Taśmy CCT Multiwhite -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Czym jest taśma LED CCT (Multiwhite / Tunable White) i jak działa?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Taśmy <strong>CCT (Correlated Colour Temperature)</strong> posiadają zintegrowane naprzemiennie dwa rzędy chipów LED: o barwie bardzo ciepłej (2700K) oraz zimnej (6500K). Za pomocą dedykowanego sterownika CCT użytkownik może płynnie regulować temperaturę barwową światła – od przytulnego, ciepłego bursztynu do wieczornego relaksu, przez neutralne 4000K do gotowania i czytania, aż po stymulujące chłodne 6500K sprzyjające koncentracji w ciągu dnia (zgodnie z biologiczną koncepcją <strong>Human Centric Lighting</strong>).</p>
          </div>
        </div>

        <!-- Q11: Przekrój przewodu zasilającego -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Jak prawidłowo dobrać przekrój żyły przewodu zasilającego (mm²)?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Grubość przewodu między zasilaczem a taśmą LED musi uwzględniać pobierany prąd i odległość trasy kablowej, aby spadek napięcia na miedzi nie przekroczył 3% (ok. 0.7V przy 24V). Rekomendacje Prescot:
            <br>• <strong>0.50 mm²</strong> – odcinki kabla do 2 metrów przy mocy do 50W.
            <br>• <strong>0.75 mm²</strong> – standard instalacyjny dla tras 2–5 metrów przy mocy do 100W.
            <br>• <strong>1.00 mm² – 1.50 mm²</strong> – trasy kablowe 5–15 metrów lub instalacje o mocy powyżej 150W.
            <br>Nasz wbudowany powyżej kalkulator automatycznie przelicza spadek napięcia w woltach i procentach dla wprowadzonej konfiguracji.</p>
          </div>
        </div>

        <!-- Q12: Cięcie na wymiar i technologia OneCut -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Czy taśmy LED Prescot można ciąć na dowolny wymiar i w jakich odstępach?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Tak, wszystkie taśmy Prescot posiadają wyraźnie nadrukowane linie cięcia z symbolem nożyczek oraz odsłoniętymi miedzianymi polami lutowniczymi. Standardowe serie COB i SMD 24V tnie się w sekcjach co <strong>2.5 cm, 5 cm lub 10 cm</strong>. Z kolei w innowacyjnej serii <strong>Prescot OneCut</strong> moduł cięcia wynosi zaledwie <strong>1 diodę (co 8–10 mm)</strong>, co pozwala idealnie dopasować długość wstęgi świetlnej do każdego wymiaru mebla, szafki czy wnęki bez nieestetycznych ciemnych przerw na końcach profilu.</p>
          </div>
        </div>

        <!-- Q13: Maksymalna odległość zasilacza od taśmy -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>W jakiej maksymalnej odległości od taśmy LED może znajdować się zasilacz?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Zasilacz można z powodzeniem umieścić w centralnej rozdzielnicy elektrycznej lub szafie teletechnicznej oddalonej nawet o <strong>15–20 metrów od taśmy LED</strong>, pod warunkiem skompensowania rezystancji przewodu odpowiednim przekrojem miedzi (zazwyczaj <strong>2x1.5 mm² lub 2x2.5 mm²</strong> przy instalacji 24V). Zasilacze impulsowe Prescot posiadają precyzyjną stabilizację napięcia wyjściowego, a w wybranych modelach potencjometr regulacyjny (+/- 10%), który pozwala skompensować spadek napięcia na długiej trasie kablowej.</p>
          </div>
        </div>

        <!-- Q14: Zasilacze meblowe Ultra Slim na drewnie -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Czy zasilacze Ultra Slim można montować bezpośrednio na płytach meblowych i w zabudowie G-K?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Tak! Zasilacze meblowe <strong>Prescot Ultra Slim</strong> posiadają europejski <strong>certyfikat MM (Montaż na Meblach)</strong>, co poświadcza, że temperatura ich obudowy przy pełnym obciążeniu nie przekracza dopuszczalnych norm pożarowych dla powierzchni drewnianych i drewnopochodnych. Ich smukła konstrukcja (wysokość zaledwie 15–18 mm) pozwala na bezproblemowe schowanie zasilacza za cokołem kuchennym, we wnęce za lustrem łazienkowym lub wewnątrz płycizny sufitu podwieszanego.</p>
          </div>
        </div>

        <!-- Q15: Konfekcjonowanie B2B i wsparcie fabryczne -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Czy Prescot realizuje konfekcjonowanie taśm i cięcie profili pod wymiar dla firm i stolarzy?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Tak. W ramach programu <strong>Prescot B2B</strong> w naszej centrali produkcyjnej w Giżycku świadczymy kompleksowe usługi warsztatowe:
            <br>• Precyzyjne docinanie profili aluminiowych i kloszy na zadany wymiar (cięcie proste oraz pod kątem 45° i 90° do ramek i opraw).
            <br>• Fabryczne lutowanie przewodów zasilających o dowolnej długości (przewody bezhalogenowe, w oplotach, z wtykami).
            <br>• Wklejanie taśm w profile z testem fotometrycznym i kontrolą jakości przed wysyłką do klienta lub na plac budowy.</p>
          </div>
        </div>

        <!-- Q16: Gwarancja i certyfikacja -->
        <div class="faq-card">
          <button class="faq-btn" type="button">
            <span>Jak wygląda gwarancja, certyfikaty i dostępność produktów Prescot z magazynu?</span>
            <span class="faq-btn-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>
          </button>
          <div class="faq-content">
            <p>Wszystkie komponenty oświetleniowe Prescot spełniają rygorystyczne normy europejskie: <strong>CE, RoHS, LVD, EMC</strong> oraz posiadają pełne karty katalogowe i pliki fotometryczne IES/LDT dla projektantów w programie Dialux. Na serie profesjonalne taśm i zasilaczy udzielamy <strong>od 3 do 5 lat pełnej gwarancji B2B</strong>. Posiadamy centralny magazyn w Giżycku ze stałym stanem ponad 500 000 metrów taśm i profili, dzięki czemu zamówienia inwestycyjne wysyłamy w <strong>24 godziny kurierem na terenie całej Polski i UE</strong>.</p>
          </div>
        </div>
      </div>"""

for target in target_files:
    if not os.path.exists(target):
        print(f"File not found: {target}")
        continue
    
    with open(target, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace blog thumbnails with 3D visualizations
    replaced_imgs_count = 0
    for old_img, new_img in img_replacements.items():
        if old_img in content:
            content = content.replace(old_img, new_img)
            replaced_imgs_count += 1

    # 2. Replace FAQ accordion
    # Find <div class="faq-grid" id="faqAccordion"> ... </div>
    faq_match = re.search(r'<div class=\"faq-grid\" id=\"faqAccordion\">.*?</div>\s*</section>', content, flags=re.DOTALL)
    if faq_match:
        content = content[:faq_match.start()] + expanded_faq_html + "\n    </section>" + content[faq_match.end():]
        faq_status = "Replaced with 16 expanded FAQs"
    else:
        faq_status = "FAQ grid pattern not matched"

    # 3. Clean up FAQ subtitle
    content = content.replace(
        "<!-- 3. FAQ ACCORDION SECTION (6 ZWIĘZŁYCH PYTAŃ) -->",
        "<!-- 3. FAQ ACCORDION SECTION (16 EKSPERCKICH PYTAŃ I ODPOWIEDZI) -->"
    )

    # 4. Clean up blog filter hover (no orange glow)
    content = content.replace(
        ".blog-filter-btn:hover {\n      border-color: var(--p-primary);\n      color: var(--p-primary);\n    }",
        ".blog-filter-btn:hover {\n      border-color: var(--p-dark);\n      color: var(--p-dark);\n    }"
    )

    # 5. Clean up calc-rec-btn hover
    # Remove any local calc-rec-btn glowing styles if present
    content = re.sub(
        r'\.calc-rec-btn:hover\s*\{[^}]+\}',
        '.calc-rec-btn:hover { background: #ffffff !important; color: #212a35 !important; border-color: #212a35 !important; box-shadow: 0 6px 20px rgba(33, 42, 53, 0.15) !important; }',
        content
    )

    with open(target, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Updated {os.path.basename(target)}: {replaced_imgs_count} images replaced, {faq_status}")

print("All knowledge base files updated successfully!")

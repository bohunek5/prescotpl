// V2 uses existing project photography and existing product specifications.
const controllers = ['mono','cct','rgb','rgbw','rgbcct'];
const labels = ['MONO','CCT','RGB','RGBW','RGB+CCT'];
const functions = ['Ściemnianie taśmy jednobarwnej.','Jasność i temperatura bieli.','Kolor, jasność i programy dynamiczne.','Kolor RGB z osobnym kanałem białym.','Kolor RGB i regulowana temperatura bieli.'];
const channels = ['1 kanał · 12 A','2 kanały · 6 A/kanał','3 kanały · 4 A/kanał','4 kanały · 3 A/kanał','5 kanałów · 2,4 A/kanał'];
const media = 'wp-content/uploads/2026/03/';
export const pages = [
 {slug:'sterowniki-led',label:'Sterowniki LED',short:'Sterowniki',original:'sterowniki-led/',number:'01',
  headline:'Światło w Twoim rytmie.',intro:'Od spokojnej bieli po pełen kolor. Wybierz sterownik Prescot PR do swojej taśmy i zmieniaj światło jednym ruchem.',
  hero:'assets/controllers/controller-living-room-hero-v2.webp',heroAlt:'Aranżacja salonu z oświetleniem LED',
  object:'assets/controllers/rgbcct-main.webp',objectAlt:'Sterownik Prescot PR z pilotem',
  tags:['5 wariantów','12 / 24 V DC','Pilot RF 2,4 GHz'],section:'Jaki efekt chcesz uzyskać?',sectionIntro:'Typ taśmy wyznacza sposób sterowania. Zobacz pięć wariantów tej samej rodziny.',
  models:controllers.map((key,i)=>({key,label:labels[i],title:`Prescot PR-${key.toUpperCase()}-12A`,description:functions[i],
    image:`assets/controllers/${key}-main.webp`,detail:`assets/controllers/${key}-detail.webp`,
    facts:[['Sterowanie',labels[i]],['Zasilanie','12 / 24 V DC'],['Kanały',channels[i]],['Komunikacja','RF 2,4 GHz · do 30 m']],
    pdf:`assets/controllers/pr-${key}-12a.pdf`,video:`assets/controllers/${key}-demo.mp4`})),
  storyTitle:'Jeden pilot. Właściwy efekt.',story:'Dobierz wariant do taśmy MONO, CCT, RGB, RGBW albo RGB+CCT. W karcie konkretnego modelu znajdziesz parametry oraz sposób podłączenia.',
  storyImage:'assets/controllers/family-hero.webp',storyAlt:'Rodzina sterowników Prescot PR',storyContain:true,
  guide:[['Rodzaj taśmy','Sprawdź liczbę kanałów i sposób sterowania barwą.'],['Parametry instalacji','Porównaj napięcie i obciążenie kanałów z kartą modelu.'],['Miejsce montażu','Seria PR ma klasę IP20. Zaplanuj montaż wewnątrz.']]},
 {slug:'zasilacze-led',label:'Zasilacze LED',short:'Zasilacze',original:'zasilacze-led/',number:'02',
  headline:'Moc za każdym światłem.',intro:'Sześć modeli Prescot PR-MAD. Dobierz moc do instalacji, zachowując tę samą niską obudowę i autodetekcję 12/24 V.',
  hero:'assets/prmad/pr-mad-kitchen-hero.webp',heroAlt:'Aranżacja kuchni z liniowym oświetleniem blatu',
  object:'assets/prmad/pr-mad-family.webp',objectAlt:'Rodzina zasilaczy Prescot PR-MAD',
  tags:['36–300 W','Autodetekcja 12/24 V','29 mm wysokości'],section:'Wybierz moc. Zobacz model.',sectionIntro:'Od podświetlenia mebla do większej instalacji. Porównaj gabaryty i parametry sześciu zasilaczy.',
  models:[36,60,100,150,200,300].map((w,i)=>({key:`w${w}`,label:`${w} W`,title:`PR-MAD${w}-1224`,
    description:['Kompaktowy model do mebli, gablot i krótkich odcinków LED.','Do podświetlenia szafek, garderób i wnęk.','Do oświetlenia liniowego wnętrz i profili architektonicznych.','Do rozbudowanych stref światła i sufitów podwieszanych.','Do większych instalacji oświetlenia wnętrz.','Największa moc w rodzinie PR-MAD.'][i],
    image:`assets/prmad/pr-mad-${w}w.webp`,detail:'assets/prmad/pr-mad-autodetect-detail.webp',
    facts:[['Moc',`${w} W`],['Napięcie wyjściowe','Autodetekcja 12/24 V DC'],['Wymiary',[110,143,175,199,224,224][i]+' × '+[47,47,47,52,52,62][i]+' × 29 mm'],['Obudowa','IP20']]})),
  storyTitle:'Ukryty w zabudowie. Widoczny w efekcie.',story:'Wysokość 29 mm ułatwia zaplanowanie miejsca na zasilacz. Przed montażem sprawdź warunki chłodzenia, obciążenie i dostęp serwisowy.',
  storyImage:'assets/prmad/pr-mad-kitchen-hero.webp',storyAlt:'Oświetlenie LED w zabudowie kuchennej',
  guide:[['Zapotrzebowanie na moc','Przygotuj długości taśm i moc na metr. Dobór potwierdzimy dla konkretnej instalacji.'],['Napięcie i sterowanie','Uwzględnij taśmy, sterowniki i sposób podłączenia.'],['Warunki montażu','Zaplanuj wentylację oraz dostęp do zasilacza. IP20 jest przeznaczone do wnętrz.']]},
 {slug:'profile-led',label:'Profile LED',short:'Profile',original:'oferta/',number:'03',
  headline:'Nadaj światłu formę.',intro:'Profil porządkuje linię światła. Dobierz system KLUŚ lub TECH Light do miejsca montażu, taśmy i oczekiwanego efektu.',
  hero:'assets/offer/klus-profile.webp',heroAlt:'Profil LED oświetlający półki ekspozycyjne',
  object:null,tags:['KLUŚ','TECH Light','Meble i architektura'],section:'Zacznij od miejsca montażu.',sectionIntro:'To kierunki doboru, nie konkretne modele. Profil, klosz i akcesoria dobierzemy jako jeden system.',
  models:[
   {key:'meble',label:'Meble',title:'Światło blisko codzienności',description:'Pod blatem, półką albo w garderobie. Zaplanuj miejsce na profil, przewody i dostęp do zasilania.',image:'assets/prmad/pr-mad-kitchen-hero.webp',photo:true,facts:[['Zastosowanie','Meble i zabudowy'],['Do ustalenia','Sposób mocowania'],['Do sprawdzenia','Szerokość taśmy i klosz']]},
   {key:'wnetrza',label:'Wnętrza',title:'Linia wpisana w przestrzeń',description:'Zaplanuj przebieg oświetlenia razem z zabudową. Liczą się miejsce montażu, kierunek światła i wykończenie.',image:'assets/controllers/controller-living-room-hero-v2.webp',photo:true,facts:[['Zastosowanie','Oświetlenie wnętrz'],['Do ustalenia','Montaż i przebieg linii'],['Do sprawdzenia','Wymiary zabudowy']]},
   {key:'ekspozycja',label:'Ekspozycja',title:'Pokaż to, co ważne',description:'Światło na półce, w gablocie i przy produkcie. Dobierz profil do przestrzeni, którą chcesz podkreślić.',image:'assets/offer/klus-profile.webp',photo:true,facts:[['Zastosowanie','Półki i ekspozycje'],['Do ustalenia','Kierunek światła'],['Do sprawdzenia','Taśma, klosz i mocowanie']]}
  ],storyTitle:'Profil to część całego systemu.',story:'Przy doborze uwzględniamy profil, klosz, zakończenia i mocowania. Prześlij przekrój zabudowy lub zdjęcie miejsca montażu.',storyImage:'assets/offer/klus-profile.webp',storyAlt:'Światło liniowe pod półką',
  guide:[['Miejsce montażu','Mebel, ściana, sufit czy ekspozycja? Pokaż nam plan lub zdjęcie.'],['Efekt świetlny','Ustal kierunek świecenia i wygląd linii światła.'],['Kompletny zestaw','Dobieramy elementy pasujące do wybranego systemu.']]},
 {slug:'akcesoria-led',label:'Akcesoria LED',short:'Akcesoria',original:'akcesoria/',number:'04',
  headline:'Detale, które łączą.',intro:'Złączki, przewody i rozdzielacze. Uporządkuj połączenia od zasilacza do ostatniego odcinka taśmy.',
  hero:media+'nowe-zlaczki_27.webp',heroAlt:'Połączenia świecących odcinków taśmy LED',
  object:media+'lockbiale.webp',objectAlt:'Złącza DC z blokadą',tags:['Złączki','Przewody','Rozdział zasilania'],section:'Każde połączenie ma znaczenie.',sectionIntro:'Zobacz grupy akcesoriów. Przy doborze potwierdź typ taśmy, wymiary oraz parametry elektryczne.',
  models:[
   {key:'multi',label:'Multi 9-in-1',title:'Złączki Multi 9-in-1',description:'Połączenia taśm i przewodów, także przy zmianie kierunku instalacji. Dobierz złączkę do konkretnej taśmy.',image:'wp-content/uploads/2026/02/321.webp',detail:media+'profil-zlaczka-zapalona.webp'},
   {key:'pcb',label:'PCB',title:'Złączki PCB',description:'Połączenia lutowane do instalacji, w których liczy się miejsce w profilu.',image:media+'PCB.webp'},
   {key:'hermetyczne',label:'Hermetyczne',title:'Złączki hermetyczne',description:'Dobierz komplet połączeniowy do warunków instalacji. Szczelność potwierdź dla wybranego modelu i sposobu montażu.',image:media+'akceosria-her.webp',detail:media+'akceosria-her-3.webp'},
   {key:'dc',label:'Złącza DC',title:'Gniazda, wtyki i rozgałęziacze',description:'Uporządkuj połączenia między zasilaczem a poszczególnymi sekcjami instalacji.',image:media+'rozg.webp',detail:media+'rozg2.webp'},
   {key:'blokada',label:'Z blokadą',title:'Gniazda i wtyki z blokadą',description:'Mechaniczna blokada połączenia pomaga ograniczyć przypadkowe wypięcie przewodu.',image:media+'lockbiale.webp',detail:media+'lockczarne.webp'},
   {key:'dcbox',label:'DC BOX',title:'Magistrale zasilające DC',description:'Jeden punkt rozdziału zasilania na kilka sekcji. Dobierz wariant i obciążenie do instalacji.',image:media+'rozdzielacz-napiecia.webp'},
   {key:'przewody',label:'Przewody',title:'Przewody TLWY i TLYp',description:'Dobierz przekrój i liczbę żył do długości trasy, obciążenia oraz sposobu sterowania.',image:media+'przewody.webp'}
  ],storyTitle:'Mniej przypadkowych połączeń.',story:'Zaplanuj przewody i punkty rozdziału razem z taśmami, sterownikiem i zasilaczem. Pomożemy skompletować elementy do Twojej instalacji.',storyImage:media+'nowe-zlaczki_27.webp',storyAlt:'Połączone odcinki taśm LED',
  guide:[['Zgodność mechaniczna','Sprawdź szerokość taśmy, liczbę pól i miejsce w profilu.'],['Parametry elektryczne','Dobierz złącza i przewody do prądu, napięcia oraz długości trasy.'],['Warunki instalacji','Potwierdź klasę ochrony i sposób zabezpieczenia połączeń.']]}
];

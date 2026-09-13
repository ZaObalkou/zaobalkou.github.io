# Za obálkou

Čtenářský web na **https://zaobalkou.github.io/**. Statické HTML/CSS/JavaScript; GitHub Pages, větev `main`, kořen repozitáře. Bez sestavení a bez přihlášení čtenářů.

## Aktuální změny

- **Dílo a vydání jsou oddělené.** Ve výsledcích je jedna karta příběhu. V detailu lze vybrat konkrétní jazyk, rok a ISBN; česká a anglická kniha mohou být samostatně v knihovně. Překlady se spojují podle identifikátorů a doložených aliasů, nikoli automatickým překladem názvu.
- **Jazyk knížky a Rok vydání.** Rok je konkrétní ročník v sestupném seznamu. Filtry se posílají i do katalogu a následně ověřují na metadatech vydání. Neověřený jazyk neprojde jazykovým filtrem. Rok původního díla slouží pouze k řazení současných doporučení.
- **Počty stran** se doplňují přes ISBN / identifikátor vydání z Open Library, případně Google Books, a z ověřených nakladatelských metadat. Medián napříč vydáními se nevydává za počet stran konkrétní knihy. Neznámý počet lze doplnit ručně; pokrok funguje i bez něj. Ruční údaje mají přednost.
- **Štítky pro brouzdání** používají společný český slovník: romantika, hokej, království, magie, drak a další. Vznikají z předmětových hesel, výslovných témat anotace a doložených redakčních údajů. Dlouhé variace taxonomie YA nezaplňují tlačítka. Kombinace vyžaduje všechna zvolená témata. Procházení nemá skrytý limit stáří knih; kombinuje relevantní a novější výsledky katalogu a jejich další stránku. České sci-fi podporuje i česká předmětová hesla a šest doložených vydání od nakladatelů.
- **Výpadky katalogů** jsou oddělené od prázdných výsledků. Volitelný Google Books se bez klíče vůbec nevolá. Dostupnost zdrojů je v rozbalovacím detailu; úplný výpadek je zřetelně oznámen. Limity, cache, sdílení souběžných požadavků a časové limity tlumí opakované chyby. Uložené a redakční knihy se zobrazí hned.
- **Knihovna s tebou:** lokálně vytvořený komprimovaný odkaz a QR kód přenesou současný snímek knihovny včetně pokroku a jazykových verzí. Otevření odkazu samo knihovnu nepřepíše; uživatel potvrdí přidání a zvolí, který pokrok zachovat. Není to průběžná synchronizace. Pro velkou knihovnu se nabídne odkaz bez QR, překročení limitu odkazu se oznámí bez ztráty knihovny. QR se generuje místně bez služby třetí strany.
- **Excel:** skutečný `.xlsx` se čtyřmi sloupci Název knihy, Autor, Rok vydání, Série a díl. Názvy mají nativní hypertextový odkaz na detail knihy na webu. První řádek je ukotvený a tabulku lze filtrovat. Prázdná série znamená chybějící údaj, nikoli hádané pořadí.
- **Pět pastelových motivů:** broskev, levandule, šalvěj, růže a modrá. Ukládají se do prohlížeče a fungují se světlým i tmavým režimem. Promění ikony, odznaky, odkazy, pozadí i náhradní obálky.

## Datové zdroje a jejich hranice

Open Library a Apple Books běží bez nastavení klíče. `catalogue-cs.js` přidává 60 českých sci-fi vydání z uloženého snímku veřejného Open Library API (13. 9. 2026), aby hledání fungovalo okamžitě i při jeho výpadku. Jde o částečný katalog s metadaty komunitního zdroje, nikoli o úplný ani živý seznam; přesné zdrojové dotazy jsou v souboru. Živé dotazy jej nadále doplňují. Open Library má časový limit 25 sekund, protože naměřené odpovědi trvaly i 16 sekund; ostatní zdroje 8,5 sekundy. Google Books vyžaduje identifikaci aplikace; v `config.js` lze nastavit vlastní klíč omezený na Books API a tento web. Do veřejného repozitáře nikdy nepatří soukromý serverový klíč nebo servisní účet.

Goodreads se průběžně načítá přes jeho veřejný widget `book/avg_rating_widget/{id}`, který poskytuje skutečný komunitní průměr a počet hlasů. `goodreads-client.js` ho spouští pouze v izolovaném `goodreads-bridge.html` s `sandbox="allow-scripts"`; skript Goodreads nemá přístup ke knihovně ani úložišti hlavní stránky. Zpráva musí odpovídat konkrétnímu oknu, jednorázovému identifikátoru, ID knihy a platnému souhrnu. Nejde o průměrování několika recenzí ani o použití starého vývojářského API.

Párování používá ověřené ISBN v `goodreads-catalogue.js`, identifikátory konkrétních vydání Open Library a kandidáty Goodreads spojené s konkrétním dílem Open Library. U kandidátů díla musí odpovídat název nebo doložený alias; chybné ID se nepřiřadí pouze podle podobného názvu. Přednost dostane platné Goodreads hodnocení s počtem hlasů, URL knihy a časem načtení. Souhrn `scope: "work"` platí pro příběh napříč vydáními; stránky, jazyk a ISBN zůstávají údaji vybraného vydání.

Detail má přednost před obnovou viditelných karet. Maximálně dva widgety běží souběžně, požadavky se sdílejí a nové začínají s odstupem. Úspěšné hodnoty se uchovávají šest hodin; při obnově nebo výpadku zůstává poslední hodnota označená jako uložená. `goodreads-ratings.json` a registr poskytují doložený výchozí snímek pro rychlé první zobrazení. Obnova souhrnu nepřekresluje rozepsané ovládání pokroku ani výběr vydání. Pokud nelze Goodreads knihu jednoznačně spárovat, nemá hodnocení nebo widget selže, zůstává dostupné Apple Books / Open Library / Google Books hodnocení. Pokrytí Goodreads proto není zaručeno pro každý záznam veřejných katalogů.

Výchozí registr lze obnovit příkazem `node scripts/update-goodreads-catalogue.cjs`. Skript ověřuje identitu a čte veřejný widget bez vyhodnocování cizího JavaScriptu; nevymýšlí chybějící hodnocení. Souborový snímek není živý prodejní žebříček.

Veřejné katalogy nemají všechny české překlady, vydání ani počty stran. Crosswalk v `catalogue-data.js` doplňuje doložené ISBN a témata vybraných současných knih; u každé má odkaz na nakladatele. Nejde o kompletní katalog ani živý žebříček prodejnosti. Neznámé údaje se zobrazují jako neuvedené. Knižní balíčky se vynechávají z doporučení, ale zůstávají dohledatelné přímým názvem.

- [Open Library Search API a vydání](https://openlibrary.org/dev/docs/api/search)
- [Open Library Books API](https://openlibrary.org/dev/docs/api/books)
- [Google Books API](https://developers.google.com/books/docs/v1/using)
- [Goodreads – widget souhrnného hodnocení](https://help.goodreads.com/s/question/0D51H00005lBLlHSAW/average-rating-widget)
- [Goodreads – konfigurace veřejného widgetu recenzí](https://www.goodreads.com/api/reviews_demo_widget_iframe)

## Soubory a nasazení

Nahraj všechny kořenové HTML, JS, CSS a `goodreads-ratings.json` soubory do kořene `main`, testy do `tests/`. `index.html` potřebuje `book-core.js`, `catalogue-client.js`, `catalogue-data.js`, `catalogue-cs.js`, `config.js`, `library-tools.js`, `qrcodegen.js`, `theme-palette.js`, `theme-palette.css` `reader-tools.css`, `bookshelf.js`, `bookshelf.css`, `polish.css`, `goodreads-catalogue.js`, `goodreads-client.js` a `goodreads-bridge.html`. `qrcodegen.js` pochází z projektu Nayuki, licence MIT je zachovaná v souboru. Staré HTML vstupy přesměrovávají na index.

Lokální spuštění: `python3 -m http.server 8765`. Testy: `node --test tests/*.test.cjs` (Node20+; test čtení XLSX používá také Python/openpyxl). Testy zahrnují skutečné OOXML odkazy, kompresi a validaci přenosu, edice/jazyky/roky, výpadky, štítky, souběh a ukládání pokroku. Regresní testy používají odpovědi katalogů a malý DOM adaptér, proto je doplňuje kontrola živého webu v prohlížeči.


## Poličky a hledání podle štítků

Knihovna má výchozí pohled s hřbety. Přebal se zobrazí při najetí nebo zaostření klávesnicí. Kliknutí, klepnutí nebo Enter na hřbetu otevře rovnou detail knihy. Náhled neodchytává myš nad sousedními hřbety. Pokud záznam obsahuje ověřený obrázek hřbetu `spineUrl`, dostane přednost a zachová vlastní potisk. Jinak hřbet používá roztažený levý okraj přebalu stejného vydání; jde o vizuální přiblížení, ne fotografii skutečného hřbetu. Stávající katalogy samostatná data hřbetů neposkytují, proto je dosud vyplňuje pouze případný doložený záznam vydání. Šířka roste odmocninově s počtem stran (100 stran ≈ 46 px, 800 stran ≈ 79 px); knihy pod 200 stran jsou i nižší. Při chybějícím počtu stran se používá střední šířka. Chybějící obrázek nahradí barva tématu. Přepínač „Přehled a pokrok“ zachovává přímé ovládání rozečtených knih. Běžný import/export JSON byl odstraněn; přenos odkazem/QR a Excel zůstávají. Nouzový export původních dat se nabídne jen při chybě úložiště.

V horním vyhledávání funguje `#young adult` i `#youngadult`. Každé další `#` zahajuje další štítek a všechny se kombinují podmínkou zároveň: `#young adult #fantasy`. `#young #adult` jsou dva neznámé štítky; stránka na ně upozorní. Text před prvním štítkem zúží autora nebo název, např. `Sarah J. Maas #romantasy`.

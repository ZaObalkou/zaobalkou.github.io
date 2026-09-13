# Za obálkou

Čtenářský web na **https://zaobalkou.github.io/**. Statické HTML/CSS/JavaScript; GitHub Pages, větev `main`, kořen repozitáře. Bez sestavení a bez přihlášení čtenářů.

## Aktuální změny

- **Dílo a vydání jsou oddělené.** Ve výsledcích je jedna karta příběhu. V detailu lze vybrat konkrétní jazyk, rok a ISBN; česká a anglická kniha mohou být samostatně v knihovně. Překlady se spojují podle identifikátorů a doložených aliasů, nikoli automatickým překladem názvu.
- **Jazyk knížky a Rok vydání.** Rok je konkrétní ročník v sestupném seznamu. Filtry se posílají i do katalogu a následně ověřují na metadatech vydání. Neověřený jazyk neprojde jazykovým filtrem. Rok původního díla slouží pouze k řazení současných doporučení.
- **Počty stran** se doplňují přes ISBN / identifikátor vydání z Open Library, případně Google Books, a z ověřených nakladatelských metadat. Medián napříč vydáními se nevydává za počet stran konkrétní knihy. Neznámý počet lze doplnit ručně; pokrok funguje i bez něj. Ruční údaje mají přednost.
- **Štítky pro brouzdání** používají společný český slovník: romantika, hokej, království, magie, drak a další. Vznikají z předmětových hesel, výslovných témat anotace a doložených redakčních údajů. Dlouhé variace taxonomie YA nezaplňují tlačítka. Kombinace vyžaduje všechna zvolená témata.
- **Výpadky katalogů** jsou oddělené od prázdných výsledků. Volitelný Google Books se bez klíče vůbec nevolá. Dostupnost zdrojů je v rozbalovacím detailu; úplný výpadek je zřetelně oznámen. Limity, cache, sdílení souběžných požadavků a časové limity tlumí opakované chyby. Uložené a redakční knihy se zobrazí hned.
- **Knihovna s tebou:** lokálně vytvořený komprimovaný odkaz a QR kód přenesou současný snímek knihovny včetně pokroku a jazykových verzí. Otevření odkazu samo knihovnu nepřepíše; uživatel potvrdí přidání a zvolí, který pokrok zachovat. Není to průběžná synchronizace. Pro velkou knihovnu se nabídne odkaz bez QR, při překročení limitu odkazu je třeba přenést menší výběr. QR se generuje místně bez služby třetí strany.
- **Excel:** skutečný `.xlsx` se čtyřmi sloupci Název knihy, Autor, Rok vydání, Série a díl. Názvy mají nativní hypertextový odkaz na detail knihy na webu. První řádek je ukotvený a tabulku lze filtrovat. Prázdná série znamená chybějící údaj, nikoli hádané pořadí.
- **Pět pastelových motivů:** broskev, levandule, šalvěj, růže a modrá. Ukládají se do prohlížeče a fungují se světlým i tmavým režimem. Promění ikony, odznaky, odkazy, pozadí i náhradní obálky.

## Datové zdroje a jejich hranice

Open Library a Apple Books běží bez nastavení klíče. Google Books vyžaduje identifikaci aplikace; v `config.js` lze nastavit vlastní klíč omezený na Books API a tento web. Do veřejného repozitáře nikdy nepatří soukromý serverový klíč nebo servisní účet.

Goodreads od prosince 2020 nevydává nové API klíče. Tato verze neobchází ochrany Goodreads a neslibuje živé hodnocení všech knih. Přednost dostane pouze platné Goodreads hodnocení s počtem hlasů, URL knihy a datem ověření z dostupného oprávněného zdroje. Volitelná konfigurace `goodreadsRatingsUrl` může ukazovat na spravovaný JSON na stejné doméně; bez ní je vidět skutečný náhradní zdroj (Apple Books / Open Library / Google Books) a odkaz na vyhledání na Goodreads. Žádná Goodreads čísla nejsou v redakčním katalogu vymyšlená.

Příklad struktury volitelného feedu: `{ "ratings": [{ "isbn": "9780525648154", "rating": 4.2, "count": 1234, "url": "https://www.goodreads.com/book/show/ID", "checkedAt": "2026-09-12" }] }`. Čísla jsou pouze příklad formátu, ne skutečné hodnocení; před použitím je nutný doložený oprávněný zdroj a platné číselné ID Goodreads knihy.

Veřejné katalogy nemají všechny české překlady, vydání ani počty stran. Crosswalk v `catalogue-data.js` doplňuje doložené ISBN a témata vybraných současných knih; u každé má odkaz na nakladatele. Nejde o kompletní katalog ani živý žebříček prodejnosti. Neznámé údaje se zobrazují jako neuvedené. Knižní balíčky se vynechávají z doporučení, ale zůstávají dohledatelné přímým názvem.

- [Open Library Search API a vydání](https://openlibrary.org/dev/docs/api/search)
- [Open Library Books API](https://openlibrary.org/dev/docs/api/books)
- [Google Books API](https://developers.google.com/books/docs/v1/using)
- [Goodreads API – ukončení nových klíčů](https://help.goodreads.com/s/article/Why-did-my-API-key-stop-working)

## Soubory a nasazení

Nahraj všechny kořenové HTML, JS a CSS soubory do kořene `main`, testy do `tests/`. `index.html` potřebuje `book-core.js`, `catalogue-client.js`, `catalogue-data.js`, `config.js`, `library-tools.js`, `qrcodegen.js`, `theme-palette.js`, `theme-palette.css` `reader-tools.css`, `bookshelf.js` a `bookshelf.css`. `qrcodegen.js` pochází z projektu Nayuki, licence MIT je zachovaná v souboru. Staré HTML vstupy přesměrovávají na index.

Lokální spuštění: `python3 -m http.server 8765`. Testy: `node --test tests/*.test.cjs` (Node20+; test čtení XLSX používá také Python/openpyxl). Testy zahrnují skutečné OOXML odkazy, kompresi a validaci přenosu, edice/jazyky/roky, výpadky, štítky, souběh a ukládání pokroku. Regresní testy používají odpovědi katalogů a malý DOM adaptér, proto je doplňuje kontrola živého webu v prohlížeči.


## Poličky a hledání podle štítků

Knihovna má výchozí pohled s hřbety. Přebal se zobrazí při najetí nebo zaostření klávesnicí. Kliknutí, klepnutí nebo Enter na hřbetu otevře rovnou detail knihy. Náhled neodchytává myš nad sousedními hřbety. Pokud záznam obsahuje ověřený obrázek hřbetu `spineUrl`, dostane přednost a zachová vlastní potisk. Jinak hřbet používá roztažený levý okraj přebalu stejného vydání; jde o vizuální přiblížení, ne fotografii skutečného hřbetu. Stávající katalogy samostatná data hřbetů neposkytují, proto je dosud vyplňuje pouze případný doložený záznam vydání. Šířka roste odmocninově s počtem stran (100 stran ≈ 46 px, 800 stran ≈ 79 px); knihy pod 200 stran jsou i nižší. Při chybějícím počtu stran se používá střední šířka. Chybějící obrázek nahradí barva tématu. Přepínač „Přehled a pokrok“ zachovává přímé ovládání rozečtených knih. Běžný import/export JSON byl odstraněn; přenos odkazem/QR a Excel zůstávají. Nouzový export původních dat se nabídne jen při chybě úložiště.

V horním vyhledávání funguje `#young adult` i `#youngadult`. Každé další `#` zahajuje další štítek a všechny se kombinují podmínkou zároveň: `#young adult #fantasy`. `#young #adult` jsou dva neznámé štítky; stránka na ně upozorní. Text před prvním štítkem zúží autora nebo název, např. `Sarah J. Maas #romantasy`.

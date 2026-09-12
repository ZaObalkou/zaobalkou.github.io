# Za obálkou

Čtenářský web na **https://zaobalkou.github.io/**. Statické HTML/CSS/JavaScript; GitHub Pages, větev `main`, kořen repozitáře. Bez sestavení a bez přihlášení čtenářů.

## Aktuální změny

- **Dílo a vydání jsou oddělené.** Ve výsledcích je jedna karta příběhu. V detailu lze vybrat konkrétní jazyk, rok a ISBN; česká a anglická kniha mohou být samostatně v knihovně. Překlady se spojují podle identifikátorů a doložených aliasů, nikoli automatickým překladem názvu.
- **Jazyk knížky a Rok vydání.** Rok je konkrétní ročník v sestupném seznamu. Filtry se posílají i do katalogu a následně ověřují na metadatech vydání. Neověřený jazyk neprojde jazykovým filtrem. Rok původního díla slouží pouze k řazení současných doporučení.
- **Počty stran** se doplňují přes ISBN / identifikátor vydání z Open Library, případně Google Books, a z ověřených nakladatelských metadat. Medián napříč vydáními se nevydává za počet stran konkrétní knihy. Neznámý počet lze doplnit ručně; pokrok funguje i bez něj. Ruční údaje mají přednost.
- **Štítky pro brouzdání** používají společný český slovník: romantika, hokej, království, magie, drak a další. Vznikají z předmětových hesel, výslovných témat anotace a doložených redakčních údajů. Dlouhé variace taxonomie YA nezaplňují tlačítka. Kombinace vyžaduje všechna zvolená témata.
- **Výpadky katalogů** jsou oddělené od prázdných výsledků. Volitelný Google Books se bez klíče vůbec nevolá. Dostupnost zdrojů je v rozbalovacím detailu; úplný výpadek je zřetelně oznámen. Limity, cache, sdílení souběžných požadavků a časové limity tlumí opakované chyby. Uložené a redakční knihy se zobrazí hned.
- **Knihovna s tebou:** lokálně vytvořený komprimovaný odkaz a QR kód přenesou současný snímek knihovny včetně pokroku a jazykových verzí. Otevření odkazu samo knihovnu nepřepíše; uživatel potvrdí přidání a zvolí, který pokrok zachovat. Není to průběžná synchronizace. Pro velkou knihovnu se nabídne odkaz bez QR, případně soubor. QR se generuje místně bez služby třetí strany.
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

Nahraj všechny kořenové HTML, JS a CSS soubory do kořene `main`, testy do `tests/`. `index.html` potřebuje `book-core.js`, `catalogue-client.js`, `catalogue-data.js`, `config.js`, `library-tools.js`, `qrcodegen.js`, `theme-palette.js`, `theme-palette.css` a `reader-tools.css`. `qrcodegen.js` pochází z projektu Nayuki, licence MIT je zachovaná v souboru. Staré HTML vstupy přesměrovávají na index.

Lokální spuštění: `python3 -m http.server 8765`. Testy: `node --test tests/*.test.cjs` (Node20+; test čtení XLSX používá také Python/openpyxl). Testy zahrnují skutečné OOXML odkazy, kompresi a validaci přenosu, edice/jazyky/roky, výpadky, štítky, souběh a ukládání pokroku. Regresní testy používají odpovědi katalogů a malý DOM adaptér, proto je doplňuje kontrola živého webu v prohlížeči.

## Přenos knihovny z MeziŘádky

**Nová doména nesdílí localStorage s původní.** Knihovna z `https://meziradky.github.io/` se na `https://zaobalkou.github.io/` sama neobjeví. Přenos nevyžaduje přihlášení k původnímu GitHub účtu; potřebuje pouze původní prohlížeč a jeho dosud uložená data.

1. Otevři **https://meziradky.github.io/** v tom zařízení, prohlížeči a profilu, kde máš knihy. Pokud má původní verze v Knihovně tlačítko **Stáhnout zálohu**, stáhni zálohu jím.
2. Původní nasazená verze z června 2026 tlačítko export nemá. Na počítači otevři vývojářskou konzoli původní stránky a spusť následující kód. Jen přečte knihovnu a stáhne JSON; nic nemaže, nepřepisuje ani nikam neposílá:

```js
(() => {
  const raw = localStorage.getItem('mzr_lib_v2');
  if (!raw) throw new Error('V tomto prohlížeči není uložená knihovna MeziŘádky.');
  JSON.parse(raw);
  const url = URL.createObjectURL(new Blob([raw], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'meziradky-knihovna.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
```

3. Na **https://zaobalkou.github.io/** otevři **Knihovna → Další možnosti uložení → Načíst soubor** a vyber stažený JSON. Zkontroluj počet knih, jejich stav a čtenářský pokrok. Import přidává chybějící knihy a zachovává pokrok již uložených knih.
4. Než bude přenos ověřený, nemaž data původní stránky. Pokud je knihovna uložená jen v Safari na iPhonu, je třeba export provést v tomto Safari (např. přes vzdálený Web Inspector z připojeného Macu); otevření webu v Safari na Macu samo data z iPhonu nepřenese.
5. Z nové stránky lze zálohu stáhnout přes **Stáhnout zálohu** jako `zaobalkou-knihovna.json` a přenášet ji na další zařízení.

Úložiště nadále používá `mzr_lib_v2`, struktura knih zůstala zachovaná a zálohy mají původní identifikátor `format: "meziradky"`, `version: 1`. Nový název souboru nemění kompatibilitu; import přijímá i původní neobalený objekt knihovny. Také ostatní interní názvy `mzr_*` a `MZR_CONFIG` zůstávají pro kompatibilitu.


# Za Obálkou — úpravy září 2026

Statická čtenářská aplikace pro GitHub Pages na **https://zaobalkou.github.io/**, navazující na MeziŘádky. Zachovává původní barevnost, typografii a datový formát knihovny. Nevyžaduje sestavení ani backend.

## Nasazení

1. Pod GitHub účtem **ZaObalkou** vytvoř veřejný repozitář **zaobalkou.github.io**.
2. Nahraj obsah této složky přímo do kořene větve `main`, nikoli do další podsložky. Důležité jsou **index.html, book-core.js a config.js**; musí být na stejné úrovni. Staré vstupní HTML soubory přesměrovávají na index.
3. V repozitáři otevři **Settings → Pages → Build and deployment**. Vyber **Deploy from a branch**, větev **main** a složku **/ (root)**, potom ulož.
4. Po úspěšném nasazení otevři **https://zaobalkou.github.io/**. Vlastní doména ani `CNAME` nejsou potřeba. Přidělení jména účtu a nasazení se musí potvrdit na GitHubu; přítomnost těchto souborů sama neznamená, že web už běží.
5. Na mobilu i počítači ověř postup: vyhledat knihu → detail → Rozečteno → zadat stranu → Knihovna → obnovit stránku. Vizuální kontrolu nasazené verze zatím nemáme potvrzenou.

Pro místní spuštění v této složce: `python3 -m http.server 8765`, potom `http://localhost:8765`.

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

3. Na **https://zaobalkou.github.io/** otevři **Knihovna → Obnovit ze zálohy** a vyber stažený JSON. Zkontroluj počet knih, jejich stav a čtenářský pokrok. Import přidává chybějící knihy a zachovává pokrok již uložených knih.
4. Než bude přenos ověřený, nemaž data původní stránky. Pokud je knihovna uložená jen v Safari na iPhonu, je třeba export provést v tomto Safari (např. přes vzdálený Web Inspector z připojeného Macu); otevření webu v Safari na Macu samo data z iPhonu nepřenese.
5. Z nové stránky lze zálohu stáhnout přes **Stáhnout zálohu** jako `zaobalkou-knihovna.json` a přenášet ji na další zařízení.

Úložiště nadále používá `mzr_lib_v2`, struktura knih zůstala zachovaná a zálohy mají původní identifikátor `format: "meziradky"`, `version: 1`. Nový název souboru nemění kompatibilitu; import přijímá i původní neobalený objekt knihovny. Také ostatní interní názvy `mzr_*` a `MZR_CONFIG` zůstávají pro kompatibilitu.

## Co se změnilo

- **Nový název:** Za Obálkou v hlavičce, monogramu, titulku stránky, metadatech, citaci a názvech exportů; sdílená a kanonická URL je `https://zaobalkou.github.io/`.
- **Doporučení současných knih:** Open Library dostává explicitní rozmezí prvního vydání v posledních 10 letech. Doplňují ji Google Books s českými novějšími vydáními a Apple Books. Chybějící hodnocení knihu nevyřazuje. Žádný náhodný výběr klasiky.
- **Zaměření doporučení:** Současné příběhy, Young adult a Romantasy. Dospělá romantasy není automaticky označena jako YA. Ve výběru jsou nejvýše dvě knihy od jednoho autora; knihy už uložené v knihovně se vynechávají.
- **Řazení hledání:** ISBN / přesný název → přesný autor → začátek a část názvu → shoda slov. Až mezi podobně relevantními výsledky rozhoduje současnost, žánr, potvrzená čeština a omezený příspěvek počtu hodnocení. Přesný dotaz „Hobit“ proto stále vrátí Hobita před novějšími průvodci.
- **Více kandidátů:** odstraněno původní oříznutí na prvních 80 výsledků před řazením. Sloučení podle ISBN nebo normalizovaného názvu a autora zachovává diakritiku i ne-latinská písma; nepřidává znovu stejnou knihu z jiného zdroje do knihovny.
- **Nálady:** explicitní průnik předmětových hesel. Open Library hledá nejprve současná díla, Google novější vydání. U Google se navíc ověřuje přítomnost všech témat v kategoriích. Obecná hesla nepředstírají přesnou znalost děje.
- **Filtry:** období, potvrzený jazyk vydání a řazení podle nejlepší shody / novosti / hodnocení s ohledem na počet hlasů. Jde o filtrování načtených kandidátů, nikoli celého katalogu.
- **Záloha:** export JSON a validovaný import. Import přidá chybějící knihy, zachová stávající čtenářský pokrok a odmítne neplatná data. Poškozená původní knihovna se automaticky nepřepisuje.
- **Robustnost:** časové limity pokrývají i čtení JSON; souběžný totožný dotaz sdílí požadavek. Selhání jednoho zdroje nezruší úspěšné výsledky ostatních. Úplný výpadek používá uložené knihy a redakční výběr. Prázdný úspěšný výsledek se nehlásí jako výpadek.
- **Rychlé psaní a navigace:** novější dotaz zneplatní starší už během prodlevy před hledáním. Odchod na domovskou stránku nebo do knihovny zruší čekající spuštění hledání. Dokončení starého detailu nepřekreslí jinou obrazovku.
- **Pokrok:** kontrola čísel a mezí, zachování nulového vlastního počtu stran, zachování ISBN při uložení, správný návrat z detailu do knihovny. Odebranou knihu lze vrátit.
- **Přístupnost a mobilní CSS:** viditelné zaměření klávesnice, popisky polí, oznámení stavu, odkaz na přeskočení hlavičky, omezení animací a oprava minimálních šířek detailu. Hledání na úzké obrazovce dostává samostatný řádek.
- **Staré verze:** app_v2.html, app_v3.html, test_app.html a knihovna_final.html již nespouštějí rozdílné aplikace se starými chybami.

## Opravená integrita hodnocení

Původní aplikace měla v záložním katalogu napevno zadané hodnoty Goodreads, Databáze knih, Amazon a Google bez doloženého zdroje. Také zobrazovala Google Books jako „BookMoth“ a opakovaně započítávala stejné platformy pod dalšími názvy.

Nyní jsou nejvýše tři skutečné zdroje: Apple Books, Open Library a Google Books. Bez dostupného číselného údaje se skóre nevymýšlí. Vyhledání prvního přibližného titulu už nepřipojí hodnocení jiné knihy. Doplnění detailu používá identifikátor díla nebo ověřenou shodu názvu a autora. Údaje různých platforem mohou stále pocházet z různých vydání téhož titulu.

## Google Books a dostupnost dat

Do `config.js` lze doplnit vlastní klíč Google Books omezený na Books API a doménu webu. Soukromé klíče serverů ani servisní účty sem nepatří. Oficiální dokumentace vyžaduje identifikaci požadavků API klíčem nebo OAuth; původní volání bez klíče proto nelze považovat za garantované. Aplikace ho při prázdné konfiguraci zkusí a případnou chybu zvládne pomocí ostatních zdrojů.

- [Google Books — autentizace a vyhledávání](https://developers.google.com/books/docs/v1/using)
- [Google Books — parametry vyhledávání](https://developers.google.com/books/docs/v1/reference/volumes/list)
- [Open Library — Search API](https://openlibrary.org/dev/docs/api/search)

Apple katalog pro ČR neznamená, že každá kniha je česky. Takové záznamy se bez potvrzeného jazyka nezahrnují do přísného filtru Čeština. Open Library obvykle vrací díla s více jazykovými verzemi; ani ta se automaticky neoznačují jako české vydání. U známého díla se pro stáří používá první vydání, jinak jen datum konkrétního vydání — dotisk neznámého díla tak může působit nověji. To vyžaduje kvalitnější propojení vydání.

Výběr není živým žebříčkem prodejnosti. Je založený na současnosti, metadatech a redakčních tipech. Záložní katalog obsahuje šest novějších tipů i původní klasiku pro přímé hledání. Rok u těchto tipů znamená původní vydání. Neznámé počty stran se nevymýšlejí.

Podklady k českým titulům:

- [Onyxová bouře](https://www.albatrosmedia.cz/tituly/91888547/onyxova-boure/)
- [Úsvit sklizně](https://www.albatrosmedia.cz/tituly/95061816/usvit-sklizne/)
- [Božští rivalové](https://www.albatrosmedia.cz/tituly/91496657/bozsti-rivalove/)
- [Železný plamen a série Empyreum](https://www.albatrosmedia.cz/tituly/89562707/zelezny-plamen/)
- [Bylo nebylo jedno zlomené srdce](https://www.palmknihy.cz/ekniha/bylo-nebylo-jedno-zlomene-srdce--414884)

## Ověření

Spusť `node --test tests/regression.test.cjs` (Node 20+; bez instalace balíčků).

26 regresních testů ověřuje řazení a diakritiku, stáří původního díla, slučování, integritu hodnocení, bezpečné URL a HTML, úplný i částečný výpadek, prázdná a poškozená API data, souběh dotazů, zrušení prodlevy, ukládání a načtení pokroku, duplicity, vrácení odebrání, poškozené úložiště, nedostatek místa, import, navigaci, filtry a stránkování.

Testy používají simulované odpovědi poskytovatelů a minimální DOM adaptér. Není to vizuální ani koncový browser test. Připojený prohlížeč zablokoval místní náhled `http://127.0.0.1:8765` chybou `net::ERR_BLOCKED_BY_CLIENT`. Vizuální vzhled, skutečný síťový přístup z nasazené domény, dostupnost obálek a CORS jednotlivých API proto zůstávají k ověření. Automatizované kontroly úspěšně prošly; produkční dostupnost všech katalogů není tímto potvrzena.

## Další smysluplné kroky

1. **Opravdové „právě frčí“:** připojit dovolený feed vydavatele/knihkupce nebo pravidelně aktualizovaný redakční seznam s datem a zdrojem. Nenahrazovat žebříček náhodným pořadím ani vymyšleným „trending“ skóre.
2. **Český katalog a vydání:** doplnit ISBN a původní názvy populárních překladů. Přesnější propojení vyřeší více duplicit a správné počty stran. Stávající deduplikace se úmyslně nesnaží hádat všechny překlady.
3. **Malá serverová mezivrstva:** pokud veřejná API zlobí na CORS nebo kvótách, centralizovat cache, limity a monitoring dostupnosti. Pro samotný GitHub Pages web tuto garanci zajistit nelze.
4. **Volitelná synchronizace:** knihovna mezi telefonem a počítačem po přihlášení; nyní funguje přenos zálohou.
5. **Jemnější doporučení:** explicitní oblíbené žánry, „nezajímá mě“ a informace o pořadí dílů série, aby se nepředbíhalo pokračováním.

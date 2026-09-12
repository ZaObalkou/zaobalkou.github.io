/* Small, source-checked starting catalogue. Edition metadata must not be copied
 * between translations. Descriptions are original summaries, not publisher copy.
 * Checked 2026-09-12. Live catalogue providers supply additional books. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CatalogueData = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const books = [];
  const sources = [];
  function edition(workId, common, specific) {
    const book = Object.assign({workId: 'curated:' + workId, verified: true, verifiedAt: '2026-09-12', yearKind: 'edition'}, common, specific);
    book.id = 'seed:' + book.isbn;
    books.push(book);
    sources.push({isbn: book.isbn, title: book.title, name: book.source, url: book.link, checkedAt: book.verifiedAt});
  }
  function pair(workId, common, cs, en) {
    edition(workId, common, Object.assign({language: 'cs', source: 'Albatros Media', aliases: [en.title]}, cs));
    edition(workId, common, Object.assign({language: 'en', source: 'Bloomsbury', aliases: [cs.title]}, en));
  }

  pair('house-of-dragons-cluess', {
    author: 'Jessica Cluess', authorAliases: ['Jessica Cluesová'], firstPublishYear: 2020,
    seriesNumber: 1, tags: ['fantasy', 'draci', 'království', 'magie', 'dobrodružství', 'young adult'],
    desc: 'Pět nečekaných kandidátů soupeří o císařský trůn. Draci, královské rody a nebezpečné zkoušky prověří, komu lze věřit.'
  }, {
    title: 'Rod draků', year: 2022, pages: 400, isbn: '9788025359037', series: 'Rod draků',
    link: 'https://www.albatrosmedia.cz/tituly/77667268/rod-draku/'
  }, {
    title: 'House of Dragons', year: 2020, pages: 448, isbn: '9780525648154', series: 'House of Dragons', source: 'Penguin Random House',
    link: 'https://www.penguinrandomhouseretail.com/book/?isbn=9780525648154'
  });

  pair('rival-darling', {
    author: 'Alexandra Moody', firstPublishYear: 2024, seriesNumber: 1,
    tags: ['romantika', 'hokej', 'předstíraný vztah', 'střední škola', 'young adult'],
    desc: 'Violet po rozchodu předstírá vztah s hokejovým rivalem svého bývalého přítele. Dohoda s Reedem Darlingem ale postupně přerůstá v něco skutečného.'
  }, {
    title: 'Rival Darling', year: 2026, pages: 352, isbn: '9788026742258', series: 'Darlingovic Ďáblové',
    link: 'https://www.albatrosmedia.cz/tituly/100508947/rival-darling/'
  }, {
    title: 'Rival Darling', year: 2025, pages: 416, isbn: '9780063457423', series: 'The Darling Devils', source: 'HarperCollins / Epic Reads',
    link: 'https://epicreads.com/products/rival-darling'
  });

  pair('a-court-of-thorns-and-roses', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2015, seriesNumber: 1,
    tags: ['romantasy', 'fantasy', 'romantika', 'víly', 'magie', 'království'],
    desc: 'Lovkyně Feyre se ocitne v nebezpečném světě nesmrtelných víl. Při poznávání svého únosce odhaluje hrozbu, která může zničit jeho říši.'
  }, {
    title: 'Dvůr trnů a růží', year: 2026, pages: 440, isbn: '9788026742548', series: 'Dvůr trnů a růží',
    link: 'https://www.albatrosmedia.cz/tituly/104814879/dvur-trnu-a-ruzi/'
  }, {
    title: 'A Court of Thorns and Roses', year: 2020, pages: 448, isbn: '9781526605399', series: 'A Court of Thorns and Roses',
    link: 'https://www.bloomsbury.com/uk/court-of-thorns-and-roses-9781526605399/'
  });

  pair('a-court-of-mist-and-fury', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2016, seriesNumber: 2,
    tags: ['romantasy', 'fantasy', 'romantika', 'víly', 'magie', 'království'],
    desc: 'Feyre se vyrovnává s následky událostí Pod Horou. Nová pouta i staré závazky ji vtahují do konfliktů mezi vílími dvory.'
  }, {
    title: 'Dvůr mlhy a hněvu', year: 2026, pages: 664, isbn: '9788026742555', series: 'Dvůr trnů a růží',
    link: 'https://www.albatrosmedia.cz/tituly/104814864/dvur-mlhy-a-hnevu/'
  }, {
    title: 'A Court of Mist and Fury', year: 2020, pages: 656, isbn: '9781526617163', series: 'A Court of Thorns and Roses',
    link: 'https://www.bloomsbury.com/uk/court-of-mist-and-fury-9781526617163/'
  });

  pair('a-court-of-silver-flames', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2021, seriesNumber: 5,
    tags: ['romantasy', 'fantasy', 'romantika', 'víly', 'magie', 'přátelství'],
    desc: 'Nesta hledá své místo po válce a proměně ve vílu. Výcvik, nová přátelství a vztah s Cassianem ji nutí čelit vlastní minulosti.'
  }, {
    title: 'Dvůr stříbrných plamenů', year: 2026, pages: 728, isbn: '9788026742562', series: 'Dvůr trnů a růží',
    link: 'https://www.albatrosmedia.cz/tituly/104814843/dvur-stribrnych-plamenu/'
  }, {
    title: 'A Court of Silver Flames', year: 2022, pages: 784, isbn: '9781526635365', series: 'A Court of Thorns and Roses',
    link: 'https://www.bloomsbury.com/uk/court-of-silver-flames-9781526635365/'
  });

  pair('throne-of-glass', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2012, seriesNumber: 1,
    tags: ['fantasy', 'království', 'magie', 'dobrodružství', 'romantika', 'young adult'],
    desc: 'Vězněná zabijačka Celaena dostává šanci vybojovat si svobodu v královském turnaji. Soupeření však naruší záhadná úmrtí a skrytá magie.'
  }, {
    title: 'Skleněný trůn', year: 2024, pages: 392, isbn: '9788076619760', series: 'Skleněný trůn',
    link: 'https://www.albatrosmedia.cz/tituly/93439400/skleneny-trun/'
  }, {
    title: 'Throne of Glass', year: 2023, pages: 432, isbn: '9781526635297', series: 'Throne of Glass',
    link: 'https://www.bloomsbury.com/uk/throne-of-glass-9781526635297/'
  });

  pair('kingdom-of-ash', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2018, seriesNumber: 7,
    tags: ['fantasy', 'království', 'magie', 'válka', 'romantika', 'dobrodružství'],
    desc: 'Aelin a její spojenci čelí rozhodující bitvě o budoucnost svých zemí. Závěrečný román série Skleněný trůn propojuje osudy královen, válečníků a mágů.'
  }, {
    title: 'Království popela', year: 2025, pages: 976, isbn: '9788074988394', series: 'Skleněný trůn',
    link: 'https://www.albatrosmedia.cz/tituly/97430797/kralovstvi-popela/'
  }, {
    title: 'Kingdom of Ash', year: 2023, pages: 992, isbn: '9781526635273', series: 'Throne of Glass',
    link: 'https://www.bloomsbury.com/uk/kingdom-of-ash-9781526635273/'
  });

  edition('house-of-earth-and-blood', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2020,
    title: 'Půlměsíční město: Rod země a krve', aliases: ['Rod země a krve', 'House of Earth and Blood'],
    year: 2024, pages: 792, language: 'cs', isbn: '9788074987380', series: 'Půlměsíční město', seriesNumber: 1,
    tags: ['fantasy', 'romantasy', 'romantika', 'magie', 'vyšetřování', 'andělé'],
    desc: 'Bryce a padlý anděl Hunt vyšetřují vraždy v magickém velkoměstě. Pátrání po démonovi odkrývá mocenské zájmy i nečekané spojence.',
    source: 'Albatros Media', link: 'https://www.albatrosmedia.cz/tituly/93927959/pulmesicni-mesto-rod-zeme-a-krve/'
  }, {});

  edition('house-of-flame-and-shadow', {
    author: 'Sarah J. Maas', authorAliases: ['Sarah J. Maasová', 'Sarah Janet Maas'], firstPublishYear: 2024,
    title: 'House of Flame and Shadow', aliases: ['Půlměsíční město: Rod plamene a stínu', 'Rod plamene a stínu'],
    year: 2024, pages: 848, language: 'en', isbn: '9781408884447', series: 'Crescent City', seriesNumber: 3,
    tags: ['fantasy', 'romantasy', 'romantika', 'magie', 'vzpoura', 'andělé'],
    desc: 'Bryce hledá cestu zpět do svého světa, zatímco Hunt bojuje o přežití. Třetí Půlměsíční město rozvíjí vzpouru proti vládcům Midgardu.',
    source: 'Bloomsbury', link: 'https://www.bloomsbury.com/uk/house-of-flame-and-shadow-9781408884447/'
  }, {});

  edition('onyx-storm', {
    title: 'Onyxová bouře', aliases: ['Onyx Storm'], author: 'Rebecca Yarros', authorAliases: ['Rebecca Yarrosová'],
    year: 2025, firstPublishYear: 2025, pages: 632, language: 'cs', isbn: '9788025372197', series: 'Empyreum', seriesNumber: 3,
    tags: ['romantasy', 'fantasy', 'draci', 'magie', 'romantika', 'království'],
    desc: 'Violet opouští bezpečí ochranných štítů a hledá spojence pro Navarru. Třetí Empyreum přináší další střety dračích jezdců a pátrání po zásadních tajemstvích.',
    source: 'Albatros Media', link: 'https://www.albatrosmedia.cz/tituly/91888547/onyxova-boure/'
  }, {});

  edition('sunrise-on-the-reaping', {
    title: 'Úsvit sklizně', aliases: ['Sunrise on the Reaping'], author: 'Suzanne Collins', authorAliases: ['Suzanne Collinsová'],
    year: 2025, firstPublishYear: 2025, pages: 400, language: 'cs', isbn: '9788025371640', series: 'Hunger Games', seriesNumber: 5,
    tags: ['young adult', 'dystopie', 'dobrodružství', 'vzpoura', 'přežití'],
    desc: 'Mladý Haymitch je vybrán do padesátých Hladových her. Prequel o druhých Čtvrtohrách sleduje jeho boj proti aréně i pravidlům Kapitolu.',
    source: 'Albatros Media', link: 'https://www.albatrosmedia.cz/tituly/95061816/usvit-sklizne/'
  }, {});

  edition('divine-rivals', {
    title: 'Božští rivalové', aliases: ['Divine Rivals'], author: 'Rebecca Ross', authorAliases: ['Rebecca Rossová'],
    year: 2024, firstPublishYear: 2023, pages: 368, language: 'cs', isbn: '9788025368060', series: 'Začarované dopisy', seriesNumber: 1,
    tags: ['young adult', 'romantasy', 'fantasy', 'romantika', 'magie', 'válka'],
    desc: 'Mladé novináře Iris a Romana propojí dopisy přenášené kouzelnými psacími stroji. Jejich pracovní rivalita i vznikající vztah se střetávají s válkou bohů.',
    source: 'Albatros Media', link: 'https://www.albatrosmedia.cz/tituly/91496657/bozsti-rivalove/'
  }, {});

  edition('fourth-wing', {
    title: 'Čtvrté křídlo', aliases: ['Fourth Wing'], author: 'Rebecca Yarros', authorAliases: ['Rebecca Yarrosová'],
    year: 2024, firstPublishYear: 2023, pages: 536, language: 'cs', isbn: '9788025366882', series: 'Empyreum', seriesNumber: 1,
    tags: ['romantasy', 'fantasy', 'draci', 'magie', 'romantika', 'království'],
    desc: 'Violet se místo studia písařství musí zapojit do výcviku dračích jezdců. Na válečné akademii rozhodují o přežití schopnosti, důvtip i nebezpečná spojenectví.',
    source: 'Albatros Media', link: 'https://www.albatrosmedia.cz/tituly/89562509/ctvrte-kridlo/'
  }, {});

  edition('iron-flame', {
    title: 'Železný plamen', aliases: ['Iron Flame'], author: 'Rebecca Yarros', authorAliases: ['Rebecca Yarrosová'],
    year: 2024, firstPublishYear: 2023, pages: 752, language: 'cs', isbn: '9788025369548', series: 'Empyreum', seriesNumber: 2,
    tags: ['romantasy', 'fantasy', 'draci', 'magie', 'romantika', 'království'],
    desc: 'Druhý rok na Basgiathské akademii přináší Violet tvrdší výcvik a nového protivníka ve vedení školy. Postupně odkrývá tajemství, která mění její pohled na svět.',
    source: 'Albatros Media', link: 'https://www.albatrosmedia.cz/tituly/89562707/zelezny-plamen/'
  }, {});

  edition('once-upon-a-broken-heart', {
    title: 'Bylo nebylo jedno zlomené srdce', aliases: ['Once Upon a Broken Heart'], author: 'Stephanie Garber', authorAliases: ['Stephanie Garberová'],
    year: 2024, firstPublishYear: 2021, pages: 372, language: 'cs', isbn: '9788027740185', series: 'Bylo nebylo jedno zlomené srdce', seriesNumber: 1,
    tags: ['young adult', 'romantasy', 'fantasy', 'romantika', 'magie', 'pohádky'],
    desc: 'Evangelína chce zabránit svatbě své lásky a uzavírá dohodu se Srdcovým princem. Za jeho pomoc slíbí tři polibky, jejichž následky zatím nedokáže odhadnout.',
    source: 'Naše nakladatelství', link: 'https://www.nasenakladatelstvi.cz/produkt/bylo-nebylo-jedno-zlomene-srdce'
  }, {});

  sources.push({name: 'Alexandra Moody – témata série Darling Devils', url: 'https://www.alexandramoody.com/darlingdevils', checkedAt: '2026-09-12'});
  return {books: books, sources: sources};
}));

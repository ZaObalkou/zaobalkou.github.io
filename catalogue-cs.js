/* Partial Czech sci-fi fallback, retrieved from the official Open Library API
 * on 2026-09-13. Community catalogue metadata is not independently verified.
 * Explicit edition language is required; no language, ISBN or page count is guessed.
 * Obvious fantasy-only, nonfiction and unknown-author records were omitted.
 * This read-only snapshot supports browsing when the public API is unavailable;
 * live providers can still add and refresh editions. Request provenance is below. */
(function (root, factory) {
  var snapshot = factory();
  if (typeof module === 'object' && module.exports) module.exports = snapshot;
  else {
    root.CatalogueCS = snapshot;
    var catalogue = root.CatalogueData || (root.CatalogueData = {books: [], sources: []});
    var books = catalogue.books || (catalogue.books = []);
    var ids = new Set(books.map(function (book) { return book.id; }));
    var isbns = new Set(books.map(function (book) { return book.isbn; }).filter(Boolean));
    snapshot.books.forEach(function (book) {
      if (ids.has(book.id) || (book.isbn && isbns.has(book.isbn))) return;
      books.push(book); ids.add(book.id); if (book.isbn) isbns.add(book.isbn);
    });
    (catalogue.sources || (catalogue.sources = [])).push({
      name: 'Open Library – uložený český sci-fi katalog',
      url: snapshot.sourceUrls[0], checkedAt: snapshot.checkedAt
    });
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
  "checkedAt": "2026-09-13",
  "source": "Open Library",
  "coverage": "Partial Czech science-fiction catalogue snapshot; not a complete or live catalogue.",
  "sourceUrls": [
    "https://openlibrary.org/search.json?q=(subject%3A%22science%20fiction%22%20OR%20subject%3A%22sci-fi%22%20OR%20subject%3A%22v%C4%9Bdeckofantastick%C3%A9%20rom%C3%A1ny%22%20OR%20subject%3A%22v%C4%9Bdeckofantastick%C3%A9%20pov%C3%ADdky%22)%20AND%20language%3Acze&limit=60&fields=key%2Ctitle%2Cauthor_name%2Cfirst_publish_year%2Ccover_i%2Csubject%2Cratings_average%2Cratings_count%2Ceditions%2Ceditions.key%2Ceditions.title%2Ceditions.language%2Ceditions.isbn%2Ceditions.publish_date%2Ceditions.publish_year%2Ceditions.number_of_pages%2Ceditions.cover_i&lang=cs&offset=0",
    "https://openlibrary.org/search.json?q=(subject%3A%22science%20fiction%22%20OR%20subject%3A%22sci-fi%22%20OR%20subject%3A%22v%C4%9Bdeckofantastick%C3%A9%20rom%C3%A1ny%22%20OR%20subject%3A%22v%C4%9Bdeckofantastick%C3%A9%20pov%C3%ADdky%22)%20AND%20language%3Acze&limit=60&fields=key%2Ctitle%2Cauthor_name%2Cfirst_publish_year%2Ccover_i%2Csubject%2Cratings_average%2Cratings_count%2Ceditions%2Ceditions.key%2Ceditions.title%2Ceditions.language%2Ceditions.isbn%2Ceditions.publish_date%2Ceditions.publish_year%2Ceditions.number_of_pages%2Ceditions.cover_i&lang=cs&sort=new&offset=0",
    "https://openlibrary.org/search.json?q=(subject%3A%22science%20fiction%22%20OR%20subject%3A%22sci-fi%22%20OR%20subject%3A%22v%C4%9Bdeckofantastick%C3%A9%20rom%C3%A1ny%22%20OR%20subject%3A%22v%C4%9Bdeckofantastick%C3%A9%20pov%C3%ADdky%22)%20AND%20language%3Acze&limit=60&fields=key%2Ctitle%2Cauthor_name%2Cfirst_publish_year%2Ccover_i%2Csubject%2Cratings_average%2Cratings_count%2Ceditions%2Ceditions.key%2Ceditions.title%2Ceditions.language%2Ceditions.isbn%2Ceditions.publish_date%2Ceditions.publish_year%2Ceditions.number_of_pages%2Ceditions.cover_i&lang=cs&offset=60",
    "https://openlibrary.org/api/books?bibkeys=ISBN%3A9788076621107%2CISBN%3A9788086202143%2CISBN%3A9788073841768%2COLID%3AOL44166854M%2COLID%3AOL16481253M%2CISBN%3A9788071970842%2COLID%3AOL47828560M%2CISBN%3A9788085609691%2COLID%3AOL17170968M%2CISBN%3A9781500104269%2CISBN%3A9788085906035%2COLID%3AOL23044919M%2COLID%3AOL14803961M%2CISBN%3A9788020411983%2CISBN%3A9788085609547%2CISBN%3A9788071975076%2CISBN%3A9788071971641%2CISBN%3A9788025705735&format=json&jscmd=details"
  ],
  "books": [
    {
      "id": "/books/OL37045911M",
      "title": "Solaris",
      "author": "Stanisław Lem",
      "pages": 229,
      "year": 2021,
      "firstPublishYear": 1961,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "Sixth edition, third edition of this translation",
      "isbn": "9788076621107",
      "coverUrl": "https://covers.openlibrary.org/b/id/12623537-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/12623537-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL37045911M",
      "workId": "/works/OL109524W",
      "olWorkId": "/works/OL109524W",
      "olEditionId": "/books/OL37045911M",
      "editionId": "/books/OL37045911M",
      "pageSource": "Open Library · ISBN / konkrétní vydání",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL37045911M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.9285715,
      "olCount": 28,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL26418463M",
      "title": "Stopařův průvodce po Galaxii",
      "author": "Douglas Adams",
      "pages": 178,
      "year": 1998,
      "firstPublishYear": 1979,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dobrodružství",
        "škola"
      ],
      "aliases": [
        "The Hitchhiker's Guide to the Galaxy"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788086202143",
      "coverUrl": "https://covers.openlibrary.org/b/id/12986869-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/12986869-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL26418463M",
      "workId": "/works/OL2163649W",
      "olWorkId": "/works/OL2163649W",
      "olEditionId": "/books/OL26418463M",
      "editionId": "/books/OL26418463M",
      "pageSource": "Open Library · ISBN / konkrétní vydání",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL26418463M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4.511236,
      "olCount": 178,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL26436975M",
      "title": "Fahrenheit stupňů  451",
      "author": "Ray Bradbury",
      "pages": 0,
      "year": 2009,
      "firstPublishYear": 1953,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dystopie",
        "horor"
      ],
      "aliases": [
        "Fahrenheit 451"
      ],
      "authorAliases": [],
      "desc": "Guy Montag žije obklopen civilizací tryskových aut, raketových letadel, mechanické hudby a také ovšem policejních helikoptér a mechanických \"ohařů\", kteří svým chemickým čichem neomylně sledují stopu zločince, to je každého, kdo překročí základní zákon, tedy ještě čte knihy a nemyslí tak, jak je předepsáno. Tohoto \"zločinu\" se právě Montag dopustí. A o hrůzné štvanici, kterou na něho uspořádá policie v přímé televizní reportáži a o zániku onoho odlidštěného světa vypráví toto nejslavnější dílo klasika SF.\r\n\r\nsource: https://baronet.cz/451-stupnu-fahrenheita",
      "isbn": "9788073841768",
      "coverUrl": "https://covers.openlibrary.org/b/id/8151925-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/8151925-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL26436975M",
      "workId": "/works/OL103123W",
      "olWorkId": "/works/OL103123W",
      "olEditionId": "/books/OL26436975M",
      "editionId": "/books/OL26436975M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL26436975M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.9822617,
      "olCount": 451,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL44166854M",
      "title": "Konec civilisace",
      "author": "Aldous Huxley",
      "pages": 224,
      "year": 1933,
      "firstPublishYear": 1932,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dystopie"
      ],
      "aliases": [
        "Brave New World"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/8231823-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/8231823-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL44166854M",
      "workId": "/works/OL64365W",
      "olWorkId": "/works/OL64365W",
      "olEditionId": "/books/OL44166854M",
      "editionId": "/books/OL44166854M",
      "pageSource": "Open Library · ISBN / konkrétní vydání",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "series": "Knihy milionů -- svazek 5",
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL44166854M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.9666667,
      "olCount": 480,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL16481253M",
      "title": "Do měsíce",
      "author": "Jules Verne",
      "pages": 0,
      "year": 1929,
      "firstPublishYear": 1865,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dětské"
      ],
      "aliases": [
        "De la terre à la lune"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/5943556-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/5943556-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL16481253M",
      "workId": "/works/OL1099479W",
      "olWorkId": "/works/OL1099479W",
      "olEditionId": "/books/OL16481253M",
      "editionId": "/books/OL16481253M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "series": "Romány Jul. Vernea",
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL16481253M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.903226,
      "olCount": 31,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL47828560M",
      "title": "Cesta do středu Země",
      "author": "Jules Verne",
      "pages": 0,
      "year": 2012,
      "firstPublishYear": 1867,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi",
        "dobrodružství",
        "thriller",
        "dětské"
      ],
      "aliases": [
        "Voyage au Centre de la Terre"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/14327158-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/14327158-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL47828560M",
      "workId": "/works/OL1099513W",
      "olWorkId": "/works/OL1099513W",
      "olEditionId": "/books/OL47828560M",
      "editionId": "/books/OL47828560M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL47828560M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4.096774,
      "olCount": 93,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL23044919M",
      "title": "Ztracený svět",
      "author": "Arthur Conan Doyle",
      "pages": 244,
      "year": 1971,
      "firstPublishYear": 1900,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi",
        "dobrodružství",
        "detektivka",
        "young adult"
      ],
      "aliases": [
        "The Lost World"
      ],
      "authorAliases": [],
      "desc": "Translation of: Lost world.",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/8231444-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/8231444-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL23044919M",
      "workId": "/works/OL262460W",
      "olWorkId": "/works/OL262460W",
      "olEditionId": "/books/OL23044919M",
      "editionId": "/books/OL23044919M",
      "pageSource": "Open Library · ISBN / konkrétní vydání",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL23044919M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.9777777,
      "olCount": 45,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL14803961M",
      "title": "Moderni  Utopie.",
      "author": "H. G. Wells",
      "pages": 291,
      "year": 1922,
      "firstPublishYear": 1900,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "A Modern Utopia"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/8232021-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/8232021-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL14803961M",
      "workId": "/works/OL52256W",
      "olWorkId": "/works/OL52256W",
      "olEditionId": "/books/OL14803961M",
      "editionId": "/books/OL14803961M",
      "pageSource": "Open Library · ISBN / konkrétní vydání",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL14803961M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.357143,
      "olCount": 14,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL21311025M",
      "title": "Přežívá nejsmutnější",
      "author": "Margaret Atwood",
      "pages": 316,
      "year": 2005,
      "firstPublishYear": 2002,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "romantika",
        "fantasy",
        "sci-fi"
      ],
      "aliases": [
        "Oryx and Crake"
      ],
      "authorAliases": [],
      "desc": "Translation of: Oryx and Crake.\n\nFisher copy: Bound in original orange boards, with dust jacket.",
      "isbn": "9788020411983",
      "coverUrl": "https://covers.openlibrary.org/b/id/12507658-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/12507658-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL21311025M",
      "workId": "/works/OL675722W",
      "olWorkId": "/works/OL675722W",
      "olEditionId": "/books/OL21311025M",
      "editionId": "/books/OL21311025M",
      "pageSource": "Open Library · ISBN / konkrétní vydání",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "series": "Roman -- sv. 32",
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL21311025M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4.1666665,
      "olCount": 48,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL25487816M",
      "title": "R.U.R.",
      "author": "Karel Čapek, Josef Čapek",
      "pages": 0,
      "year": 1920,
      "firstPublishYear": 1920,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "R.U.R. and The insect play"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/10042438-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/10042438-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL25487816M",
      "workId": "/works/OL575625W",
      "olWorkId": "/works/OL575625W",
      "olEditionId": "/books/OL25487816M",
      "editionId": "/books/OL25487816M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL25487816M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.75,
      "olCount": 8,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL49750010M",
      "title": "Továrna Na Absolutno",
      "author": "Karel Čapek",
      "pages": 0,
      "year": 2015,
      "firstPublishYear": 1922,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Továrna na absolutno"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9781329207967",
      "coverUrl": "https://covers.openlibrary.org/b/id/4479902-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/4479902-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL49750010M",
      "workId": "/works/OL575636W",
      "olWorkId": "/works/OL575636W",
      "olEditionId": "/books/OL49750010M",
      "editionId": "/books/OL49750010M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL49750010M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4.3333335,
      "olCount": 6,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL38569660M",
      "title": "Píseční červi Duny",
      "author": "Kevin J. Anderson, Brian Herbert",
      "pages": 0,
      "year": 2016,
      "firstPublishYear": 1994,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dobrodružství"
      ],
      "aliases": [
        "Sandworms of Dune"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788026904458",
      "coverUrl": "https://covers.openlibrary.org/b/id/12807827-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/12807827-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL38569660M",
      "workId": "/works/OL14961045W",
      "olWorkId": "/works/OL14961045W",
      "olEditionId": "/books/OL38569660M",
      "editionId": "/books/OL38569660M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL38569660M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.4444444,
      "olCount": 18,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL25430100M",
      "title": "Kvantový zloděj",
      "author": "Hannu Rajaniemi",
      "pages": 0,
      "year": 2012,
      "firstPublishYear": 2010,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "detektivka"
      ],
      "aliases": [
        "The Quantum thief"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788071933595",
      "coverUrl": "https://covers.openlibrary.org/b/id/7261099-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/7261099-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL25430100M",
      "workId": "/works/OL17699438W",
      "olWorkId": "/works/OL17699438W",
      "olEditionId": "/books/OL25430100M",
      "editionId": "/books/OL25430100M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL25430100M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.2,
      "olCount": 5,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL25433443M",
      "title": "Pět neděl v baloně",
      "author": "Jules Verne",
      "pages": 0,
      "year": 2013,
      "firstPublishYear": 1867,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi",
        "thriller"
      ],
      "aliases": [
        "Cinq semaines en ballon"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/9956917-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/9956917-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL25433443M",
      "workId": "/works/OL1099380W",
      "olWorkId": "/works/OL1099380W",
      "olEditionId": "/books/OL25433443M",
      "editionId": "/books/OL25433443M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL25433443M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.9,
      "olCount": 10,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL58049651M",
      "title": "Krakatit",
      "author": "Karel Čapek",
      "pages": 0,
      "year": 1972,
      "firstPublishYear": 1924,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/11888469-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/11888469-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL58049651M",
      "workId": "/works/OL575533W",
      "olWorkId": "/works/OL575533W",
      "olEditionId": "/books/OL58049651M",
      "editionId": "/books/OL58049651M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL58049651M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3,
      "olCount": 2,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL3272117M",
      "title": "Cesta kolem měsíce",
      "author": "Jules Verne",
      "pages": 0,
      "year": 1870,
      "firstPublishYear": 1865,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dobrodružství",
        "dětské"
      ],
      "aliases": [
        "Autour de la lune"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "https://covers.openlibrary.org/b/id/2002974-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/2002974-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL3272117M",
      "workId": "/works/OL1100020W",
      "olWorkId": "/works/OL1100020W",
      "olEditionId": "/books/OL3272117M",
      "editionId": "/books/OL3272117M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL3272117M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.8,
      "olCount": 5,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL23035801M",
      "title": "Tulák po hvězdách",
      "author": "Jack London",
      "pages": 0,
      "year": 2001,
      "firstPublishYear": 1915,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dobrodružství"
      ],
      "aliases": [
        "The Star Rover"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788085935257",
      "coverUrl": "https://covers.openlibrary.org/b/id/9313897-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/9313897-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL23035801M",
      "workId": "/works/OL74497W",
      "olWorkId": "/works/OL74497W",
      "olEditionId": "/books/OL23035801M",
      "editionId": "/books/OL23035801M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL23035801M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.6666667,
      "olCount": 3,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50496185M",
      "title": "Zemětřas",
      "author": "Cherie Priest",
      "pages": 0,
      "year": 2011,
      "firstPublishYear": 2009,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Boneshaker"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788073874544",
      "coverUrl": "https://covers.openlibrary.org/b/id/14556637-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/14556637-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50496185M",
      "workId": "/works/OL19912818W",
      "olWorkId": "/works/OL19912818W",
      "olEditionId": "/books/OL50496185M",
      "editionId": "/books/OL50496185M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50496185M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.8333333,
      "olCount": 6,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL27905909M",
      "title": "Osudna vejce",
      "author": "Михаил Афанасьевич Булгаков",
      "pages": 0,
      "year": 2000,
      "firstPublishYear": 1988,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Роковые яйца"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788086202990",
      "coverUrl": "https://covers.openlibrary.org/b/id/9260349-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/9260349-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL27905909M",
      "workId": "/works/OL8300390W",
      "olWorkId": "/works/OL8300390W",
      "olEditionId": "/books/OL27905909M",
      "editionId": "/books/OL27905909M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL27905909M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 3.3333333,
      "olCount": 3,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL29476885M",
      "title": "Calusari",
      "author": "Garth Nix",
      "pages": 0,
      "year": 1997,
      "firstPublishYear": 1997,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi",
        "horor",
        "dětské"
      ],
      "aliases": [
        "Expediente X - 1/x File - 1"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788071971337",
      "coverUrl": "https://covers.openlibrary.org/b/id/10391983-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/10391983-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL29476885M",
      "workId": "/works/OL2628749W",
      "olWorkId": "/works/OL2628749W",
      "olEditionId": "/books/OL29476885M",
      "editionId": "/books/OL29476885M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL29476885M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4,
      "olCount": 1,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL26418489M",
      "title": "Útok z Podzemí",
      "author": "Roderick Gordon, Brian Williams",
      "pages": 0,
      "year": 2012,
      "firstPublishYear": 2012,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dobrodružství",
        "dětské"
      ],
      "aliases": [
        "Spiral"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788025313688",
      "coverUrl": "https://covers.openlibrary.org/b/id/8002736-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/8002736-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL26418489M",
      "workId": "/works/OL16571862W",
      "olWorkId": "/works/OL16571862W",
      "olEditionId": "/books/OL26418489M",
      "editionId": "/books/OL26418489M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL26418489M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 5,
      "olCount": 1,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL26418559M",
      "title": "Návrat z PODZEMÍ",
      "author": "Roderick Gordon, Brian Williams",
      "pages": 0,
      "year": 2010,
      "firstPublishYear": 2010,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dobrodružství",
        "dětské"
      ],
      "aliases": [
        "Closer"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788025311349",
      "coverUrl": "https://covers.openlibrary.org/b/id/6680352-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/6680352-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL26418559M",
      "workId": "/works/OL15520805W",
      "olWorkId": "/works/OL15520805W",
      "olEditionId": "/books/OL26418559M",
      "editionId": "/books/OL26418559M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL26418559M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 5,
      "olCount": 1,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL40964993M",
      "title": "Zakuti v oceli",
      "author": "Miroslav Žamboch",
      "pages": 0,
      "year": 2016,
      "firstPublishYear": 2016,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788075531759",
      "coverUrl": "https://covers.openlibrary.org/b/id/13008564-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/13008564-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL40964993M",
      "workId": "/works/OL29785996W",
      "olWorkId": "/works/OL29785996W",
      "olEditionId": "/books/OL40964993M",
      "editionId": "/books/OL40964993M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL40964993M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50496199M",
      "title": "Ganymédes",
      "author": "Cherie Priest",
      "pages": 0,
      "year": 2013,
      "firstPublishYear": 2011,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [
        "Ganymede"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788073876401",
      "coverUrl": "https://covers.openlibrary.org/b/id/14556659-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/14556659-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50496199M",
      "workId": "/works/OL21190492W",
      "olWorkId": "/works/OL21190492W",
      "olEditionId": "/books/OL50496199M",
      "editionId": "/books/OL50496199M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50496199M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4.5,
      "olCount": 2,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50496198M",
      "title": "Nepopsatelní",
      "author": "Cherie Priest",
      "pages": 0,
      "year": 2014,
      "firstPublishYear": 2012,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi",
        "horor",
        "historie"
      ],
      "aliases": [
        "The inexplicables"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788073877668",
      "coverUrl": "https://covers.openlibrary.org/b/id/14556658-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/14556658-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50496198M",
      "workId": "/works/OL16695004W",
      "olWorkId": "/works/OL16695004W",
      "olEditionId": "/books/OL50496198M",
      "editionId": "/books/OL50496198M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50496198M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": 4,
      "olCount": 2,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL39799229M",
      "title": "Ideální svět",
      "author": "Theresa Hannig",
      "pages": 0,
      "year": 2019,
      "firstPublishYear": 2017,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "dystopie"
      ],
      "aliases": [
        "Die Optimierer"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788075850409",
      "coverUrl": "https://covers.openlibrary.org/b/id/12913304-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/12913304-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL39799229M",
      "workId": "/works/OL24343748W",
      "olWorkId": "/works/OL24343748W",
      "olEditionId": "/books/OL39799229M",
      "editionId": "/books/OL39799229M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL39799229M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL57478803M",
      "title": "Moře času",
      "author": "Jaroslav Veis",
      "pages": 0,
      "year": 1986,
      "firstPublishYear": 1986,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Moře času"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL57478803M",
      "workId": "/works/OL2460009W",
      "olWorkId": "/works/OL2460009W",
      "olEditionId": "/books/OL57478803M",
      "editionId": "/books/OL57478803M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL57478803M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL498171M",
      "title": "Zápas s nebem",
      "author": "J. M. Troska",
      "pages": 0,
      "year": 1998,
      "firstPublishYear": 1998,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788090238473",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL498171M",
      "workId": "/works/OL2136704W",
      "olWorkId": "/works/OL2136704W",
      "olEditionId": "/books/OL498171M",
      "editionId": "/books/OL498171M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL498171M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL61173883M",
      "title": "Královský projekt",
      "author": "Carl Amery",
      "pages": 0,
      "year": 1997,
      "firstPublishYear": 1974,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi",
        "young adult"
      ],
      "aliases": [
        "Das Königsprojekt"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788023734447",
      "coverUrl": "https://covers.openlibrary.org/b/id/15164484-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/15164484-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL61173883M",
      "workId": "/works/OL2270689W",
      "olWorkId": "/works/OL2270689W",
      "olEditionId": "/books/OL61173883M",
      "editionId": "/books/OL61173883M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL61173883M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL575477M",
      "title": "Milénium",
      "author": "Ondřej Neff",
      "pages": 0,
      "year": 1992,
      "firstPublishYear": 1992,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL575477M",
      "workId": "/works/OL840494W",
      "olWorkId": "/works/OL840494W",
      "olEditionId": "/books/OL575477M",
      "editionId": "/books/OL575477M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL575477M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL14776953M",
      "title": "Ústřední kancelář vesmíru se neozývá",
      "author": "Ivan Kmínek",
      "pages": 0,
      "year": 1992,
      "firstPublishYear": 1992,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "8085001362",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL14776953M",
      "workId": "/works/OL11223421W",
      "olWorkId": "/works/OL11223421W",
      "olEditionId": "/books/OL14776953M",
      "editionId": "/books/OL14776953M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL14776953M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL2292176M",
      "title": "Teď už budeme lidé",
      "author": "Adam, Jan",
      "pages": 0,
      "year": 1985,
      "firstPublishYear": 1985,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Teď už budeme lidé"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL2292176M",
      "workId": "/works/OL22971464W",
      "olWorkId": "/works/OL22971464W",
      "olEditionId": "/books/OL2292176M",
      "editionId": "/books/OL2292176M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL2292176M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50360830M",
      "title": "Návrat na planetu Zemi",
      "author": "Ivo Železný",
      "pages": 0,
      "year": 1985,
      "firstPublishYear": 1985,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50360830M",
      "workId": "/works/OL37366966W",
      "olWorkId": "/works/OL37366966W",
      "olEditionId": "/books/OL50360830M",
      "editionId": "/books/OL50360830M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50360830M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL299033M",
      "title": "Whiteův velký atlas mimozemšťanů",
      "author": "Jaroslav Weis",
      "pages": 0,
      "year": 1989,
      "firstPublishYear": 1989,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788020400475",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL299033M",
      "workId": "/works/OL1694413W",
      "olWorkId": "/works/OL1694413W",
      "olEditionId": "/books/OL299033M",
      "editionId": "/books/OL299033M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL299033M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL433840M",
      "title": "Kapitán Nemo",
      "author": "J. M. Troska",
      "pages": 0,
      "year": 1992,
      "firstPublishYear": 1992,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788085491012",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL433840M",
      "workId": "/works/OL2136703W",
      "olWorkId": "/works/OL2136703W",
      "olEditionId": "/books/OL433840M",
      "editionId": "/books/OL433840M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL433840M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL57429945M",
      "title": "Stalo se zítra",
      "author": "Ivo Železný",
      "pages": 0,
      "year": 1984,
      "firstPublishYear": 1984,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL57429945M",
      "workId": "/works/OL42334794W",
      "olWorkId": "/works/OL42334794W",
      "olEditionId": "/books/OL57429945M",
      "editionId": "/books/OL57429945M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL57429945M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL19874889M",
      "title": "2003",
      "author": "Vlado Ríša",
      "pages": 0,
      "year": 2003,
      "firstPublishYear": 2003,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [
        "Česká fantasy 2003"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788020410566",
      "coverUrl": "https://covers.openlibrary.org/b/id/9327027-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/9327027-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL19874889M",
      "workId": "/works/OL19292719W",
      "olWorkId": "/works/OL19292719W",
      "olEditionId": "/books/OL19874889M",
      "editionId": "/books/OL19874889M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL19874889M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL58506670M",
      "title": "Alternativní budoucnost",
      "author": "Standa Procházka",
      "pages": 0,
      "year": 1993,
      "firstPublishYear": 1993,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL58506670M",
      "workId": "/works/OL42940819W",
      "olWorkId": "/works/OL42940819W",
      "olEditionId": "/books/OL58506670M",
      "editionId": "/books/OL58506670M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL58506670M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL1670680M",
      "title": "Měsíc mého života",
      "author": "Ondřej Neff",
      "pages": 0,
      "year": 1988,
      "firstPublishYear": 1988,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL1670680M",
      "workId": "/works/OL840487W",
      "olWorkId": "/works/OL840487W",
      "olEditionId": "/books/OL1670680M",
      "editionId": "/books/OL1670680M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL1670680M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL20727078M",
      "title": "Dvorana zvrhlosti",
      "author": "Ondřej Neff",
      "pages": 0,
      "year": 2004,
      "firstPublishYear": 2004,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788020411051",
      "coverUrl": "https://covers.openlibrary.org/b/id/9257114-M.jpg",
      "coverUrlL": "https://covers.openlibrary.org/b/id/9257114-L.jpg",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL20727078M",
      "workId": "/works/OL11202967W",
      "olWorkId": "/works/OL11202967W",
      "olEditionId": "/books/OL20727078M",
      "editionId": "/books/OL20727078M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL20727078M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50367648M",
      "title": "Tajná společnost SF",
      "author": "Zdeněk Rosenbaum",
      "pages": 0,
      "year": 1986,
      "firstPublishYear": 1986,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50367648M",
      "workId": "/works/OL37372379W",
      "olWorkId": "/works/OL37372379W",
      "olEditionId": "/books/OL50367648M",
      "editionId": "/books/OL50367648M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50367648M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50424018M",
      "title": "Čtvrtý den až na věky",
      "author": "Ondřej Neff",
      "pages": 0,
      "year": 1987,
      "firstPublishYear": 1987,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50424018M",
      "workId": "/works/OL37417718W",
      "olWorkId": "/works/OL37417718W",
      "olEditionId": "/books/OL50424018M",
      "editionId": "/books/OL50424018M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50424018M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL57672002M",
      "title": "Zapomenutý vesmír",
      "author": "Ladislav Szalai",
      "pages": 0,
      "year": 1985,
      "firstPublishYear": 1985,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL57672002M",
      "workId": "/works/OL42495250W",
      "olWorkId": "/works/OL42495250W",
      "olEditionId": "/books/OL57672002M",
      "editionId": "/books/OL57672002M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL57672002M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL58421734M",
      "title": "Tvůrci času",
      "author": "Jiří Procházka",
      "pages": 0,
      "year": 1991,
      "firstPublishYear": 1991,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788090021785",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL58421734M",
      "workId": "/works/OL42879624W",
      "olWorkId": "/works/OL42879624W",
      "olEditionId": "/books/OL58421734M",
      "editionId": "/books/OL58421734M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL58421734M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL45296992M",
      "title": "Zabij/zachraň svého mimozemšťana",
      "author": "Vlado Ríša",
      "pages": 0,
      "year": 2010,
      "firstPublishYear": 2010,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788020423023",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL45296992M",
      "workId": "/works/OL33389428W",
      "olWorkId": "/works/OL33389428W",
      "olEditionId": "/books/OL45296992M",
      "editionId": "/books/OL45296992M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL45296992M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL592738M",
      "title": "Hvězdný prach",
      "author": "Zdeněk Rosenbaum",
      "pages": 0,
      "year": 1996,
      "firstPublishYear": 1996,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Hvězdný prach"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788090193161",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL592738M",
      "workId": "/works/OL19228556W",
      "olWorkId": "/works/OL19228556W",
      "olEditionId": "/books/OL592738M",
      "editionId": "/books/OL592738M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL592738M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL61668107M",
      "title": "Mlok",
      "author": "Zdeněk Rampas",
      "pages": 0,
      "year": 1997,
      "firstPublishYear": 1997,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788085845037",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL61668107M",
      "workId": "/works/OL45231671W",
      "olWorkId": "/works/OL45231671W",
      "olEditionId": "/books/OL61668107M",
      "editionId": "/books/OL61668107M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL61668107M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL1676382M",
      "title": "Vesmírní diplomaté",
      "author": "Karel Blažek",
      "pages": 0,
      "year": 1990,
      "firstPublishYear": 1990,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [
        "Vesmírní diplomaté"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788070290224",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL1676382M",
      "workId": "/works/OL19558437W",
      "olWorkId": "/works/OL19558437W",
      "olEditionId": "/books/OL1676382M",
      "editionId": "/books/OL1676382M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL1676382M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL62229980M",
      "title": "Kočas 2014",
      "author": "Jiřina Vorlová",
      "pages": 0,
      "year": 2014,
      "firstPublishYear": 2014,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788085845389",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL62229980M",
      "workId": "/works/OL45708866W",
      "olWorkId": "/works/OL45708866W",
      "olEditionId": "/books/OL62229980M",
      "editionId": "/books/OL62229980M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL62229980M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL3764154M",
      "title": "2101",
      "author": "Jaroslav Jiran",
      "pages": 0,
      "year": 2002,
      "firstPublishYear": 2002,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788020409379",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL3764154M",
      "workId": "/works/OL19437726W",
      "olWorkId": "/works/OL19437726W",
      "olEditionId": "/books/OL3764154M",
      "editionId": "/books/OL3764154M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL3764154M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50391168M",
      "title": "Všechno je jinak",
      "author": "Ondřej Neff",
      "pages": 0,
      "year": 1986,
      "firstPublishYear": 1986,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50391168M",
      "workId": "/works/OL37391157W",
      "olWorkId": "/works/OL37391157W",
      "olEditionId": "/books/OL50391168M",
      "editionId": "/books/OL50391168M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50391168M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL48012115M",
      "title": "Sorry, vole, error",
      "author": "Vlado Ríša",
      "pages": 0,
      "year": 2007,
      "firstPublishYear": 2007,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788020416339",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL48012115M",
      "workId": "/works/OL35576124W",
      "olWorkId": "/works/OL35576124W",
      "olEditionId": "/books/OL48012115M",
      "editionId": "/books/OL48012115M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL48012115M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL50366898M",
      "title": "Železo přichází z hvězd",
      "author": "Vojtěch Kantor",
      "pages": 0,
      "year": 1983,
      "firstPublishYear": 1983,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL50366898M",
      "workId": "/works/OL37371780W",
      "olWorkId": "/works/OL37371780W",
      "olEditionId": "/books/OL50366898M",
      "editionId": "/books/OL50366898M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL50366898M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL53786756M",
      "title": "Fantázia 2011",
      "author": "Ivan Pullman",
      "pages": 0,
      "year": 2011,
      "firstPublishYear": 2011,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788096923663",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL53786756M",
      "workId": "/works/OL39532355W",
      "olWorkId": "/works/OL39532355W",
      "olEditionId": "/books/OL53786756M",
      "editionId": "/books/OL53786756M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL53786756M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL57480451M",
      "title": "Přistání na Řípu",
      "author": "Vojtěch Kantor",
      "pages": 0,
      "year": 1988,
      "firstPublishYear": 1988,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL57480451M",
      "workId": "/works/OL42367947W",
      "olWorkId": "/works/OL42367947W",
      "olEditionId": "/books/OL57480451M",
      "editionId": "/books/OL57480451M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL57480451M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL45271792M",
      "title": "Vládcové vesmíru",
      "author": "Ivan Adamovič",
      "pages": 0,
      "year": 2010,
      "firstPublishYear": 2010,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788000026350",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL45271792M",
      "workId": "/works/OL33366354W",
      "olWorkId": "/works/OL33366354W",
      "olEditionId": "/books/OL45271792M",
      "editionId": "/books/OL45271792M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL45271792M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL43819851M",
      "title": "Puls nekonečna",
      "author": "Ivan Adamovič",
      "pages": 0,
      "year": 2011,
      "firstPublishYear": 2011,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788025900963",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL43819851M",
      "workId": "/works/OL32089231W",
      "olWorkId": "/works/OL32089231W",
      "olEditionId": "/books/OL43819851M",
      "editionId": "/books/OL43819851M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL43819851M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL45269160M",
      "title": "Hvězdy české sci-fi",
      "author": "Ondřej Jireš",
      "pages": 0,
      "year": 2010,
      "firstPublishYear": 2010,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788025702703",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL45269160M",
      "workId": "/works/OL33363976W",
      "olWorkId": "/works/OL33363976W",
      "olEditionId": "/books/OL45269160M",
      "editionId": "/books/OL45269160M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL45269160M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL57413052M",
      "title": "Lidé ze souhvězdí Lva",
      "author": "Vojtěch Kantor",
      "pages": 0,
      "year": 1983,
      "firstPublishYear": 1983,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "sci-fi"
      ],
      "aliases": [],
      "authorAliases": [],
      "desc": "",
      "isbn": "",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL57413052M",
      "workId": "/works/OL42324727W",
      "olWorkId": "/works/OL42324727W",
      "olEditionId": "/books/OL57413052M",
      "editionId": "/books/OL57413052M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL57413052M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    },
    {
      "id": "/books/OL1629630M",
      "title": "Hosté z planety lidí",
      "author": "Karel Blažek",
      "pages": 0,
      "year": 1990,
      "firstPublishYear": 1990,
      "yearKind": "edition",
      "language": "cs",
      "tags": [
        "fantasy",
        "sci-fi"
      ],
      "aliases": [
        "Hosté z planety lidí"
      ],
      "authorAliases": [],
      "desc": "",
      "isbn": "9788070290248",
      "coverUrl": "",
      "coverUrlL": "",
      "spineUrl": "",
      "link": "https://openlibrary.org/books/OL1629630M",
      "workId": "/works/OL16339855W",
      "olWorkId": "/works/OL16339855W",
      "olEditionId": "/books/OL1629630M",
      "editionId": "/books/OL1629630M",
      "pageSource": "",
      "metadataSource": "Open Library · uložený katalog (2026-09-13)",
      "source": "Open Library",
      "verified": false,
      "metadataSources": [
        {
          "source": "Open Library",
          "url": "https://openlibrary.org/books/OL1629630M",
          "checkedAt": "2026-09-13T00:00:00.000Z"
        }
      ],
      "aRating": null,
      "aCount": 0,
      "olRating": null,
      "olCount": 0,
      "gRating": null,
      "gCount": 0
    }
  ]
};
}));

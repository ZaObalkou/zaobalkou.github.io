#!/usr/bin/env node
'use strict';

// Refresh the small starting catalogue using Goodreads' public embed generator
// and average-rating widget. This is not a crawler of book/review pages.
// No API key, remote JavaScript execution, proxy, or challenge bypass is used.
// Usage: node scripts/update-goodreads-catalogue.cjs
// GET starts are spaced by >= 1100 ms, with at most two books being processed.
// An access denial / challenge stops the run. Successful responses are cached
// outside the repository so a failed refresh can be resumed without a burst.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

function decodeHTML(text) {
  return String(text || '').replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, function (_, entity) {
    const named = {amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' '};
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
  });
}
function normalizeTitle(value) {
  return decodeHTML(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function matchesTitle(book, title) {
  const candidate = normalizeTitle(title);
  return [book.title].concat(book.aliases || []).some(function (alias) {
    return candidate && candidate === normalizeTitle(alias);
  });
}
function parseGenerator(html, book) {
  const header = /<div\s+id=["']gr_header["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);
  const link = header && /href=["'](https:\/\/www\.goodreads\.com\/book\/show\/(\d+)[^"']*)["'][^>]*>Goodreads reviews for ([\s\S]*?)<\/a>/i.exec(header[1]);
  if (!link) return null;
  const title = decodeHTML(link[3].replace(/<[^>]+>/g, '')).trim();
  if (!matchesTitle(book, title)) return {mismatch: true, title: title};
  return {id: link[2], title: title, url: decodeHTML(link[1]).split('?')[0]};
}
function parseWidget(script, expectedId) {
  // Parse only the documented, single quoted document.write string literal.
  const literal = /^\s*document\.write\('((?:[^'\\]|\\.)*)'\);\s*$/.exec(script);
  if (!literal) return null;
  const html = literal[1].replace(/\\(u[0-9a-f]{4}|x[0-9a-f]{2}|[\\'"/nrtbf])/gi, function (_, escape) {
    if (/^[ux]/i.test(escape)) return String.fromCharCode(parseInt(escape.slice(1), 16));
    return ({'\\': '\\', "'": "'", '"': '"', '/': '/', n: '\n', r: '\r', t: '\t', b: '\b', f: '\f'})[escape];
  });
  const rating = /Goodreads rating:\s*([0-5](?:\.\d+)?)\s*\(\s*([\d,]+)\s+ratings?\s*\)/i.exec(html);
  const links = Array.from(html.matchAll(/href="(https:\/\/www\.goodreads\.com\/book\/show\/(\d+)[^"]*)"[^>]*>([^<]+)<\/a>/g));
  const link = links.find(function (match) { return match[2] === String(expectedId); });
  if (!rating || !link) return null;
  const value = Number(rating[1]), count = Number(rating[2].replace(/,/g, ''));
  if (!(value > 0 && value <= 5 && Number.isSafeInteger(count) && count > 0)) return null;
  return {id: String(expectedId), title: decodeHTML(link[3]), rating: value, count: count, url: decodeHTML(link[1]).split('?')[0]};
}
function retainSnapshots(books, previous, state) {
  let retained = 0;
  function rowMatches(row, book) {
    return row.isbn && row.isbn === book.isbn || row.editionId && row.editionId === (book.olEditionId || book.id) ||
      row.scope === 'work' && row.workId && row.workId === book.workId;
  }
  function validPrior(row, book) {
    return row && row.snapshot === true && row.rating > 0 && row.rating <= 5 && Number.isSafeInteger(row.count) && row.count > 0 &&
      Number.isFinite(Date.parse(row.checkedAt)) && /^https:\/\/www\.goodreads\.com\/book\/show\/\d+/.test(row.url || '') &&
      matchesTitle(book, row.title) && [book.author].concat(book.authorAliases || []).some(function (author) { return normalizeTitle(author) === normalizeTitle(row.author); });
  }
  for (const book of books) {
    const identityRejected = state.unresolved.some(function (row) {
      return (row.isbn && row.isbn === book.isbn || row.editionId && row.editionId === (book.olEditionId || book.id)) && /title mismatch/i.test(row.reason);
    });
    if (identityRejected) continue;
    const prior = (previous.ratings || []).find(function (row) { return rowMatches(row, book) && validPrior(row, book); });
    if (!prior) continue;
    const editionId = book.olEditionId || book.id;
    const exact = previous.byIsbn && previous.byIsbn[book.isbn];
    const edition = previous.byEditionId && previous.byEditionId[editionId];
    const work = previous.byWorkId && previous.byWorkId[book.workId];
    if (!state.byIsbn[book.isbn] && exact && matchesTitle(book, exact.title)) state.byIsbn[book.isbn] = exact;
    if (!state.byEditionId[editionId] && edition && matchesTitle(book, edition.title)) state.byEditionId[editionId] = edition;
    if (book.verified && !state.byWorkId[book.workId] && work && matchesTitle(book, work.title)) state.byWorkId[book.workId] = work;
    if (!state.ratings.some(function (row) { return rowMatches(row, book); })) {
      // Keep the actual observation date; a failed refresh is not fresh data.
      state.ratings.push(Object.assign({}, prior)); retained++;
    }
  }
  return retained;
}

async function main() {
  const repo = path.resolve(__dirname, '..');
  let previous = {};
  try { previous = require(path.join(repo, 'goodreads-catalogue.js')); } catch (_) {}
  const starting = require(path.join(repo, 'catalogue-data.js')).books;
  const stored = require(path.join(repo, 'catalogue-cs.js')).books;
  const seen = new Set();
  const books = starting.concat(stored).filter(function (book) {
    const key = book.isbn || book.id;
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  const cacheDir = process.env.GOODREADS_CACHE_DIR || path.join(os.tmpdir(), 'zaobalkou-goodreads-widget-cache');
  fs.mkdirSync(cacheDir, {recursive: true});
  let nextStart = 0, rateTail = Promise.resolve(), halted = false;
  const sleep = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
  async function get(url) {
    const cacheFile = path.join(cacheDir, crypto.createHash('sha256').update(url).digest('hex') + '.json');
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - Date.parse(cached.checkedAt) < 6 * 60 * 60 * 1000) return cached;
    } catch (_) {}
    if (halted) throw new Error('Refresh stopped after access denial');
    const waitTurn = rateTail.then(async function () {
      await sleep(Math.max(0, nextStart - Date.now()));
      nextStart = Date.now() + 1100;
    });
    rateTail = waitTurn.catch(function () {});
    await waitTurn;
    if (halted) throw new Error('Refresh stopped after access denial');
    const response = await fetch(url, {signal: AbortSignal.timeout(30000), headers: {'User-Agent': 'ZaObalkouCatalogue/1.0 (+https://zaobalkou.github.io/)'}});
    const text = await response.text();
    if ([401, 403, 429].includes(response.status) || /verify (?:that )?you(?:'re| are) (?:not |a )?robot|captcha|automated access to (?:our|this) site/i.test(text)) {
      halted = true;
      throw new Error('Access denied or verification required; refresh stopped (' + response.status + ')');
    }
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const result = {url: url, checkedAt: new Date().toISOString(), text: text};
    fs.writeFileSync(cacheFile, JSON.stringify(result));
    return result;
  }
  const byIsbn = {}, byEditionId = {}, byWorkId = {}, unresolved = [], ratings = [];
  const olIds = {};
  function bookKey(book) { return book.isbn || book.id; }
  function bibkey(book) {
    if (/^(?:\d{13}|\d{9}[\dX])$/.test(book.isbn || '')) return 'ISBN:' + book.isbn;
    return 'OLID:' + String(book.olEditionId || book.id).replace('/books/', '');
  }
  // Open Library's documented Books API can supply exact-edition external IDs.
  for (let offset = 0; offset < books.length && !halted; offset += 20) {
    const part = books.slice(offset, offset + 20);
    const url = 'https://openlibrary.org/api/books?bibkeys=' + part.map(bibkey).join(',') + '&jscmd=details&format=json';
    try {
      const result = await get(url), data = JSON.parse(result.text);
      part.forEach(function (book) {
        const details = data[bibkey(book)] && data[bibkey(book)].details;
        const ids = details && details.identifiers && details.identifiers.goodreads;
        if (details && matchesTitle(book, details.title) && Array.isArray(ids) && /^\d+$/.test(String(ids[0]))) {
          olIds[bookKey(book)] = {id: String(ids[0]), title: details.title, url: 'https://www.goodreads.com/book/show/' + ids[0], sourceUrl: url, checkedAt: result.checkedAt};
        }
      });
    } catch (error) { console.error('Open Library batch:', error.message); }
  }
  console.log('Exact Open Library Goodreads identifiers:', Object.keys(olIds).length);
  const widgetRequests = new Map();
  async function processBook(book) {
    try {
      let entry = olIds[bookKey(book)];
      if (!entry) {
        if (!book.isbn) throw new Error('No ISBN or exact Open Library Goodreads identifier');
        const url = 'https://www.goodreads.com/api/reviews_demo_widget_iframe?isbn=' + book.isbn;
        const result = await get(url), parsed = parseGenerator(result.text, book);
        if (!parsed) throw new Error('ISBN not found in Goodreads embed generator');
        if (parsed.mismatch) throw new Error('Title mismatch: ' + parsed.title);
        entry = Object.assign(parsed, {sourceUrl: url, checkedAt: result.checkedAt});
      }
      const widgetUrl = 'https://www.goodreads.com/book/avg_rating_widget/' + entry.id;
      if (!widgetRequests.has(entry.id)) widgetRequests.set(entry.id, get(widgetUrl));
      const widget = await widgetRequests.get(entry.id), parsed = parseWidget(widget.text, entry.id);
      if (!parsed) throw new Error('No valid Goodreads aggregate rating in widget');
      if (!matchesTitle(book, parsed.title)) throw new Error('Widget title mismatch: ' + parsed.title);
      if (book.isbn) byIsbn[book.isbn] = entry;
      if (/^\/books\/OL\d+M$/.test(book.olEditionId || book.id)) byEditionId[book.olEditionId || book.id] = entry;
      if (book.verified === true && /^curated:/.test(book.workId || '') && !byWorkId[book.workId]) byWorkId[book.workId] = entry;
      ratings.push({workId: book.workId || '', isbn: book.isbn || undefined, editionId: book.olEditionId || undefined, title: parsed.title, author: book.author,
        scope: 'work', rating: parsed.rating, count: parsed.count, url: parsed.url,
        checkedAt: widget.checkedAt, snapshot: true, provenance: 'official-goodreads-rating-widget',
        sourceUrl: widgetUrl, identitySourceUrl: entry.sourceUrl});
      console.log('OK', book.isbn, parsed.title, parsed.rating, parsed.count);
    } catch (error) {
      unresolved.push({isbn: book.isbn || undefined, editionId: book.olEditionId || undefined, title: book.title, reason: error.message});
      console.log('SKIP', book.isbn, book.title, error.message);
    }
  }
  // Two workers preserve a small bounded queue; the shared gate spaces requests.
  let cursor = 0;
  await Promise.all([0, 1].map(async function () {
    while (cursor < books.length && !halted) { const book = books[cursor++]; await processBook(book); }
  }));
  books.slice(cursor).forEach(function (book) { unresolved.push({isbn: book.isbn, title: book.title, reason: 'Refresh stopped after access denial'}); });
  // A new translation ISBN may not exist on Goodreads yet. The publisher-checked
  // aliases identify its story; OL's work-level Goodreads IDs can then locate a
  // rating for that story. Such an ID must NEVER become this edition's grId.
  const checkedWorks = new Set();
  for (const book of starting) {
    if (halted || !book.verified || byWorkId[book.workId] || checkedWorks.has(book.workId)) continue;
    checkedWorks.add(book.workId);
    const asciiAliases = (book.aliases || []).filter(function (alias) { return /^[\x20-\x7e]+$/.test(alias); });
    const title = (asciiAliases.sort(function (a, b) { return b.length - a.length; })[0] || (book.aliases || [])[0] || book.title).replace(/^the\s+/i, '');
    // The narrow title query is faster than OL's combined title/author query;
    // the author is still required to match before any identifier is accepted.
    const url = 'https://openlibrary.org/search.json?title=' + encodeURIComponent(title) + '&fields=key,title,author_name,id_goodreads,isbn&limit=4';
    try {
      const result = await get(url), data = JSON.parse(result.text);
      const authors = [book.author].concat(book.authorAliases || []).map(normalizeTitle);
      const work = (data.docs || []).filter(function (doc) {
        return matchesTitle(book, doc.title) && (doc.author_name || []).some(function (name) { return authors.includes(normalizeTitle(name)); });
      }).sort(function (a, b) { return normalizeTitle(b.title).length - normalizeTitle(a.title).length; })[0];
      if (!work) continue;
      const candidateIds = (work.id_goodreads || []).filter(function (id) { return /^\d+$/.test(String(id)); }).slice(0, 10);
      // Some OL works have ISBNs but no Goodreads identifier field. Resolve a
      // bounded selection of their editions through the official ISBN generator.
      if (!candidateIds.length) {
        const isbns = (work.isbn || []).filter(function (isbn) { return /^978[01]\d{9}$/.test(isbn); }).slice(0, 3);
        for (const isbn of isbns) {
          const generated = await get('https://www.goodreads.com/api/reviews_demo_widget_iframe?isbn=' + isbn);
          const candidate = parseGenerator(generated.text, book);
          if (candidate && !candidate.mismatch) { candidateIds.push(candidate.id); break; }
        }
      }
      for (const id of candidateIds) {
        const widgetUrl = 'https://www.goodreads.com/book/avg_rating_widget/' + id;
        if (!widgetRequests.has(String(id))) widgetRequests.set(String(id), get(widgetUrl));
        const widget = await widgetRequests.get(String(id)), parsed = parseWidget(widget.text, id);
        if (!parsed || !matchesTitle(book, parsed.title)) continue;
        const entry = {id: String(id), title: parsed.title, url: parsed.url, sourceUrl: url,
          checkedAt: widget.checkedAt, scope: 'work', olWorkId: work.key};
        byWorkId[book.workId] = entry;
        ratings.push({workId: book.workId, title: parsed.title, author: book.author,
          scope: 'work', rating: parsed.rating, count: parsed.count, url: parsed.url,
          checkedAt: widget.checkedAt, snapshot: true, provenance: 'official-goodreads-rating-widget',
          sourceUrl: widgetUrl, identitySourceUrl: url, identityMatch: 'publisher-title-alias-and-author'});
        console.log('WORK', book.workId, parsed.title, parsed.rating, parsed.count);
        break;
      }
    } catch (error) { console.error('Work rating:', book.workId, error.message); }
  }
  const retained = retainSnapshots(books, previous, {byIsbn: byIsbn, byEditionId: byEditionId, byWorkId: byWorkId, ratings: ratings, unresolved: unresolved});
  const checkedAt = new Date().toISOString();
  const registry = {checkedAt: checkedAt, byIsbn: byIsbn, byEditionId: byEditionId, byWorkId: byWorkId, ratings: ratings,
    coverage: {catalogueEditions: books.length, isbnEditions: books.filter(function (book) { return !!book.isbn; }).length,
      exactIsbnMappings: Object.keys(byIsbn).length, exactOlEditionMappings: Object.keys(byEditionId).length,
      ratedCatalogueEditions: books.filter(function (book) { return byIsbn[book.isbn] || byEditionId[book.olEditionId || book.id] || book.verified && byWorkId[book.workId]; }).length,
      curatedEditions: starting.length, ratedCuratedEditions: starting.filter(function (book) { return byIsbn[book.isbn] || byWorkId[book.workId]; }).length,
      retainedRatingSnapshots: retained,
      verifiedCuratedWorks: Object.keys(byWorkId).length}, unresolved: unresolved};
  const moduleText = '/* Exact ISBN identifiers verified with official Goodreads widgets or Open Library.\n' +
    ' * Generated by scripts/update-goodreads-catalogue.cjs; do not infer edition IDs across translations. */\n' +
    '(function (root, factory) {\n' +
    "  if (typeof module === 'object' && module.exports) module.exports = factory();\n" +
    '  else {\n    var registry = root.GoodreadsCatalogue = factory();\n' +
    '    (root.CatalogueData && root.CatalogueData.books || []).forEach(function (book) {\n' +
    '      var entry = registry.byIsbn[book.isbn] || registry.byEditionId[book.olEditionId || book.id];\n      if (entry) book.grId = entry.id;\n' +
    '      var rating = registry.ratings.find(function (row) { return row.isbn && row.isbn === book.isbn || row.editionId && row.editionId === (book.olEditionId || book.id); });\n' +
    '      if (!rating && book.verified === true) rating = registry.ratings.find(function (row) { return row.workId === book.workId && row.scope === "work"; });\n' +
    '      if (rating) Object.assign(book, {grRating: rating.rating, grCount: rating.count, grUrl: rating.url, grCheckedAt: rating.checkedAt, grScope: rating.scope, grSnapshot: true});\n' +
    '    });\n  }\n' +
    "}(typeof globalThis !== 'undefined' ? globalThis : this, function () {\n  'use strict';\n  return " + JSON.stringify(registry, null, 2) + ';\n}));\n';
  // Only replace deployed outputs after at least one real source succeeded.
  if (!ratings.length) throw new Error('No verified ratings obtained; existing catalogue left intact');
  fs.writeFileSync(path.join(repo, 'goodreads-catalogue.js'), moduleText);
  fs.writeFileSync(path.join(repo, 'goodreads-ratings.json'), JSON.stringify({
    description: 'Snapshots from the official Goodreads average-rating embed, checked at the recorded time. Live widgets refresh these when available.',
    checkedAt: checkedAt, coverage: registry.coverage, ratings: ratings
  }, null, 2) + '\n');
  console.log('Saved', JSON.stringify(registry.coverage), 'Unresolved:', unresolved.length);
}

module.exports = {decodeHTML: decodeHTML, normalizeTitle: normalizeTitle, matchesTitle: matchesTitle, parseGenerator: parseGenerator, parseWidget: parseWidget, retainSnapshots: retainSnapshots};
if (require.main === module) main().catch(function (error) { console.error(error.message); process.exitCode = 1; });

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const parser = require('../scripts/update-goodreads-catalogue.cjs');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('official embed generator ties a Goodreads ID to the requested ISBN title', function () {
  const html = '<div id="gr_header"><h1><a rel="nofollow" href="https://www.goodreads.com/book/show/208921077-tvrt-k-dlo">Goodreads reviews for Čtvrté křídlo</a></h1></div>';
  const result = parser.parseGenerator(html, {title: 'Čtvrté křídlo', aliases: ['Fourth Wing']});
  assert.equal(result.id, '208921077');
  assert.equal(result.title, 'Čtvrté křídlo');
  assert.equal(parser.parseGenerator(html, {title: 'Železný plamen'}).mismatch, true);
  assert.equal(parser.parseGenerator('<a href="https://www.goodreads.com/book/show/1">Random sidebar link</a>', {title: 'Random sidebar link'}), null);
});

test('average-rating widget is parsed as data without executing its JavaScript', function () {
  const script = String.raw`document.write('<a title=\"Čtvrté křídlo (Empyreum, #1)\" href=\"https://www.goodreads.com/book/show/208921077\"><img src=\"cover.jpg\" /><\/a><div><a rel=\"nofollow\" href=\"https://www.goodreads.com/book/show/208921077-tvrt-k-dlo?utm_medium=api&amp;utm_source=book_widget\">Čtvrté křídlo<\/a><br/>Goodreads rating: 4.56 (3955143 ratings)<\/div>\n');`;
  assert.deepEqual(parser.parseWidget(script, '208921077'), {
    id: '208921077', title: 'Čtvrté křídlo', rating: 4.56, count: 3955143,
    url: 'https://www.goodreads.com/book/show/208921077-tvrt-k-dlo'
  });
  assert.equal(parser.parseWidget(script, '61431922'), null);
  assert.equal(parser.parseWidget(script + '\nprocess.exit(1);', '208921077'), null);
  assert.equal(parser.parseWidget(script.replace('3955143', '0'), '208921077'), null);
  assert.equal(parser.parseWidget(script.replace('4.56', '6.00'), '208921077'), null);
});

test('title matching accepts accents, typography and an explicit alias but not another volume', function () {
  const book = {title: 'Dvůr trnů a růží', aliases: ['A Court of Thorns and Roses']};
  assert.equal(parser.matchesTitle(book, 'Dvur trnu a ruzi'), true);
  assert.equal(parser.matchesTitle(book, 'A Court of Thorns and Roses (A Court of Thorns and Roses, #1)'), true);
  assert.equal(parser.matchesTitle(book, 'A Court of Mist and Fury'), false);
  assert.equal(parser.matchesTitle(book, 'A Court of Thorns and Roses Collection'), false);
  assert.equal(parser.decodeHTML('It&#39;s &amp; &#x010C;'), "It's & Č");
});

test('stored work ratings populate a verified translation without borrowing an edition ID', function () {
  const context = {CatalogueData: {books: [
    {title: 'Dvůr trnů a růží', isbn: '9788026742548', workId: 'curated:a-court-of-thorns-and-roses', verified: true},
    {title: 'Unknown book', isbn: '', id: '/books/OL999999999M', verified: false},
    {title: 'Čtvrté křídlo', isbn: '9788025366882', workId: 'curated:fourth-wing', verified: true}
  ]}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../goodreads-catalogue.js'), 'utf8'), context);
  const [translation, unknown, exact] = context.CatalogueData.books;
  assert.equal(translation.grRating > 0, true);
  assert.equal(translation.grSnapshot, true);
  assert.equal(translation.grScope, 'work');
  assert.equal(translation.grId, undefined);
  assert.equal(unknown.grRating, undefined);
  assert.equal(unknown.grId, undefined);
  assert.match(exact.grId, /^\d+$/);
  assert.equal(exact.grCount > 1000000, true);
});

test('every stored snapshot has source provenance and a matching numeric Goodreads URL', function () {
  const catalogue = require('../goodreads-catalogue.js');
  assert.ok(catalogue.ratings.length > 20);
  for (const row of catalogue.ratings) {
    assert.equal(row.snapshot, true);
    assert.equal(row.scope, 'work');
    assert.equal(row.provenance, 'official-goodreads-rating-widget');
    assert.match(row.sourceUrl, /^https:\/\/www\.goodreads\.com\/book\/avg_rating_widget\/\d+$/);
    assert.equal(/book\/show\/(\d+)/.exec(row.url)[1], row.sourceUrl.split('/').pop());
    assert.equal(Number.isFinite(Date.parse(row.checkedAt)), true);
    assert.ok(row.rating > 0 && row.rating <= 5 && row.count > 0);
  }
});

test('a partial refresh retains a verified snapshot with its real observation date', function () {
  const book = {isbn: '9788025366882', title: 'Čtvrté křídlo', author: 'Rebecca Yarros', workId: 'curated:fourth-wing', verified: true};
  const row = {isbn: book.isbn, title: book.title, author: book.author, workId: book.workId,
    rating: 4.56, count: 3000000, checkedAt: '2026-09-01T10:00:00Z', snapshot: true,
    scope: 'work', url: 'https://www.goodreads.com/book/show/208921077'};
  const entry = {id: '208921077', title: book.title};
  const previous = {ratings: [row], byIsbn: {[book.isbn]: entry}, byWorkId: {[book.workId]: entry}};
  const state = {ratings: [], byIsbn: {}, byEditionId: {}, byWorkId: {}, unresolved: []};
  assert.equal(parser.retainSnapshots([book], previous, state), 1);
  assert.equal(state.ratings[0].checkedAt, '2026-09-01T10:00:00Z');
  assert.equal(state.byIsbn[book.isbn].id, '208921077');
  const rejected = {ratings: [], byIsbn: {}, byEditionId: {}, byWorkId: {}, unresolved: [{isbn: book.isbn, reason: 'Widget title mismatch: A different book'}]};
  assert.equal(parser.retainSnapshots([book], previous, rejected), 0);
  assert.equal(rejected.byIsbn[book.isbn], undefined);
});

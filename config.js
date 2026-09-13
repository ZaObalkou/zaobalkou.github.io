/* Optional: a Google Books API key restricted to the Books API and your site origin.
   Never put service-account credentials or private tokens here. */
window.MZR_CONFIG = {
  googleBooksApiKey: '',
  // Source-checked saved ratings; the UI labels snapshots separately from live data.
  goodreadsRatingsUrl: 'goodreads-ratings.json?v=20260913-2',
  // Public ISBN resolver; no reader account or library contents are transmitted.
  goodreadsResolverUrl: 'https://zaobalkou-catalogue.kikinth.chatgpt.site/api/goodreads'
};

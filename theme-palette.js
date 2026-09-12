(function () {
  'use strict';

  var STORAGE_KEY = 'mzr_palette';
  var options = [
    { id: 'peach', label: 'Broskvová' },
    { id: 'lavender', label: 'Levandulová' },
    { id: 'sage', label: 'Šalvějová' },
    { id: 'rose', label: 'Růžová' },
    { id: 'sky', label: 'Nebeská' }
  ];
  var current = 'peach';
  var mounted = false;
  var host, trigger, panel, status;

  function getOption(id) {
    return options.find(function (option) { return option.id === id; });
  }

  function refreshControls() {
    if (!trigger) return;
    trigger.setAttribute('aria-label', 'Barvy stránky, aktuálně ' + getOption(current).label.toLowerCase());
    panel.querySelectorAll('[data-palette-option]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.paletteOption === current));
    });
  }

  function setPalette(id, persist) {
    var option = getOption(id);
    if (!option) return false;
    current = id;
    if (document.body) document.body.dataset.palette = id;
    if (persist !== false) {
      try { localStorage.setItem(STORAGE_KEY, id); } catch (_) { /* The selected colour still works for this visit. */ }
    }
    refreshControls();
    if (status) status.textContent = 'Vybraná barva: ' + option.label.toLowerCase() + '.';
    window.dispatchEvent(new CustomEvent('zaobalkou:palettechange', { detail: { palette: id } }));
    return true;
  }

  function close(restoreFocus) {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }

  function open() {
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    panel.querySelector('[data-palette-option="' + current + '"]').focus();
  }

  function init() {
    if (mounted || !document.body) return;
    var themeButton = document.getElementById('themeBtn');
    if (!themeButton) return;
    mounted = true;

    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) { /* Use the default when storage is unavailable. */ }
    if (getOption(saved)) current = saved;
    document.body.dataset.palette = current;

    host = document.createElement('div');
    host.className = 'palette-picker';
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = 'paletteBtn';
    trigger.className = 'nav-btn icon-btn palette-toggle';
    trigger.title = 'Změnit barvy stránky';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', 'palettePanel');
    trigger.innerHTML = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1.3a2.2 2.2 0 0 0 1.5-3.8 1.5 1.5 0 0 1 1-2.6H18A3 3 0 0 0 21 12a9 9 0 0 0-9-9Z"/><circle cx="7.4" cy="10" r=".65" fill="currentColor"/><circle cx="10.5" cy="6.9" r=".65" fill="currentColor"/><circle cx="15" cy="7.6" r=".65" fill="currentColor"/><circle cx="6.9" cy="14.6" r=".65" fill="currentColor"/></svg>';

    panel = document.createElement('div');
    panel.id = 'palettePanel';
    panel.className = 'palette-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'paletteTitle');
    panel.innerHTML = '<div class="palette-panel-head"><h2 id="paletteTitle">Barvy stránky</h2><button type="button" class="palette-close" aria-label="Zavřít výběr barev"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div class="palette-options" role="group" aria-label="Pastelové barvy">' + options.map(function (option) {
      return '<button type="button" class="palette-choice" data-palette-option="' + option.id + '" aria-pressed="false"><span class="palette-swatch" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg></span><span>' + option.label + '</span></button>';
    }).join('') + '</div><p class="palette-help">Ladí se světlým i tmavým režimem.</p><span class="palette-sr-only" role="status" aria-live="polite" aria-atomic="true"></span>';
    status = panel.querySelector('[role="status"]');
    host.append(trigger, panel);
    themeButton.insertAdjacentElement('afterend', host);

    var libraryButton = document.querySelector('.hdr-in .nav-lib');
    if (libraryButton) {
      // The narrow header shows the bookmark and count; its name stays available to assistive technology.
      if (!libraryButton.hasAttribute('aria-label')) libraryButton.setAttribute('aria-label', 'Knihovna');
      if (!libraryButton.hasAttribute('title')) libraryButton.title = 'Knihovna';
    }
    refreshControls();

    trigger.addEventListener('click', function () {
      if (panel.hidden) open(); else close(false);
    });
    panel.querySelector('.palette-close').addEventListener('click', function () { close(true); });
    panel.addEventListener('click', function (event) {
      var button = event.target.closest('[data-palette-option]');
      if (button && panel.contains(button)) setPalette(button.dataset.paletteOption);
    });
    host.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    });
    document.addEventListener('pointerdown', function (event) {
      if (!host.contains(event.target)) close(false);
    });
    document.addEventListener('focusin', function (event) {
      if (!host.contains(event.target)) close(false);
    });
    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) setPalette(getOption(event.newValue) ? event.newValue : 'peach', false);
    });
  }

  window.ThemePalette = Object.freeze({ init: init, set: setPalette });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());

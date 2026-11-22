/* Home-screen web app helpers: offline-ready notice + iOS share-sheet export. */
(function () {
  'use strict';

  // ---------- 1. service worker + "ready offline" notice ----------
  function notice(text) {
    try {
      var d = document.createElement('div');
      d.textContent = text;
      d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));transform:translateX(-50%);' +
        'background:rgba(30,35,50,.94);color:#fff;padding:10px 18px;border-radius:999px;font:600 15px/1.4 system-ui,sans-serif;' +
        'z-index:2147483647;box-shadow:0 4px 18px rgba(0,0,0,.35);direction:rtl;max-width:90vw;text-align:center';
      document.body.appendChild(d);
      setTimeout(function () { try { d.remove(); } catch (e) {} }, 5000);
    } catch (e) {}
  }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      var firstInstall = !navigator.serviceWorker.controller;
      var announced = false;
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        function watch(w) {
          if (!w) return;
          w.addEventListener('statechange', function () {
            if (w.state === 'activated' && firstInstall && !announced) {
              announced = true;
              notice('✓ جاهز للعمل بدون إنترنت');
            }
          });
        }
        watch(reg.installing);
        reg.addEventListener('updatefound', function () { watch(reg.installing); });
      })['catch'](function () {});
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    });
  }

  // ---------- 2. iOS/iPadOS: send exported files to the share sheet ----------
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  function exportFile(win, a, nativeClick) {
    var name = a.getAttribute('download') || 'download';
    win.fetch(a.href).then(function (r) { return r.blob(); }).then(function (b) {
      var file = new win.File([b], name, { type: b.type || 'application/octet-stream' });
      var nav = navigator;
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        return nav.share({ files: [file], title: name })['catch'](function (e) {
          if (e && e.name === 'AbortError') return;      // user closed the sheet
          nativeClick();                                  // fall back to a normal download
        });
      }
      nativeClick();
    })['catch'](function () { nativeClick(); });
  }

  function isDownload(a) {
    return !!(a && a.hasAttribute && a.hasAttribute('download') && /^(blob:|data:)/.test(a.href || ''));
  }

  function patch(win) {
    try {
      var AP = win.HTMLAnchorElement && win.HTMLAnchorElement.prototype;
      if (!AP || AP.__pwaPatched) return;
      AP.__pwaPatched = true;
      var origClick = AP.click;
      AP.click = function () {
        var a = this;
        if (isDownload(a)) {
          exportFile(win, a, function () { origClick.call(a); });
          return;
        }
        return origClick.apply(a, arguments);
      };
      win.document.addEventListener('click', function (e) {
        var t = e.target;
        var a = t && t.closest ? t.closest('a') : null;
        if (isDownload(a)) {
          e.preventDefault();
          exportFile(win, a, function () { origClick.call(a); });
        }
      }, true);
    } catch (e) { /* cross-origin frame */ }
  }

  function hook(f) {
    if (f.__pwaHooked) return;
    f.__pwaHooked = true;
    f.addEventListener('load', function () { try { patch(f.contentWindow); } catch (e) {} });
    try { if (f.contentDocument && f.contentDocument.readyState === 'complete') patch(f.contentWindow); } catch (e) {}
  }

  patch(window);
  function hookAll() { Array.prototype.forEach.call(document.querySelectorAll('iframe'), hook); }
  function start() {
    hookAll();
    try { new MutationObserver(hookAll).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

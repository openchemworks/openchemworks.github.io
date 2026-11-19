(function () {
  'use strict';
  try {
    var KEY = 'ocw-consent';
    var ZONES = ['Atlantic/Reykjavik', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Faroe'];

    function stored() {
      try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function store(v) {
      try { window.localStorage.setItem(KEY, v); } catch (e) {}
    }
    function inRegion() {
      try {
        var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        return tz.indexOf('Europe/') === 0 || ZONES.indexOf(tz) !== -1;
      } catch (e) { return false; }
    }

    if (stored() || !inRegion()) { return; }

    function build() {
      try {
        if (!document.body || document.getElementById('ocw-consent-banner')) { return; }
        var NAVY = '#0C2340', ORANGE = '#E8792B';
        var box = document.createElement('div');
        box.id = 'ocw-consent-banner';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-label', 'Analytics cookies');
        box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;max-width:560px;margin:0 auto;' +
          'background:#fff;color:' + NAVY + ';border:1px solid #E4EAF1;border-radius:10px;' +
          'box-shadow:0 6px 24px rgba(12,35,64,.18);padding:14px 16px;font:14px/1.45 Lato,Arial,sans-serif;' +
          'z-index:2147483000;box-sizing:border-box;';

        var p = document.createElement('p');
        p.style.cssText = 'margin:0 0 10px;font-size:14px;';
        p.appendChild(document.createTextNode('We use analytics cookies to see which pages are useful. OK to allow them? '));
        var a = document.createElement('a');
        a.href = '/privacy';
        a.textContent = 'Privacy';
        a.style.cssText = 'color:' + NAVY + ';text-decoration:underline;';
        p.appendChild(a);
        box.appendChild(p);

        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

        function btn(label, bg, fg, border) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = label;
          b.style.cssText = 'font:600 14px/1 Lato,Arial,sans-serif;padding:10px 16px;border-radius:6px;cursor:pointer;' +
            'background:' + bg + ';color:' + fg + ';border:1px solid ' + border + ';';
          return b;
        }
        var allow = btn('Allow', ORANGE, '#fff', ORANGE);
        var deny = btn('No thanks', '#fff', NAVY, NAVY);

        function close() {
          try { if (box.parentNode) { box.parentNode.removeChild(box); } } catch (e) {}
        }
        allow.addEventListener('click', function () {
          try {
            store('granted');
            if (typeof window.gtag === 'function') {
              window.gtag('consent', 'update', { analytics_storage: 'granted' });
            }
          } catch (e) {}
          close();
        });
        deny.addEventListener('click', function () {
          store('denied');
          close();
        });

        row.appendChild(allow);
        row.appendChild(deny);
        box.appendChild(row);
        document.body.appendChild(box);
      } catch (e) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', build);
    } else {
      build();
    }
  } catch (e) {}
})();

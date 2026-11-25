(function () {
  'use strict';

  var UTM_KEY = 'ocw-utm';

  // Reads utm_* from the URL, keeps them for the visit (sessionStorage), returns them.
  function loadUtm() {
    var out = {};
    try {
      var q = new URLSearchParams(window.location.search);
      var fromUrl = {};
      ['source', 'medium', 'campaign'].forEach(function (k) {
        var v = q.get('utm_' + k);
        if (v) { fromUrl[k] = v.slice(0, 100); }
      });
      if (Object.keys(fromUrl).length) {
        try { window.sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl)); } catch (e) {}
        return fromUrl;
      }
      try {
        var saved = JSON.parse(window.sessionStorage.getItem(UTM_KEY) || 'null');
        if (saved && typeof saved === 'object') {
          ['source', 'medium', 'campaign'].forEach(function (k) {
            if (typeof saved[k] === 'string' && saved[k]) { out[k] = saved[k]; }
          });
        }
      } catch (e) {}
    } catch (e) {}
    return out;
  }

  var utm = loadUtm();

  // Buyer group for this page. Keep in step with "Buyer groups and sorting rules"
  // in the OpenChemWorks Growth Lab doc. First match wins.
  function pageGroup(path) {
    var p = String(path || '').toLowerCase();
    var rules = [
      ['cdmo', /contract-manufacturers|analyzer-vs-send-out|method-development/],
      ['bioprocess', /cell-culture|spent-media|fermentation|cell-and-gene|cultivated-meat|cell-free|bioreactor|ammonia-cell|^\/notes|peptones|ammonia-glutamine|depletion-atlas|\/analytes\/ammonia/],
      ['supplement_food', /supplement|creatine|sports-nutrition|protein-powders|protein-bars|protein-drink|verify-bcaa|food|sauces|seasoning|pet-food|animal-feed|plant-based|wine|hydrolysates|label|collagen|homemade|nitrogen-math|medical-nutrition|plasma/],
      ['lab_shoppers', /^\/$|^\/index|^\/services\/?$|^\/services\/(amino-acid-analysis|total-amino-acid-analysis|accq-tag|overnight|sample-submission)|^\/pricing|^\/quote|^\/about|choosing-an-amino-acid-analysis|price-index|amino-acid-analysis-cost|amino-acid-testing-cost|accredited-amino-acid|how-much-sample|^\/(insights|applications|jobs|tools)\/?$/],
      ['method_learners', /^\/methods|choosing-an-amino-acid-method|hydrolysis-losses|reading-a-lab-report|unit-converter/],
      ['curiosity', /^\/analytes|nitrogen-conversion|protein-quality|essential-amino|free-glutamate|free-vs-total|what-does-an-amino-acid-panel/]
    ];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][1].test(p)) { return rules[i][0]; }
    }
    return 'other';
  }

  var group = pageGroup(window.location.pathname);

  // Optional experiment tag: <meta name="ocw-exp" content="E2">
  var exp = '';
  try {
    var expMeta = document.querySelector('meta[name="ocw-exp"]');
    if (expMeta) { exp = String(expMeta.getAttribute('content') || '').slice(0, 40); }
  } catch (e) {}

  // Sends a GA4 event only when gtag is available. Never throws.
  function send(name, params) {
    try {
      if (typeof window.gtag === 'function') {
        params = params || {};
        params.page_group = group;
        if (exp) { params.exp = exp; }
        for (var k in utm) {
          if (Object.prototype.hasOwnProperty.call(utm, k)) { params[k] = utm[k]; }
        }
        window.gtag('event', name, params);
      }
    } catch (e) {}
  }

  // Tags the page view itself with the group, so GA4 can report sessions by group.
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('set', { page_group: group });
    }
  } catch (e) {}

  function closestEl(node, selector) {
    try {
      var el = node && node.nodeType === 1 ? node : node && node.parentElement;
      return el && el.closest ? el.closest(selector) : null;
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('click', function (ev) {
    try {
      var target = ev.target;
      var params = { page_path: window.location.pathname };
      var link;

      link = closestEl(target, 'a[href*="/pricing#order"], a[href*="?add="]');
      if (link) {
        params.link_url = link.getAttribute('href');
        send('order_samples_click', params);
      }

      link = closestEl(target, 'a[href="/quote"]');
      if (link) {
        params.link_url = link.getAttribute('href');
        send('quote_click', params);
      }

      link = closestEl(target, 'a[href^="mailto:"]');
      if (link) {
        params.link_url = link.getAttribute('href');
        send('email_click', params);
      }

      link = closestEl(target, 'a[href^="tel:"]');
      if (link) {
        params.link_url = link.getAttribute('href');
        send('phone_click', params);
      }

      link = closestEl(target, 'a[href$=".pdf"]');
      if (link) {
        params.link_url = link.getAttribute('href');
        send('report_pdf_click', params);
      }

      link = closestEl(target, 'a[href$=".xlsx"]');
      if (link) {
        params.link_url = link.getAttribute('href');
        send('sample_sheet_download', params);
      }

      // "Book these samples" in the order builder: the strongest signal before a booking.
      if (closestEl(target, '.ob-go')) {
        send('booking_intent', { page_path: window.location.pathname });
      }
    } catch (e) {}
  }, true);

  document.addEventListener('submit', function (ev) {
    try {
      if (closestEl(ev.target, '#order form') || closestEl(ev.target, '#order') || closestEl(ev.target, '[data-ob] form')) {
        var purpose = '';
        try {
          var sel = ev.target.querySelector('[name="purpose"]');
          if (sel) { purpose = String(sel.value || '').slice(0, 60); }
        } catch (e) {}
        send('booking_submit', { page_path: window.location.pathname, purpose: purpose });
      } else if (closestEl(ev.target, '.capture-form')) {
        send('lead_capture_submit', {
          page_path: window.location.pathname,
          segment: String(ev.target.getAttribute('data-segment') || '').slice(0, 60)
        });
      }
    } catch (e) {}
  }, true);
})();

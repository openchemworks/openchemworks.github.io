(function () {
  'use strict';

  // Sends a GA4 event only when gtag is available. Never throws.
  function send(name, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
      }
    } catch (e) {}
  }

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
    } catch (e) {}
  }, true);

  document.addEventListener('submit', function (ev) {
    try {
      if (closestEl(ev.target, '#order form') || closestEl(ev.target, '#order')) {
        send('booking_submit', { page_path: window.location.pathname });
      }
    } catch (e) {}
  }, true);
})();

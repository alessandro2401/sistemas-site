(() => {
  const selectors = [
    '[data-manus]',
    '[id*="manus-badge"]',
    '[id*="manus-widget"]',
    '[class*="manus-badge"]',
    '[class*="manus-widget"]',
    '[class*="manus-branding"]',
    'a[href*="manus.im"]',
  ];

  function removeBadge() {
    selectors.forEach((selector) => {
      try {
        document.querySelectorAll(selector).forEach((element) => {
          const tag = element.tagName?.toLowerCase();
          if (!['style', 'script', 'link', 'head', 'body', 'html', 'meta'].includes(tag)) element.remove();
        });
      } catch (_) {
        // Ignore malformed third-party nodes; never interrupt page rendering.
      }
    });
  }

  if (window.MutationObserver) {
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) removeBadge();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeBadge);
  else removeBadge();
  window.addEventListener('load', () => {
    window.setTimeout(removeBadge, 500);
    window.setTimeout(removeBadge, 2000);
  });
})();

(function () {
  var STORAGE_KEY = 'opendental-directory-theme';
  var root = document.documentElement;
  var params = new URLSearchParams(window.location.search);
  if (params.get('preview-shell') === '1') {
    root.classList.add('is-preview-shell');
  }

  var theme = '';
  try {
    theme = localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) { /* storage unavailable */ }

  if (theme !== 'light' && theme !== 'dark') {
    theme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }

  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#0E141A' : '#f4efe8');
  }
})();

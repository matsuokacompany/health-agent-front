(function initializeTheme() {
  try {
    var stored = window.localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = stored || (prefersDark ? 'dark' : 'light');
  } catch (_) {
    document.documentElement.dataset.theme = 'light';
  }
})();

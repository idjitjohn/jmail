(function () {
  try {
    var t = localStorage.getItem('jmail-theme') || 'system'
    var r = t === 'system'
      ? window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'
      : t
    document.documentElement.setAttribute('data-theme', r)
  } catch (e) {}
})()

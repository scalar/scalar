/* Fathom Analytics */
function addFathomAnalytics() {
  const t = document.createElement('script')
  ;(t.src = 'https://cdn.usefathom.com/script.js'),
    t.setAttribute('data-spa', 'auto'),
    t.setAttribute('data-site', 'RSYAEMNM'),
    (t.defer = !0),
    document.head.appendChild(t)
}
'loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', addFathomAnalytics)
  : addFathomAnalytics()

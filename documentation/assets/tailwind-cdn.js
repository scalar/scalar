const script = document.createElement('script')
;(script.src = 'https:\/\/cdn.jsdelivr.net\/npm\/@tailwindcss\/browser@4'),
  (script.onload = () => {
    console.log('Tailwind CSS script loaded successfully')
  }),
  (script.onerror = () => {
    console.error('Failed to load Tailwind CSS script')
  }),
  document.head.appendChild(script)
function addFathomAnalytics() {
  const t = document.createElement('script')
  ;(t.src = 'https:\/\/cdn.usefathom.com\/script.js'),
    t.setAttribute('data-spa', 'auto'),
    t.setAttribute('data-site', 'RSYAEMNM'),
    (t.defer = !0),
    document.head.appendChild(t)
}
'loading' === document.readyState
  ? document.addEventListener('DOMContentLoaded', addFathomAnalytics)
  : addFathomAnalytics()
function addLandingScript() {
  const t = document.createElement('script')
  ;(t.src = '\/landing.js'), (t.defer = !0), document.head.appendChild(t)
}
'loading' === document.readyState ? document.addEventListener('DOMContentLoaded', addLandingScript) : addLandingScript()

/**
 * Restores the "Powered by Scalar" badge in the sidebar footer.
 *
 * The platform hides the badge on scalar.com, but we want to keep flying the
 * flag on our own site. The sidebar still renders the empty slot next to the
 * theme toggle, so we fill that slot rather than building our own row, which
 * keeps the spacing and colours identical to the platform's own badge.
 */
;(() => {
  const HREF = 'https://www.scalar.com'
  const LABEL = 'Powered by Scalar'
  const MARKER = 'poweredByScalar'

  /** Fill every sidebar footer slot that does not already carry the badge. */
  const inject = () => {
    for (const toggle of document.querySelectorAll('aside [class*="group/toggle"]')) {
      const slot = toggle.parentElement?.firstElementChild

      // Bail out when the row is shaped differently than expected, so a
      // platform change degrades to "no badge" instead of a broken sidebar.
      if (!slot || slot === toggle) {
        continue
      }

      // Leave it alone if the platform already renders the badge itself,
      // otherwise we would end up showing it twice.
      if (slot.querySelector('[data-powered-by-scalar]') || /powered by/i.test(slot.textContent || '')) {
        continue
      }

      const link = document.createElement('a')
      link.className = 'no-underline hover:underline'
      link.href = HREF
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.dataset[MARKER] = ''
      link.textContent = LABEL
      slot.appendChild(link)
    }
  }

  // The sidebar is re-rendered on client-side navigation, so keep watching.
  // Work is coalesced into a single frame because the observer also sees our
  // own insertion.
  let queued = false
  const schedule = () => {
    if (queued) {
      return
    }
    queued = true
    requestAnimationFrame(() => {
      queued = false
      inject()
    })
  }

  const start = () => {
    inject()
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start)
  } else {
    start()
  }
})()

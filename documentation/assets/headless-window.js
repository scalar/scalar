/**
 * The centre of the hosting scene on the home page: an arched window onto two hands holding up a glowing globe
 * with the Scalar mark on it, and Docs, MCP and SDKs as tags set on its edge.
 *
 * landing.js runs the scene's flow (the lines, the packets, the chips). Its hub here carries data-lp-hold, so when a
 * packet from Your API lands on the window the flow asks this file what to wait for (an lp-flow-hold event) before it
 * sends packets on to everything on the right. The answer is the tags: each one loads, then shows a check, one after
 * another, and the packets go out once the last check is in. The tags go back to rest before the next round. As the
 * packet lands, the globe flares up (a window with a [data-hl-flare] light in it; the enterprise page's has none).
 *
 * The window itself is painted by headless-hero.js, which binds the meadow root inside it (data-hl-mode="window") and
 * paints it once for each theme and size; until then, and without WebGL, the window shows the sky's gradient in CSS.
 *
 * Pages on scalar.com render on the client and hydrate over the first copy of the page, so binding goes through a
 * MutationObserver with a dataset flag: a node replaced by hydration comes back unbound and binds again.
 */
;(() => {
  // the docs run a route's scripts again on every visit; the first run watches the page for good
  if (window.__scalarHeadlessWindow) {
    return
  }
  window.__scalarHeadlessWindow = true

  /* The tags' timing, in milliseconds: one starts loading every STEP, loads for LOAD, then checks; the packets go
     out SETTLE after the last check, and the checks stay for REST before the tags go back to rest. A round of the
     flow is 5.2 s, so all of it fits in one. */
  const TIMING = { STEP: 240, LOAD: 560, SETTLE: 220, REST: 1900 }

  let holding = []
  /* What letting go of the bound hub does: until a hub is bound, and once it has been let go, nothing. */
  const unbound = () => {
    // nothing is bound
  }
  let release = unbound

  const bind = () => {
    const hub = document.querySelector('[data-hl-hub]')
    if (!hub || hub.dataset.hlBound === 'true') {
      return
    }
    const node = hub.closest('[data-lp-node="hub"]')
    if (!node) {
      return
    }
    hub.dataset.hlBound = 'true'
    const tags = [...hub.querySelectorAll('[data-hl-tag]')]
    const flare = hub.querySelector('[data-hl-flare]')

    /* The globe's flare: up to white in a moment as the packet goes in, held a little, then settling back into its
       glow, and the painting's hands lean out from it as it flares and back as it settles (root.hlPushAt, the
       composition's `push` in headless-hero.js). With reduced motion it is a softer, shorter brightening that does
       not grow, and the hands stay still. */
    const shine = () => {
      if (!flare || typeof flare.animate !== 'function') {
        return
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const art = hub.querySelector('[data-hl-hero]')
      if (art && !reduced) {
        art.hlPushAt = performance.now()
      }
      for (const animation of flare.getAnimations()) {
        animation.cancel()
      }
      flare.animate(
        reduced
          ? [{ opacity: 0 }, { opacity: 0.6, offset: 0.25 }, { opacity: 0 }]
          : [
              { opacity: 0, transform: 'scale(0.6)' },
              { opacity: 1, transform: 'scale(1)', offset: 0.08 },
              { opacity: 0.95, transform: 'scale(1.08)', offset: 0.32 },
              { opacity: 0, transform: 'scale(1.12)' },
            ],
        { duration: reduced ? 900 : 2600, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
      )
    }

    /* Every timer goes through `later`, so letting go clears them all. */
    const timers = new Set()
    const later = (ms, fn) => {
      const id = setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    }
    const rest = () => {
      for (const tag of tags) {
        tag.dataset.state = 'rest'
      }
    }
    const onHold = (event) => {
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
      rest()
      shine()
      const last = tags.length - 1
      const done = new Promise((resolve) => {
        tags.forEach((tag, index) => {
          later(index * TIMING.STEP, () => {
            tag.dataset.state = 'loading'
          })
          later(index * TIMING.STEP + TIMING.LOAD, () => {
            tag.dataset.state = 'done'
            if (index === last) {
              later(TIMING.SETTLE, resolve)
            }
          })
        })
        if (last < 0) {
          resolve()
        }
      })
      event.detail?.wait?.(done)
      later(last * TIMING.STEP + TIMING.LOAD + TIMING.SETTLE + TIMING.REST, rest)
    }
    node.addEventListener('lp-flow-hold', onHold)
    rest()

    holding = [hub]
    release = () => {
      release = unbound
      holding = []
      timers.forEach((id) => clearTimeout(id))
      timers.clear()
      node.removeEventListener('lp-flow-hold', onHold)
      delete hub.dataset.hlBound
    }
  }

  const check = () => {
    if (holding.some((held) => !held.isConnected)) {
      release()
    }
    bind()
  }
  check()
  new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length || record.removedNodes.length)) {
      check()
    }
  }).observe(document.documentElement, { childList: true, subtree: true })
})()

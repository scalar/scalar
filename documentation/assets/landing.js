/* Debounce helper */
function debounce(func, timeout = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

/* What a page's animations bound outside their own markup: the document
   and window listeners, and the observers, that would otherwise outlive
   the page they were bound for. The site is a single-page app, so every
   initialiser below runs again on every page change and binds again
   against fresh markup; with nothing to let the old bindings go, the
   document keeps one more of each per page view, each holding on to the
   page it closed over, and a stale handler can still wake a scene that
   is no longer on the page. Each block hands in the element it lives on
   and the undo for what it bound.

   The flows keep a map of their own further down, because theirs has to
   be read on visibilitychange as well as on a page change. */
const landingReleases = new Map()
const holdLanding = (element, release) => {
  landingReleases.set(element, release)
}
const sweepLanding = () => {
  landingReleases.forEach((release, element) => {
    if (!element.isConnected) {
      landingReleases.delete(element)
      release()
    }
  })
}

/* The butterflies crossing the enterprise page's figures.
 *
 * They are the meadow's own, the heroes' butterflies, which
 * headless-hero.js draws into a band laid over the three cards (its
 * "flight" composition), and they only cross while the band is on
 * screen — there is no sense in it crossing where nobody is looking.
 * Each card turns over as the first of the butterflies reaches it: the
 * watcher below follows where that butterfly actually is (the band's
 * hlLead) rather than running the turns off a timer, so it is the
 * butterflies that flip them and not a coincidence of timing.
 *
 * The cards are face up until a crossing is on its way to them. A card
 * whose number has not been on the screen yet is turned face down as a
 * crossing comes for it, and that crossing turns it up again; a number
 * that has been on the screen is never hidden, and a crossing spins it
 * from the number back to the number. So a reader who reaches the
 * cards between crossings, or while the page is loading, sees the
 * numbers at once and never sees them taken away.
 */
/** how long a card takes to turn over and settle */
const ENT_SPIN_MS = 1500
/** how far left of a card the first butterfly has to be before it counts again */
const ENT_REARM = 40

const initEnterpriseSky = debounce(() => {
  ;[...document.querySelectorAll('.ent-sky')]
    .filter((sky) => sky.dataset.entSkyBound !== 'true')
    .forEach((sky) => {
      sky.dataset.entSkyBound = 'true'
      const flight = sky.querySelector('.ent-flight')
      const cards = [...sky.querySelectorAll('.ent-figure')]
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      let watching = 0

      /* Four turns, landing face up: from the blank side if that is
         what is showing, and otherwise from the number. */
      const turn = (card) => {
        const flip = card.querySelector('.ent-flip')
        const from = card.classList.contains('is-armed') && card.dataset.entLanded !== 'true' ? 180 : 0
        card.entTurn?.cancel()
        card.entTurn = flip.animate([{ transform: `rotateY(${from}deg)` }, { transform: 'rotateY(1440deg)' }], {
          duration: ENT_SPIN_MS,
          easing: 'cubic-bezier(0.16, 0.84, 0.3, 1)',
          fill: 'forwards',
        })
        card.dataset.entLanded = 'true'
      }

      /* The cards are face up in the stylesheet, so that a page with no
         script shows the numbers rather than three blanks, and they stay
         so until the butterflies are flying: wherever they cannot fly
         (no WebGL to draw them with), or should not (where motion is
         unwanted), the numbers simply show. */
      const flying = () =>
        !!flight &&
        flight.dataset.hlReady === 'true' &&
        flight.dataset.hlFallback !== 'true' &&
        typeof flight.hlLead === 'function' &&
        !reduceMotion.matches

      // A card turns as the first butterfly reaches its middle, and is
      // ready to turn again once they are back behind it on the next
      // pass. One whose number nobody has seen yet waits face down for
      // a crossing that is on its way to it.
      const watch = () => {
        watching = 0
        const live = flying()
        const lead = live ? flight.hlLead() : Number.NEGATIVE_INFINITY
        const head = live ? flight.getBoundingClientRect().left + lead : lead
        cards.forEach((card) => {
          const r = card.getBoundingClientRect()
          const armed = card.classList.contains('is-armed')
          const landed = card.dataset.entLanded === 'true'
          // a number that has been on the screen has been seen
          const seen = card.dataset.entSeen === 'true'
          if (!seen && !armed && r.bottom > 0 && r.top < window.innerHeight) {
            card.dataset.entSeen = 'true'
          }
          // (written only when it changes, as this runs every frame)
          const rearm = () => {
            if (card.dataset.entPassed === 'true') {
              card.dataset.entPassed = 'false'
            }
          }
          if (!Number.isFinite(head)) {
            // between crossings, or with no butterflies at all: a card
            // still face down (if the band gave up before the crossing
            // reached it) shows its number again
            if (armed && !landed) {
              card.classList.remove('is-armed')
            }
            rearm()
          } else if (head >= r.left + r.width / 2) {
            if (card.dataset.entPassed !== 'true') {
              card.dataset.entPassed = 'true'
              turn(card)
            }
          } else {
            if (!armed && !landed && card.dataset.entSeen !== 'true') {
              card.classList.add('is-armed')
            }
            if (head < r.left - ENT_REARM) {
              rearm()
            }
          }
        })
        if (sky.classList.contains('is-flying')) {
          watching = requestAnimationFrame(watch)
        }
      }

      // watched while any of the band is on the screen, since that is
      // when the butterflies cross
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            sky.classList.toggle('is-flying', entry.isIntersecting)
            if (entry.isIntersecting) {
              sky.classList.add('is-seen')
              if (!watching && !reduceMotion.matches) {
                watching = requestAnimationFrame(watch)
              }
            }
          })
        },
        { threshold: 0 },
      ).observe(flight || sky)
    })
})

/* The customer logo sliders (the home page's hero, the enterprise
   page's) run only while they are on screen. */
const initTrustedWalls = debounce(() => {
  ;[...document.querySelectorAll('.lp-trusted')]
    .filter((wall) => wall.dataset.lpTrustedBound !== 'true')
    .forEach((wall) => {
      wall.dataset.lpTrustedBound = 'true'
      const watch = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => wall.classList.toggle('is-off', !entry.isIntersecting))
        },
        { threshold: 0 },
      )
      watch.observe(wall)
      holdLanding(wall, () => watch.disconnect())
    })
})

/* The meadow under the footer. footer.html puts its marker in the band
   under the card on every page and styles.css holds its rules; the
   meadow itself is headless-hero.js, which a page with a meadow hero of
   its own loads in its head. Every other page brings it in from here,
   once: in the first idle time after the page has loaded, or as soon as
   the band comes within two screens, whichever is first. On a page of
   any length that is the idle time, while the reader is still near the
   top, so the download and the evaluation are long done before they
   scroll to the footer, and the meadow, which builds itself in idle time
   as it nears, is ready by the time they get there. Once it has run, the
   script watches the page for good and makes its root in whatever band
   the site renders as it moves between pages, so the one script is all
   there ever is. */
const FOOTER_MEADOW_SRC = '/headless-hero.js'
/* how near the band comes before the script is wanted at once */
const FOOTER_MEADOW_NEAR = '200% 0px'
/* the longest a busy page holds it back, and the wait that stands in
   for an idle time where there is no idle callback (Safari) */
const FOOTER_MEADOW_IDLE = 4000
const FOOTER_MEADOW_LATE = 1500
let footerMeadowDone = false
let footerMeadowLoad = false
let footerMeadowIdle = 0
let footerMeadowBand = null
let footerMeadowNear = null
/* in already: it has run (and set its flag), or a page has it in its
   head for a hero and it is on its way */
const footerMeadowIn = () =>
  window.__scalarHeadlessHero === true || document.querySelector('script[src*="headless-hero.js"]') !== null
const footerMeadowStop = () => {
  footerMeadowDone = true
  footerMeadowNear?.disconnect()
  footerMeadowNear = null
  footerMeadowBand = null
}
const loadFooterMeadow = () => {
  if (footerMeadowDone) {
    return
  }
  // the site has moved on to a page without the footer: the next band asks again
  if (!document.querySelector('[data-hl-footer-meadow]')) {
    footerMeadowIdle = 0
    return
  }
  const there = footerMeadowIn()
  footerMeadowStop()
  if (there) {
    return
  }
  const script = document.createElement('script')
  script.src = FOOTER_MEADOW_SRC
  script.defer = true
  document.head.appendChild(script)
}
const initFooterMeadow = debounce(() => {
  if (footerMeadowDone) {
    return
  }
  if (footerMeadowIn()) {
    footerMeadowStop()
    return
  }
  // nothing is asked for while the page is loading: the band is not yet
  // where it will be, and the load has work enough of its own
  if (document.readyState !== 'complete') {
    if (!footerMeadowLoad) {
      footerMeadowLoad = true
      window.addEventListener('load', initFooterMeadow, { once: true })
    }
    return
  }
  // the band the engine would use, which the site may render anew as it
  // moves between pages: the watch moves with it
  const band = document.querySelector('[data-hl-footer-meadow]') ? document.querySelector('.docs-footer-band') : null
  if (band === footerMeadowBand) {
    return
  }
  footerMeadowNear?.disconnect()
  footerMeadowBand = band
  if (!band) {
    return
  }
  footerMeadowNear ??= new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadFooterMeadow()
      }
    },
    { rootMargin: FOOTER_MEADOW_NEAR },
  )
  footerMeadowNear.observe(band)
  if (!footerMeadowIdle) {
    footerMeadowIdle = window.requestIdleCallback
      ? window.requestIdleCallback(loadFooterMeadow, { timeout: FOOTER_MEADOW_IDLE })
      : window.setTimeout(loadFooterMeadow, FOOTER_MEADOW_LATE)
  }
})

/* The hosting scene's flow: packets travel the connectors from Your API
   to the Scalar hub and on to the agents that use it. Whatever a packet
   lands on pulses and its subtitle flips over to say what arrived, then
   flips back (after the motion on lightspark.com's capability pages).
   One round every few seconds while the scene is in view; nothing moves
   under reduced motion. */
/* A flow lists its edges (data-lp-edges="api>hub,hub>maya") and gets
   them drawn here from where the nodes land, so the lines hold whatever
   the layout does. Side by side (on wide screens) a line runs from the
   end of a chip's text to the next chip's tile, level with the middle of
   each; stacked (on phones) it runs from the bottom middle of one node
   to the top middle of the next. The chips have no box of their own, so
   the lines stop short of the words. */
const LINE_GAP = 8
const drawLandingFlowEdges = (flow) => {
  const keys = (flow.dataset.lpEdges || '').split(',').filter(Boolean)
  if (!keys.length) {
    return
  }
  let svg = flow.querySelector(':scope > .lp-flow-lines--drawn')
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'lp-flow-lines lp-flow-lines--drawn')
    svg.setAttribute('fill', 'none')
    flow.prepend(svg)
  }
  if (!svg.getClientRects().length) {
    return
  }
  const box = flow.getBoundingClientRect()
  const viewBox = `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`
  // every measurement first, then only the attributes that changed: a
  // resize observer firing with nothing moved writes nothing, and a real
  // resize lays out once
  const edges = []
  // where a chip's words end: the wider of its name and its subtitle
  const textEnd = (node) => {
    const spans = node.querySelectorAll('.lp-chip-label > span, .lp-chip-sub-face--main > span')
    return spans.length ? Math.max(...[...spans].map((span) => span.getBoundingClientRect().right)) : null
  }
  const f = (n) => n.toFixed(1)
  const sideways = getComputedStyle(flow).getPropertyValue('--lp-flow-dir').trim() === 'row'
  // a node may name the part of it the lines meet (the hosting scene's
  // window, inside the hub's box): a line runs a little way in under it,
  // so a packet goes in under the window's edge and comes out from under it
  const INSET = 12
  const anchorOf = (node) => node.querySelector('[data-lp-anchor]') ?? node
  keys.forEach((key) => {
    const [from, to] = key.split('>').map((name) => flow.querySelector(`[data-lp-node="${name}"]`))
    if (!from || !to) {
      return
    }
    // an end the layout hides (a chip dropped on phones) takes no line
    if (!from.getClientRects().length || !to.getClientRects().length) {
      edges.push({ key, hidden: true })
      return
    }
    const fromAnchor = anchorOf(from)
    const toAnchor = anchorOf(to)
    const a = fromAnchor.getBoundingClientRect()
    const b = toAnchor.getBoundingClientRect()
    let x0
    let y0
    let x1
    let y1
    let d
    if (sideways) {
      const tile = to.querySelector('.lp-chip-icon')
      x0 = fromAnchor === from ? (textEnd(from) ?? a.right) - box.left + LINE_GAP : a.right - box.left - INSET
      y0 = a.top + a.height / 2 - box.top
      x1 =
        toAnchor === to
          ? (tile ? tile.getBoundingClientRect().left : b.left) - box.left - LINE_GAP
          : b.left - box.left + INSET
      y1 = b.top + b.height / 2 - box.top
      const mid = (x0 + x1) / 2
      d =
        Math.abs(y1 - y0) < 0.5
          ? `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)}`
          : `M ${f(x0)} ${f(y0)} C ${f(mid)} ${f(y0)}, ${f(mid)} ${f(y1)}, ${f(x1)} ${f(y1)}`
    } else {
      x0 = a.left + a.width / 2 - box.left
      y0 = fromAnchor === from ? a.bottom - box.top + 6 : a.bottom - box.top - INSET
      x1 = b.left + b.width / 2 - box.left
      y1 = toAnchor === to ? b.top - box.top - 6 : b.top - box.top + INSET
      const mid = (y0 + y1) / 2
      d = `M ${f(x0)} ${f(y0)} C ${f(x0)} ${f(mid)}, ${f(x1)} ${f(mid)}, ${f(x1)} ${f(y1)}`
    }
    edges.push({ key, from, d })
  })
  if (svg.getAttribute('viewBox') !== viewBox) {
    svg.setAttribute('viewBox', viewBox)
  }
  edges.forEach(({ key, from, d, hidden }) => {
    let path = svg.querySelector(`[data-lp-edge="${key}"]`)
    // hidden rather than removed, so it is there again (revealed) when
    // the layout shows its end
    const shown = hidden ? 'none' : ''
    if (path && path.style.display !== shown) {
      path.style.display = shown
    }
    if (hidden) {
      return
    }
    if (!path) {
      path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('class', 'lp-flow-line')
      path.dataset.lpEdge = key
      path.dataset.reveal = 'line'
      path.setAttribute('pathLength', '1')
      // a line draws once what it leaves has faded in
      path.style.setProperty('--d', String((Number.parseFloat(from.style.getPropertyValue('--d')) || 0) + 200))
      svg.appendChild(path)
    }
    if (path.getAttribute('d') !== d) {
      path.setAttribute('d', d)
    }
  })
}

const createLandingFlowPlayer = (flow) => {
  const layers = [...flow.querySelectorAll(':scope > .lp-flow-lines')]
  // a lone layer is the one: asking which is laid out would wait on a layout every packet
  const layer = () => (layers.length === 1 ? layers[0] : layers.find((svg) => svg.getClientRects().length) || layers[0])
  const nodes = new Map()
  flow.querySelectorAll('[data-lp-node]').forEach((node) => nodes.set(node.dataset.lpNode, node))
  // the ends a packet can go to: the ones the layout shows
  const leaves = (product) =>
    [...nodes.values()]
      .filter((node) => node.dataset.lpParent === product && node.getClientRects().length)
      .map((node) => node.dataset.lpNode)
  if (!layers.length || !nodes.has('api') || !nodes.has('hub')) {
    return null
  }
  /* A hub can hold packets (data-lp-hold: the window on the home page and
     on /enterprise). Its own script shows what happens to a packet there:
     it answers an lp-flow-hold event with what to wait for, and once that
     is done packets go out to everything on the right at once; the round
     is longer for it. */
  const holds = nodes.get('hub').dataset.lpHold !== undefined
  let beatGen = 0

  const SPEED = 640 // scene units per second
  const PERIOD = holds ? 5200 : 3600
  const SVG_NS = 'http://www.w3.org/2000/svg'
  const timers = new Set()
  const packets = new Set()
  let frame = 0
  let running = false

  const after = (ms, fn) => {
    const id = setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }

  const FLIP_HOLD = 1700
  let version = 0

  /* Each chip's second face is made once and kept, hidden between flips,
     with its words in one text node changed in place; the packets below
     are kept the same way. Once the first round has made them, nothing is
     added to or taken from the page while the flow plays, so the page's
     watchers (which bind whatever a change adds) stay asleep and no
     layout is waited on for them. */
  const altFaces = new Map()
  const altFace = (sub) => {
    let alt = altFaces.get(sub)
    if (!alt) {
      const face = document.createElement('span')
      face.className = 'lp-chip-sub-face lp-chip-sub-face--alt'
      face.style.display = 'none'
      const words = document.createTextNode('')
      face.append(words)
      sub.appendChild(face)
      alt = { face, words, gen: 0 }
      altFaces.set(sub, alt)
    }
    return alt
  }

  /* the subtitle flips to the text (one of the chip's data-lp-flip
     options, {v} being this round's version), holds, and flips back */
  const flip = (key) => {
    const node = nodes.get(key)
    const sub = node?.querySelector('.lp-chip-sub')
    const texts = (node?.dataset.lpFlip || '').split('|').filter(Boolean)
    if (!sub || !texts.length) {
      return
    }
    const alt = altFace(sub)
    const gen = ++alt.gen
    /* A flip still going starts again from the top: the faces' animations
       have to end before they can start again, which takes a layout. From
       rest (rounds are further apart than a flip) a shown face starts its
       animation by itself and nothing is waited on. */
    if (sub.classList.contains('is-in') || sub.classList.contains('is-out')) {
      sub.classList.remove('is-in', 'is-out')
      alt.face.style.display = 'none'
      void sub.offsetWidth
    }
    alt.words.data = texts[Math.floor(Math.random() * texts.length)].replace('{v}', `v2.4.${version}`)
    alt.face.style.display = ''
    sub.classList.add('is-in')
    // a later flip of this chip owns it from here
    after(FLIP_HOLD, () => {
      if (alt.gen !== gen) {
        return
      }
      sub.classList.remove('is-in')
      sub.classList.add('is-out')
      after(560, () => {
        if (alt.gen !== gen) {
          return
        }
        alt.face.style.display = 'none'
        sub.classList.remove('is-out')
      })
    })
  }

  /* A dot that should have landed this long ago went without frames (the
     browser stopped painting), so it is dropped instead of arriving late
     and setting off the rest of its round alongside newer ones */
  const STALE = 1000

  /* Packets between trips, hidden, kept by the layer they were made in */
  const parked = new Map()
  const park = (packet) => {
    packet.el.style.display = 'none'
    parked.get(packet.svg)?.push(packet.el)
  }

  /* A line's length only changes with its shape, so it is measured once
     a shape: measuring waits on a layout whenever the page has changed
     since the last one, and a packet arriving has just moved the others */
  const lengths = new WeakMap()
  const lengthOf = (path) => {
    const d = path.getAttribute('d')
    const known = lengths.get(path)
    if (known && known.d === d) {
      return known.length
    }
    const length = path.getTotalLength()
    lengths.set(path, { d, length })
    return length
  }

  // every packet's point is read before any is written, so a frame
  // measures the paths once; arrivals (which may send more) come last
  const tick = () => {
    const now = performance.now()
    const steps = [...packets].map((packet) => {
      if (now - packet.start - packet.duration > STALE) {
        return { packet, stale: true }
      }
      const t = Math.min(1, (now - packet.start) / packet.duration)
      return { packet, t, point: packet.edge.path.getPointAtLength(t * packet.length) }
    })
    const arrived = []
    steps.forEach(({ packet, stale, t, point }) => {
      if (stale) {
        packets.delete(packet)
        park(packet)
        return
      }
      packet.el.setAttribute('cx', point.x)
      packet.el.setAttribute('cy', point.y)
      packet.el.style.opacity = Math.min(1, (now - packet.start) / 90)
      if (t >= 1) {
        packets.delete(packet)
        park(packet)
        arrived.push(packet)
      }
    })
    arrived.forEach((packet) => packet.onArrive())
    frame = packets.size ? requestAnimationFrame(tick) : 0
  }

  const send = (edgeKey, onArrive) => {
    const svg = layer()
    const path = svg?.querySelector(`[data-lp-edge="${edgeKey}"]`)
    if (!path) {
      return
    }
    // measured before anything is written
    const length = lengthOf(path)
    if (!parked.has(svg)) {
      parked.set(svg, [])
    }
    let el = parked.get(svg).pop()
    if (!el) {
      el = document.createElementNS(SVG_NS, 'circle')
      el.setAttribute('class', 'lp-packet')
      el.setAttribute('r', '4.5')
      svg.appendChild(el)
    } else {
      // a line drawn after it was made (an end the layout showed later) would cross it
      let next = el.nextElementSibling
      while (next?.classList.contains('lp-packet')) {
        next = next.nextElementSibling
      }
      if (next) {
        svg.appendChild(el)
      }
    }
    el.style.opacity = '0'
    el.style.display = ''
    packets.add({
      el,
      svg,
      edge: { path },
      length,
      start: performance.now(),
      duration: (length / SPEED) * 1000,
      onArrive,
    })
    if (!frame) {
      frame = requestAnimationFrame(tick)
    }
  }

  const pick = (list, count) => {
    const pool = [...list]
    const out = []
    while (pool.length && out.length < count) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
    }
    return out
  }

  /* from a node, on to one or two of the things under it */
  const fanOut = (from) => {
    const ends = leaves(from)
    pick(ends, ends.length > 2 ? 2 : 1).forEach((leaf, j) => {
      after(j * 110, () => {
        send(`${from}>${leaf}`, () => {
          flip(leaf)
        })
      })
    })
  }

  const round = () => {
    version = (version % 9) + 1
    flip('api')
    send('api>hub', () => {
      if (holds) {
        const gen = ++beatGen
        const waits = []
        nodes
          .get('hub')
          .dispatchEvent(new CustomEvent('lp-flow-hold', { detail: { wait: (promise) => waits.push(promise) } }))
        Promise.all(waits).then(
          () => {
            // stopped since, or a later round's packet already in: no burst from this one
            if (!running || gen !== beatGen) {
              return
            }
            leaves('hub').forEach((leaf) => {
              send(`hub>${leaf}`, () => {
                flip(leaf)
              })
            })
          },
          () => {},
        )
        return
      }
      fanOut('hub')
    })
    after(PERIOD, round)
  }

  const play = () => {
    if (running) {
      return
    }
    running = true
    after(400, round)
  }

  const stop = () => {
    running = false
    /* A hold still waited on would send a burst of its own after the
       pause: it settles while nothing is playing, and by the time it does
       the flow may be playing again, so its generation moves on without it. */
    beatGen += 1
    timers.forEach((id) => clearTimeout(id))
    timers.clear()
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    packets.forEach(park)
    packets.clear()
    altFaces.forEach((alt) => {
      alt.gen += 1
      alt.face.style.display = 'none'
    })
    flow.querySelectorAll('.lp-chip-sub').forEach((el) => el.classList.remove('is-in', 'is-out'))
  }

  return { play, stop }
}

/* Every animated flow and its sync, behind one visibilitychange listener.
   A flow that has left the page is released on the next page change. */
const landingFlowSyncs = new Map()
document.addEventListener('visibilitychange', () => {
  landingFlowSyncs.forEach((sync) => sync())
})

const initLandingFlow = debounce(() => {
  landingFlowSyncs.forEach((sync, flow) => {
    if (!flow.isConnected) {
      sync()
    }
  })

  const flows = [...document.querySelectorAll('.lp-flow')].filter((flow) => flow.dataset.lpFlowBound !== 'true')
  if (!flows.length) {
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  flows.forEach((flow) => {
    flow.dataset.lpFlowBound = 'true'
    // held out here so that letting the flow go lets this go with it
    let edges = null
    if (flow.dataset.lpEdges) {
      drawLandingFlowEdges(flow)
      edges = new ResizeObserver(() => drawLandingFlowEdges(flow))
      edges.observe(flow)
      // the anchors too: the hosting scene's window can change its size
      // after the hub box has, and the lines follow it
      flow.querySelectorAll('[data-lp-node], .lp-chip-body, [data-lp-anchor]').forEach((el) => edges.observe(el))
      document.fonts?.ready.then(() => drawLandingFlowEdges(flow))
    }
    if (reduceMotion) {
      return
    }

    const player = createLandingFlowPlayer(flow)
    if (!player) {
      return
    }

    /* Play only while the flow is on screen and the page is visible. A
       background tab keeps running the round timers but paints no frames,
       so without the visibility check every round would queue a dot that
       is released, together with all the others, on the way back. */
    let inView = false
    const sync = () => {
      if (!flow.isConnected) {
        player.stop()
        observer.disconnect()
        edges?.disconnect()
        landingFlowSyncs.delete(flow)
        return
      }
      if (inView && !document.hidden) {
        player.play()
      } else {
        player.stop()
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting
        })
        sync()
      },
      { threshold: 0.4 },
    )
    observer.observe(flow)
    landingFlowSyncs.set(flow, sync)
  })
})

/* The customers page's hero: every customer as a ball of its own.

   The marks from the grids below, each on a glass ball, tipped in over
   the fold one after another and left to heap up on a hairline floor.

   The balls are a small world with its own physics: gravity, the floor
   and the field's two edges, and the balls themselves, which collide
   and have enough grip on one another to hold a heap. A ball rolls the
   way a ball does, turning about the axle through it, so its mark turns
   with it; the paint under the mark is lit from the room and stays
   where it is. A pointer can pick one up and throw it, and the rest get
   out of its way. Once everything has come to rest the frame loop
   stops and the balls stay as they lie, their marks at whatever angle
   they rolled to. */
const CUST_STEP = 1 / 120
const CUST_GRAVITY = 2800
/* the speed a ball keeps off the floor, off an edge and off another
   ball, and the slowest meeting that still bounces at all */
const CUST_FLOOR_BOUNCE = 0.44
const CUST_WALL_BOUNCE = 0.45
const CUST_BALL_BOUNCE = 0.2
const CUST_REST = 22
/* How well each surface holds on to a ball, as a share of how hard the
   two are pressed together.

   This is where a ball becomes a ball. Friction works on the SLIP at
   the touch, how fast the stuff of the ball there is scrubbing over
   what it is touching, and spends itself on the ball's travel and on
   its spin at once. A sphere answers an impulse at its edge with 7/2
   of what its mass alone would give (1 from the mass, 5/2 from a
   sphere's own moment, 2/5 m r squared), so the impulse that takes a
   sliding contact to a rolling one is exactly 2/7 of the mass times
   the slip, and the other 5/7 goes into the turn. Neither fraction
   depends on the mass or the size. r over that moment is 2.5 / (m r),
   which is the only awkward number below. */
const CUST_FLOOR_GRIP = 0.45
const CUST_WALL_GRIP = 0.35
const CUST_BALL_GRIP = 0.5
/* the drag the air puts on a ball's travel and the trickle it takes
   off its spin (per second) */
const CUST_AIR = 0.08
const CUST_SPIN_AIR = 0.12
/* what a rolling ball gives up to the ground it rolls on, as a share
   of its weight, the fastest it may turn (about three and a half turns
   a second, past which a mark only strobes), and the load a ball
   resting on another carries, in weights */
const CUST_ROLL_RES = 0.14
const CUST_SPIN_MAX = 22
const CUST_LOAD = 2.5
/* a ball slower than this, turning slower than this, with something
   under it, is put down flat; after this many steps of that it stops
   being pulled on at all */
const CUST_NUMB_V = 12
const CUST_NUMB_W = 0.3
const CUST_CALM = 6
/* how far a ball and the skin of a ball may travel over a frame and
   still count as still, and for how many frames before the world
   sleeps */
const CUST_SLEEP = 0.3
const CUST_STILL = 24
/* how much of an overlap is eased out in one pass, the sliver left
   alone, and how many passes: the overlap is never fed back into the
   speeds, since that is what blows a heap into a line */
const CUST_FIRM = 0.45
const CUST_SLOP = 0.4
const CUST_PASSES = 6
/* the share of the field the balls are tipped into (they heap rather
   than line up), ms between one and the next, and how far over the top
   edge they start */
const CUST_BAND = 0.38
const CUST_DROP = 50
const CUST_FALL = 80
const CUST_GAP = 12
/* the fastest a throw can leave the hand, how much of the lever a
   flick puts into spin, and how quickly the floor rolls a ball that is
   being dragged along it */
const CUST_THROW = 2800
const CUST_FLICK = 0.35
const CUST_HAND_ROLL = 24
// how far into the glass along the top a ball counts as in it, past
// its lower edge, before the glass may go back to being plain air
const CUST_GLASS_GIVE = 6
/* A ball's mark, lying on its surface.

   A logo on a real ball is not a sticker on its front: it lies on the
   surface, so it narrows towards the rim and goes over the horizon as
   the ball turns. The mark is therefore cut into a grid of little
   four-cornered pieces, each one placed with its four corners exactly
   ON the sphere. That is the whole trick, and it is worth saying why:
   a tall flat strip hung at one longitude only touches the sphere
   along a circle as wide as the strip itself, so anything taller is
   describing a cylinder and juts out past the ball's own edge. Four
   corners on the sphere are always in one plane, the piece between
   them is inside the ball, and so nothing can ever cross the
   silhouette, whatever the ball does.

   Every piece shows its own slice of one picture, at one size for the
   whole mark, so the browser decodes and draws each mark once however
   many pieces there are; the piece's own matrix stretches its row to
   fit. Each piece is turned away on its back, so the far side of the
   ball never shows through the near side.

   The mark is repeated round the ball, the way a ball is branded, so
   whichever way one comes to rest a copy is facing you. */
/* how far above the floor we are looking at it from: the lean of the
   ball's axle out of the screen. The stylesheet turns the cage about
   this axle and takes it from here, so there is one number, not two
   that can drift apart */
const CUST_TILT = 52
const CUST_COPIES = 3
/* how far round the ball one copy of the mark reaches, in radii of
   arc, and how finely it is cut up: about 11 degrees across and 20
   down, which is fine enough that no edge of it reads as a straight
   line at these sizes */
const CUST_MARK = 1.3
const CUST_LON_STEP = (11 * Math.PI) / 180
const CUST_LAT_STEP = (20 * Math.PI) / 180
const CUST_BLEED = 0.7
const dressCustomerBall = (ball, size) => {
  const template = document.getElementById(`lp-icon-${ball.dataset.icon}`)
  const cage = ball.querySelector('.cust-ball-roll')
  const svg = template?.innerHTML.trim()
  if (!svg || !cage || !size) {
    return false
  }
  // ids inside a data url belong to that picture alone, so a mark that
  // clips or masks itself can stand on every ball without renaming
  const box = /viewBox="([\d.\-\s]+)"/.exec(svg)
  const seen = box ? box[1].trim().split(/\s+/).map(Number) : null
  const ratio = seen && seen[2] && seen[3] ? seen[2] / seen[3] : 1
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  const r = size / 2
  // the axle the cage turns about, for the stylesheet
  const lean = (CUST_TILT * Math.PI) / 180
  ball.style.setProperty('--cust-axis', `0, ${Math.sin(lean).toFixed(4)}, ${(-Math.cos(lean)).toFixed(4)}`)

  // a point on the sphere, in the ball's own axes: x right, y DOWN,
  // z towards the eye, and longitude 0 facing the eye
  const at = (lon, lat) => {
    const c = Math.cos(lat)
    return [r * c * Math.sin(lon), -r * Math.sin(lat), r * c * Math.cos(lon)]
  }
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const len = (a) => Math.hypot(a[0], a[1], a[2])
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

  // the mark's footprint on the ball, as angles, and how many pieces
  // that takes
  const spanLon = CUST_MARK
  const spanLat = CUST_MARK / ratio
  const across = Math.max(3, Math.round(spanLon / CUST_LON_STEP))
  const down = Math.max(1, Math.round(spanLat / CUST_LAT_STEP))
  // one size of picture for every piece, taken from the row on the
  // equator, so each mark is drawn once rather than once a row
  const wide = (2 * r * Math.sin(spanLon / (2 * across))) / 1
  const tall = (2 * r * Math.sin(spanLat / (2 * down))) / 1
  const pieces = []
  for (let copy = 0; copy < CUST_COPIES; copy++) {
    const middle = (copy * 2 * Math.PI) / CUST_COPIES
    for (let row = 0; row < down; row++) {
      const lat0 = -spanLat / 2 + (row * spanLat) / down
      const lat1 = lat0 + spanLat / down
      for (let i = 0; i < across; i++) {
        const lon0 = middle - spanLon / 2 + (i * spanLon) / across
        const lon1 = lon0 + spanLon / across
        const tl = at(lon0, lat1)
        const tr = at(lon1, lat1)
        const bl = at(lon0, lat0)
        const br = at(lon1, lat0)
        const mid = mul(add(add(tl, tr), add(bl, br)), 0.25)
        const u = mul(sub(add(tr, br), add(tl, bl)), 0.5)
        const v = mul(sub(add(bl, br), add(tl, tr)), 0.5)
        const uw = len(u)
        const vh = len(v)
        const ux = mul(u, 1 / uw)
        const vy = mul(v, 1 / vh)
        // the third column has to be the outward normal, or the piece
        // is culled the wrong way round
        let n = cross(u, v)
        n = mul(n, 1 / len(n))
        if (dot(n, mid) < 0) {
          n = mul(n, -1)
        }
        // its top left corner, pushed out by the bleed along its own
        // axes, then moved from the ball's middle to its box's corner
        let corner = add(mid, mul(add(u, v), -0.5))
        corner = add(corner, mul(add(mul(ux, (uw / wide) * CUST_BLEED), mul(vy, (vh / tall) * CUST_BLEED)), -1))
        corner = [corner[0] + r, corner[1] + r, corner[2]]
        // the row's own stretch rides in the matrix, so every piece can
        // share one picture size
        const cu = mul(ux, uw / wide)
        const cv = mul(vy, vh / tall)
        const piece = document.createElement('i')
        piece.className = 'cust-quad'
        piece.style.width = `${(wide + 2 * CUST_BLEED).toFixed(2)}px`
        piece.style.height = `${(tall + 2 * CUST_BLEED).toFixed(2)}px`
        piece.style.backgroundImage = url
        piece.style.backgroundSize = `${(wide * across).toFixed(2)}px ${(tall * down).toFixed(2)}px`
        piece.style.backgroundPosition = `${(-(i / across) * wide * across + CUST_BLEED).toFixed(2)}px ${(
          -(1 - (row + 1) / down) * tall * down + CUST_BLEED
        ).toFixed(2)}px`
        piece.style.transform =
          `matrix3d(${cu[0].toFixed(4)},${cu[1].toFixed(4)},${cu[2].toFixed(4)},0,` +
          `${cv[0].toFixed(4)},${cv[1].toFixed(4)},${cv[2].toFixed(4)},0,` +
          `${n[0].toFixed(4)},${n[1].toFixed(4)},${n[2].toFixed(4)},0,` +
          `${corner[0].toFixed(2)},${corner[1].toFixed(2)},${corner[2].toFixed(2)},1)`
        pieces.push(piece)
      }
    }
  }
  cage.replaceChildren(...pieces)
  ball.dataset.custDressed = size.toFixed(1)
  return true
}

/* The glass along the top of the customers hero, where the balls come
   in. It is the edge of the lens the WebGL heroes look through, made
   for markup: what lies under it is frosted, more so the nearer the
   edge, and its red and blue are pulled apart from its green, again
   more so the nearer the edge, so a ball coming in through it arrives
   soft and fringed in colour and leaves it crisp.

   The frost is plain backdrop-filter. The fringes are an SVG filter
   read through backdrop-filter, which only Chromium draws; a browser
   that cannot simply leaves those layers out and keeps the frost. The
   layers are siblings, each one working on what the ones before it
   left, each fading out down the glass by a mask, and none of them is
   switched on until a ball is on its way in. */
const CUST_LENS = [
  // a faint split low in the glass, and the wide one at its very edge:
  // red pulled up and blue pulled down by this many pixels, then
  // smeared along the way the edge bends things
  { name: 'near', split: 2.5, smear: '0.3 1.5' },
  { name: 'edge', split: 8, smear: '0.6 4' },
]
const dressCustomerGlass = (glass) => {
  if (glass.dataset.custGlass === 'true') {
    return
  }
  glass.dataset.custGlass = 'true'
  // each colour moved on its own and kept to its own channel, laid on
  // the page's colour first, so the three add back up to an opaque
  // picture and nothing at the glass's edges reads as a coloured line
  const lens = ({ name, split, smear }) =>
    `<filter id="cust-lens-${name}" x="0" y="-0.5" width="1" height="2" color-interpolation-filters="sRGB">` +
    '<feFlood class="cust-glass-page" result="page"/>' +
    '<feMerge result="solid"><feMergeNode in="page"/><feMergeNode in="SourceGraphic"/></feMerge>' +
    `<feOffset in="solid" dy="${-split}" result="up"/>` +
    `<feOffset in="solid" dy="${split}" result="down"/>` +
    '<feColorMatrix in="up" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red"/>' +
    '<feColorMatrix in="solid" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green"/>' +
    '<feColorMatrix in="down" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue"/>' +
    '<feComposite in="red" in2="green" operator="arithmetic" k2="1" k3="1" result="yellow"/>' +
    '<feComposite in="yellow" in2="blue" operator="arithmetic" k2="1" k3="1" result="white"/>' +
    `<feGaussianBlur in="white" stdDeviation="${smear}"/>` +
    '</filter>'
  glass.insertAdjacentHTML(
    'afterbegin',
    `<svg class="cust-glass-defs" width="0" height="0" aria-hidden="true" focusable="false">${CUST_LENS.map(lens).join('')}</svg>`,
  )
  // frosted first and split after, so the fringes stay over the frost
  // rather than being blurred back together by it
  glass.append(
    ...['frost', 'haze', ...CUST_LENS.map(({ name }) => name)].map((name) => {
      const layer = document.createElement('i')
      layer.className = `cust-glass-${name}`
      return layer
    }),
  )
}

const initCustomerBalls = debounce(() => {
  const fields = [...document.querySelectorAll('.cust-field')].filter((field) => field.dataset.custBound !== 'true')
  if (!fields.length) {
    return
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  fields.forEach((field) => {
    field.dataset.custBound = 'true'
    const floor = field.querySelector('.cust-floor')
    const balls = [...field.querySelectorAll('.cust-ball')]
      .map((el, index) => {
        const size = Number.parseFloat(getComputedStyle(el).getPropertyValue('--s'))
        if (!size || !dressCustomerBall(el, size)) {
          return null
        }
        return {
          el,
          roll: el.querySelector('.cust-ball-roll'),
          index,
          // the size it is drawn at, which the heap's own scale works from
          base: size,
          r: size / 2,
          // the bigger ball is the heavier one, so a small one bounces
          // off it rather than shouldering it aside
          m: size * size,
          x: 0,
          y: 0,
          // where it was at the end of the last frame
          px: 0,
          py: 0,
          vx: 0,
          vy: 0,
          // how fast it is turning, in radians a second, clockwise on
          // screen, which is the way a ball travelling right turns
          w: 0,
          home: 0,
          // a nudge off its place in the band, so no two fall alike
          drop: (((index * 29) % 13) - 6) * 3,
          // its turn in the fall, and whether it has had it yet
          at: index * CUST_DROP,
          live: false,
          // the pointer holding it, if any, and where it was taken hold of
          held: 0,
          grabX: 0,
          grabY: 0,
          last: 0,
          // how far it has rolled, in degrees
          turn: 0,
          // whether anything is holding it up this step, and how long
          // it has been put down flat
          prop: 0,
          calm: 0,
        }
      })
      .filter(Boolean)
    if (!floor || !balls.length) {
      return
    }

    /* The glass along the hero's top edge, laid over the copy rather
       than in the field, since a ball comes in through it */
    const glass = field.parentElement?.querySelector('.cust-glass')
    if (glass) {
      dressCustomerGlass(glass)
    }

    /* The field, and where the balls are tipped in: a band across the
       middle of it, each ball a little way along it in an order of its
       own, so they land on one another and heap rather than lining up.
       The whole row is scaled only when the field is too narrow to hold
       a heap of them. */
    let width = 0
    let floorY = 0
    // how far down from the top the glass reaches
    let glassH = 0
    const measure = () => {
      const box = field.getBoundingClientRect()
      const line = floor.getBoundingClientRect()
      glassH = glass ? glass.getBoundingClientRect().height : 0
      width = box.width
      floorY = line.top + line.height / 2 - box.top
      const full = balls.reduce((sum, b) => sum + b.base, 0)
      const widest = balls.reduce((most, b) => Math.max(most, b.base), 0)
      // room for a heap two deep, and never a ball wider than the field
      const scale = Math.min(1, (2.1 * width) / Math.max(full, 1), (width * 0.7) / Math.max(widest, 1))
      const band = Math.min(width * CUST_BAND, full * scale * 0.86)
      const start = (width - band) / 2
      balls.forEach((b, index) => {
        const size = b.base * scale
        b.el.style.setProperty('--s', `${size.toFixed(1)}px`)
        // the pieces of the mark are cut for one size of ball, so they
        // are cut again when the row rescales
        if (b.el.dataset.custDressed !== size.toFixed(1)) {
          dressCustomerBall(b.el, size)
        }
        b.r = size / 2
        b.m = size * size
        // along the band, but not in the order they stand in the page
        b.home = Math.min(
          Math.max(start + band * (((index * 7 + 3) % balls.length) / (balls.length - 1 || 1)) + b.drop, b.r + 2),
          width - b.r - 2,
        )
      })
    }
    const draw = (b) => {
      b.el.style.translate = `${(b.x - b.r).toFixed(1)}px ${(b.y - b.r).toFixed(1)}px`
    }
    /* The glass along the top is only glass while a ball is in it, or
       on its way in from over the edge. The rest of the time it is
       plain air and costs nothing, scrolling included. A ball has to
       clear the glass by a few pixels before it is let go of, so one
       sitting on its lower edge does not switch it on and off. */
    let glassy = false
    const glaze = () => {
      if (!glass) {
        return
      }
      const top = balls.reduce((most, b) => Math.min(most, b.y - b.r), Number.POSITIVE_INFINITY)
      const want = top < glassH + (glassy ? CUST_GLASS_GIVE : 0)
      if (want !== glassy) {
        glassy = want
        glass.classList.toggle('is-on', want)
      }
    }
    const spin = (b) => {
      b.roll.style.setProperty('--roll', `${b.turn.toFixed(1)}deg`)
    }

    // a sphere's own resistance to being turned
    const spinMass = (b) => 0.4 * b.m * b.r * b.r
    const capSpin = (b) => {
      b.w = Math.max(-CUST_SPIN_MAX, Math.min(CUST_SPIN_MAX, b.w))
    }

    /* Friction against something that does not move: the floor, or an
       edge. The normal points out of the ball towards the surface and
       the tangent is that turned a quarter turn; the stuff of the ball
       at the touch runs past the surface at (v along the tangent) plus
       its own spin at the rim. The impulse that takes that to nothing
       is 2/7 of the mass times it, and it is held to what the surface
       can hold on to. Both clamps, every time: overshooting either is
       what sets a heap buzzing at the step rate. */
    const rub = (b, nx, ny, jn, mu) => {
      if (jn <= 0) {
        return
      }
      const tx = -ny
      const ty = nx
      const run = b.vx * tx + b.vy * ty + b.w * b.r
      if (!run) {
        return
      }
      const jt = -Math.sign(run) * Math.min((2 / 7) * b.m * Math.abs(run), mu * jn)
      b.vx += (jt * tx) / b.m
      b.vy += (jt * ty) / b.m
      // the same impulse taken about the middle
      b.w += (2.5 * jt) / (b.m * b.r)
    }

    /* The floor and the two edges. A ball lying still presses with its
       own weight, which is one step of gravity: without that there is
       no impulse for friction to work from, so a resting ball has no
       grip at all and the heap slides itself flat. */
    const sides = (b, moveOnly) => {
      if (!b.live || b.held) {
        return
      }
      const sink = b.y + b.r - floorY
      if (sink > -0.5) {
        b.prop = 1
        if (sink > 0) {
          b.y = floorY - b.r
        }
        if (!moveOnly) {
          let jn = 0
          if (b.vy > 0) {
            // a slow landing does not bounce, which is what lets the
            // last hop die instead of shivering for ever
            const e = b.vy > CUST_REST ? CUST_FLOOR_BOUNCE : 0
            jn = b.m * b.vy * (1 + e)
            if (b.vy > CUST_REST) {
              b.calm = 0
            }
            b.vy = -b.vy * e
          }
          jn = Math.max(jn, b.m * CUST_GRAVITY * CUST_STEP)
          rub(b, 0, 1, jn, CUST_FLOOR_GRIP)
        }
      }
      const nx = b.x - b.r < 0 ? -1 : b.x + b.r > width ? 1 : 0
      if (nx) {
        b.x = nx < 0 ? b.r : Math.max(width - b.r, b.r)
        if (!moveOnly) {
          const into = b.vx * nx
          let jn = 0
          if (into > 0) {
            const e = into > CUST_REST ? CUST_WALL_BOUNCE : 0
            jn = b.m * into * (1 + e)
            b.vx = -b.vx * e
            b.calm = 0
          }
          // an edge carries no load, so a ball takes spin off it only
          // on a real knock
          rub(b, nx, 0, jn, CUST_WALL_GRIP)
        }
      }
    }

    /* Two balls. The overlap is eased out a little at a time and never
       fed back into the speeds, and the push and the grip are worked
       out from the speeds alone. Both spins enter the scrub with a
       plus sign: two touching balls scrub when they turn the same way
       and roll on each other when they turn against each other, like a
       pair of gears. One impulse turns them both the same way, which
       looks wrong written down and is right on screen. A held ball is
       immovable, so it takes neither push nor spin and keeps its place
       under the hand. */
    const hit = (a, b, moveOnly) => {
      if (!a.live || !b.live) {
        return
      }
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 0.01
      const overlap = a.r + b.r - d
      if (overlap <= -0.5) {
        return
      }
      const ia = a.held ? 0 : 1 / a.m
      const ib = b.held ? 0 : 1 / b.m
      const sum = ia + ib
      if (!sum) {
        return
      }
      const nx = dx / d
      const ny = dy / d
      // leaning on, rather than merely beside: only a touch below a
      // ball can hold it up
      if (ny > 0.3) {
        a.prop = 1
      }
      if (ny < -0.3) {
        b.prop = 1
      }
      if (overlap > 0) {
        const give = Math.max(overlap - CUST_SLOP, 0) * CUST_FIRM
        a.x -= (nx * give * ia) / sum
        a.y -= (ny * give * ia) / sum
        b.x += (nx * give * ib) / sum
        b.y += (ny * give * ib) / sum
      }
      if (moveOnly) {
        return
      }
      const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
      let jn = 0
      if (closing < 0) {
        const e = -closing > CUST_REST ? CUST_BALL_BOUNCE : 0
        jn = (-(1 + e) * closing) / sum
        a.vx -= jn * nx * ia
        a.vy -= jn * ny * ia
        b.vx += jn * nx * ib
        b.vy += jn * ny * ib
        if (-closing > CUST_REST) {
          a.calm = 0
          b.calm = 0
        }
      }
      // they press on each other even when nothing is closing: with no
      // load there is no grip, and a heap with no grip spreads flat
      jn = Math.max(jn, (CUST_LOAD * CUST_GRAVITY * CUST_STEP) / sum)
      const tx = -ny
      const ty = nx
      const run = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - (a.w * a.r + b.w * b.r)
      if (!run) {
        return
      }
      // 1 + 5/2 of the shared mass, because the spins take their share
      const jt = -Math.sign(run) * Math.min(Math.abs(run) / (3.5 * sum), CUST_BALL_GRIP * jn)
      a.vx -= jt * tx * ia
      a.vy -= jt * ty * ia
      b.vx += jt * tx * ib
      b.vy += jt * ty * ib
      if (!a.held) {
        a.w -= (2.5 * jt) / (a.m * a.r)
      }
      if (!b.held) {
        b.w -= (2.5 * jt) / (b.m * b.r)
      }
    }

    /* What a rolling ball gives up to the ground. It slides nowhere,
       so sliding friction cannot slow it: what slows it is the contact
       patch, spent as a couple against the spin, and the next step's
       friction hands the loss on to the travel. Driven by the ball's
       weight rather than by whatever the last bounce needed, since a
       hard landing presses thirty times as hard and would swallow the
       spin the floor just gave it. Once per ball per step, after the
       touches, so a ball in the middle of a heap is not braked once
       for every neighbour. */
    const brake = (b) => {
      if (!b.live || b.held) {
        return
      }
      if (b.prop && b.w) {
        const moment = spinMass(b)
        const give = Math.min(CUST_ROLL_RES * b.r * b.m * CUST_GRAVITY * CUST_STEP, moment * Math.abs(b.w))
        b.w -= (Math.sign(b.w) * give) / moment
      }
      capSpin(b)
      // a turn too slow to see is no turn: this is what stops a mark
      // creeping round for ever on a settled heap
      if (Math.abs(b.w) < 0.02) {
        b.w = 0
      }
    }

    /* A ball that is slow, barely turning and leaning on something is
       put down flat. This, not a speed test, is what makes a heap go
       quiet: the arithmetic always leaves a trickle, and a ball with
       something under it takes a whole step of gravity every step for
       ever. */
    const numb = (b) => {
      if (!b.live || b.held) {
        return
      }
      if (b.prop && Math.hypot(b.vx, b.vy) < CUST_NUMB_V && Math.abs(b.w) < CUST_NUMB_W) {
        b.vx = 0
        b.vy = 0
        b.w = 0
        b.calm += 1
      } else {
        b.calm = 0
      }
    }

    /* A ball in hand keeps whatever spin it has. The hand sets no
       angle: a ball lifted off the floor and swept sideways does not
       roll, while one dragged along the floor is rolled by the floor.
       Approached rather than snapped, so a quick drag does not strobe
       the mark. */
    const handSpin = (b, h) => {
      if (!b.live || !b.held) {
        return
      }
      if (b.y + b.r >= floorY - 0.5) {
        const want = Math.max(-CUST_SPIN_MAX, Math.min(CUST_SPIN_MAX, b.vx / b.r))
        b.w += (want - b.w) * (1 - Math.exp(-CUST_HAND_ROLL * h))
      } else {
        b.w *= Math.exp(-CUST_SPIN_AIR * h)
      }
      b.turn += (b.w * h * 180) / Math.PI
    }

    /* One fixed step. Gravity pulls on the middle of a ball, so it
       changes where the ball goes and never how it spins: a ball
       thrown straight up comes down turning at the rate it left the
       hand with. The mark's angle is taken from the spin inside this
       same step, so it can never drift out of phase with the motion. */
    const step = (h) => {
      balls.forEach((b) => {
        if (b.live && !b.held) {
          // a ball put down flat is not pulled on, which is what keeps
          // a heap from sinking a fraction of a pixel every step for
          // ever; it falls again the step it loses what holds it up
          if (b.calm < CUST_CALM) {
            b.vy += CUST_GRAVITY * h
          }
          const air = Math.exp(-CUST_AIR * h)
          b.vx *= air
          b.vy *= air
          b.w *= Math.exp(-CUST_SPIN_AIR * h)
          b.x += b.vx * h
          b.y += b.vy * h
          b.turn += (b.w * h * 180) / Math.PI
        }
        handSpin(b, h)
        b.prop = 0
      })
      // the impulses once, then the overlaps alone a few more times, so
      // a ball shouldered by its neighbour still ends the step above
      // the floor and inside the field without taking six doses of grip
      for (let pass = 0; pass < CUST_PASSES; pass++) {
        const moveOnly = pass > 0
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            hit(balls[i], balls[j], moveOnly)
          }
        }
        balls.forEach((b) => sides(b, moveOnly))
      }
      balls.forEach((b) => {
        brake(b)
        numb(b)
      })
    }

    /* Asleep, the loop stops and the balls stay as they lie. */
    let frame = 0
    let last = null
    /** how much of the fall has actually been drawn, in milliseconds */
    let fallen = 0
    let still = 0
    let asleep = true
    const sleep = () => {
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      last = null
      still = 0
      asleep = true
    }
    const wake = () => {
      if (!asleep) {
        return
      }
      asleep = false
      last = null
      frame = requestAnimationFrame(tick)
    }
    const tick = (now) => {
      frame = 0
      if (last === null) {
        last = now
      }
      let left = Math.min((now - last) / 1000, 0.05)
      const went = Math.max(left, CUST_STEP)
      last = now
      /* the fall is told by the frames that have run, not by the clock: a
         tab opened in the background paints none of them, and a wall-clock
         reading on the way back would find every ball already due and drop
         the lot together instead of one after another */
      fallen += left * 1000
      balls.forEach((b) => {
        if (!b.live && fallen >= b.at) {
          b.live = true
        }
      })
      while (left > 0) {
        const h = Math.min(left, CUST_STEP)
        step(h)
        left -= h
      }
      // How far each ball went over the frame is the test, and how far
      // its skin went under the spin with it, so one threshold covers a
      // creeping mark as well as a creeping ball. A speed test cannot
      // do this: a ball at rest still takes a step of gravity every
      // step. Everything must also be leaning on something, which is
      // what keeps the world awake at the top of a bounce, where the
      // middle of a ball is as still as a ball at rest.
      let moved = 0
      balls.forEach((b) => {
        if (Math.hypot(b.x - b.px, b.y - b.py) + Math.abs(b.w) * b.r * went > CUST_SLEEP) {
          moved += 1
        }
        b.px = b.x
        b.py = b.y
        draw(b)
        spin(b)
      })
      glaze()
      const quiet = moved === 0 && balls.every((b) => b.live && !b.held && b.prop)
      still = quiet ? still + 1 : 0
      if (still >= CUST_STILL) {
        sleep()
        return
      }
      frame = requestAnimationFrame(tick)
    }

    // the fall: each ball over its own place in the band, a moment
    // after the one before, with a nudge sideways so no two land alike
    const tip = () => {
      balls.forEach((b) => {
        b.x = b.home
        b.y = -b.r - CUST_FALL - ((b.index * 53) % 90)
        b.vx = 0
        b.vy = 0
        // a turn of its own on the way down, apart from any drift, so
        // the very first bounce shows the floor biting: a ball dropped
        // turning squirts sideways as it lands
        b.w = (((b.index * 41) % 9) - 4) * 0.55
        b.turn = 0
        b.prop = 0
        b.calm = 0
        b.live = false
        draw(b)
        spin(b)
      })
      fallen = 0
    }
    // the same fall, run through at once: the heap without the show,
    // for a reader who asked for no motion and after the field resizes.
    // It keeps the turns the balls take, so the heap it builds is the
    // one the fall would have left
    const settle = () => {
      tip()
      let at = 0
      for (let i = 0; i < 1400; i++) {
        at += CUST_STEP * 1000
        balls.forEach((b) => {
          if (!b.live && at >= b.at) {
            b.live = true
          }
        })
        step(CUST_STEP)
      }
      balls.forEach((b) => {
        draw(b)
        spin(b)
      })
      glaze()
    }

    /* A ball in hand follows the pointer, keeping the speed of the last
       move so a throw carries it. It stays inside the field while held,
       so the toy cannot be dragged out of its box. */
    balls.forEach((b) => {
      b.el.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return
        }
        const box = field.getBoundingClientRect()
        wake()
        b.held = event.pointerId
        b.live = true
        b.grabX = b.x - (event.clientX - box.left)
        b.grabY = b.y - (event.clientY - box.top)
        b.last = event.timeStamp
        b.vx = 0
        b.vy = 0
        b.el.classList.add('is-held')
        // the ball keeps the pointer even when it slips out from under
        // it; a pointer the browser has already let go of cannot be
        // captured, and losing it is no reason to drop the grab
        try {
          b.el.setPointerCapture(event.pointerId)
        } catch {}
        event.preventDefault()
      })
      b.el.addEventListener('pointermove', (event) => {
        if (b.held !== event.pointerId) {
          return
        }
        const box = field.getBoundingClientRect()
        const x = Math.min(Math.max(event.clientX - box.left + b.grabX, b.r), Math.max(width - b.r, b.r))
        const y = Math.min(Math.max(event.clientY - box.top + b.grabY, b.r), floorY - b.r)
        const h = Math.max(event.timeStamp - b.last, 8) / 1000
        b.vx = (x - b.x) / h
        b.vy = (y - b.y) / h
        b.x = x
        b.y = y
        b.last = event.timeStamp
      })
      const release = (event) => {
        if (b.held !== event.pointerId) {
          return
        }
        b.held = 0
        b.el.classList.remove('is-held')
        // a flick that outran the hand is held to a sensible throw
        const speed = Math.hypot(b.vx, b.vy)
        if (speed > CUST_THROW) {
          b.vx *= CUST_THROW / speed
          b.vy *= CUST_THROW / speed
        }
        /* The throw leaves at the point the ball was HELD, not at its
           middle, so a grip off to one side levers it round: a ball
           taken by the middle is thrown flat, one taken by its edge
           leaves spinning. Flick the top of a ball and it runs away
           with topspin; flick the bottom and it comes back off the
           floor. */
        let px = -b.grabX
        let py = -b.grabY
        const reach = Math.hypot(px, py)
        if (reach > b.r) {
          px *= b.r / reach
          py *= b.r / reach
        }
        b.w += (CUST_FLICK * b.m * (px * b.vy - py * b.vx)) / spinMass(b)
        capSpin(b)
        if (!Number.isFinite(b.w)) {
          b.w = 0
        }
        b.calm = 0
        wake()
      }
      b.el.addEventListener('pointerup', release)
      b.el.addEventListener('pointercancel', release)
    })

    // the fall runs once the hero is on screen; a field that changes
    // size is measured again, and a heap already at rest built afresh
    let started = false
    measure()
    const sizes = new ResizeObserver(() => {
      measure()
      if (started && asleep) {
        settle()
      }
    })
    sizes.observe(field)
    // the heap belongs to the page it was dropped on, and goes with it
    holdLanding(field, () => {
      sizes.disconnect()
      sleep()
    })
    const start = () => {
      measure()
      started = true
      // only now is there a place for them: until this they would show
      // stacked in the field's corner
      field.classList.add('is-ready')
      if (reduceMotion) {
        settle()
        return
      }
      tip()
      glaze()
      wake()
    }
    // straight away where the hero is already on screen, which it is on
    // a page opened at the top; otherwise the first time it comes into
    // view, so a reader who lands further down still sees them fall
    const where = field.getBoundingClientRect()
    if (where.top < window.innerHeight && where.bottom > 0) {
      start()
    } else {
      const watch = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) {
            return
          }
          watch.disconnect()
          start()
        },
        { threshold: 0.01 },
      )
      watch.observe(field)
    }
  })
})

/* What the onboard button copies: the setup prompt an agent follows. */
const LANDING_ONBOARD_PROMPT = [
  'Set up Scalar for this repo with the Scalar MCP server (https://mcp.scalar.com/) and the Scalar CLI (`npx -y @scalar/cli@latest`).',
  '',
  'Find my OpenAPI file and the brand site for my company, check what my team already has so nothing is duplicated, and confirm with me once. Then:',
  '',
  '1. Publish the API to the Scalar Registry.',
  '2. Create one TypeScript SDK with `create_an_sdk` (it builds itself, never call `build_an_sdk`).',
  '3. Host an MCP server for the API with `create_an_mcp_server`, pointed at the Registry entry.',
  '4. Scaffold `scalar-docs/` with intro, quickstart and authentication guides from the spec, a custom `--scalar-*` CSS theme from my brand (`siteConfig.theme`), and a config (schema https://registry.scalar.com/@scalar/schemas/config) whose API reference route points at the Registry entry by namespace and slug, not a local file, so the SDK samples show.',
  '5. Create the docs project and `project publish` it.',
  '',
  'Report the links. Never delete anything.',
].join('\n')
const initLandingOnboard = () => {
  document.querySelectorAll('[data-lp-onboard]').forEach((button) => {
    if (button.dataset.lpOnboardBound === 'true') {
      return
    }
    button.dataset.lpOnboardBound = 'true'
    button.querySelectorAll('.lp-onboard-agent[data-icon]').forEach((slot) => {
      const template = document.getElementById(`lp-icon-${slot.dataset.icon}`)
      if (!template) {
        return
      }
      slot.replaceChildren(template.content.cloneNode(true))
      // the marks take the text colour, so their gradient defs (and the
      // ids the globes also clone) are not needed here
      slot.querySelectorAll('defs').forEach((defs) => defs.remove())
    })
    let timer = 0
    button.addEventListener('click', () => {
      const prompt = LANDING_ONBOARD_PROMPT
      if (!prompt || !navigator.clipboard) {
        return
      }
      navigator.clipboard
        .writeText(prompt)
        .then(() => {
          button.classList.add('is-copied')
          window.clearTimeout(timer)
          timer = window.setTimeout(() => button.classList.remove('is-copied'), 2200)
        })
        .catch(() => {})
    })
  })
}

/* The docs page's hero: a row of documentation sites built with Scalar,
   sliding past on a curve, after the treatment meech213.com gives its
   gallery.

   Their row is three.js — a line of textured planes whose vertices one
   node graph moves. The graph reads a vertex's world x and adds three
   offsets to it:

     y  cos(x * curveFrequency) * curveStrength - curveStrength
     z  -(abs(x) ** 1.25) * depthCurveStrength
     x  sin(uv.y * PI) * travel

   The first two bend the row: a shallow sag, and a fall away from the
   camera that grows towards the edges. They depend only on where a card
   is, so each card here gets them as a translate, plus the turn that
   keeps a flat card lying on the curve it is standing on. The sag is
   theirs; the fall away is ours — a curve that keeps bending reads as
   one long tilt, so this row lies flat across the middle and falls away
   at one angle to either side instead. See flatSpan below.

   The third is the bow, and it is the one worth having: the middle of a
   card is drawn one frame's travel ahead of its top and bottom edges,
   so a card moving quickly reads as a drawn bow. It varies down the
   card, which no single CSS transform does, so a card is cut into
   slices and each slice is moved and sheared to meet its neighbours —
   the same straight join the GPU draws between two rows of vertices.
   At rest the slices sit flush and a card is an ordinary rectangle.

   Their numbers are kept as they are; what is ours is the row never
   quite stopping, and the wheel adding to its speed without taking the
   page's scrolling away. */
/* The faces of the row: three customers' documentation portals, each
   rendering one operation — Zoom's and Clerk's from the drawings made for
   the August 2026 hero, Supabase's built from its own Management API
   document and the look of its docs, in documentation/assets/docs-hero.

   They are bitmaps rather than markup: as HTML inside an <svg> the browser
   lays them out and rasterises them again every time the row moves — 53
   frames a second against 120 for the same picture baked. */
const DOCS_HERO_PREVIEWS = ['zoom', 'clerk', 'supabase']

/* The two rows, in the order the page has them: left of the seam the
   browser is rendering a portal's API reference, right of it the same
   browser is on the same page's .md — plain monospace text, markdown and
   all. The suffix is what tells one bake from the other. */
const DOCS_HERO_SIDES = ['', '-markdown']

/* A page can give its row faces of its own: each .dh-face inside the field
   names the bitmap for each side of the seam (data-left and data-right, a
   path without .webp, the dark one being the same path with -dark) and the
   prompt the hero's prompt box types while that face is at the seam
   (data-prompt). The headless page's row is apps on the left and Claude
   doing the same job on the right. A row with none is the docs hero's. */
const docsHeroFaces = (field) => {
  const listed = [...field.querySelectorAll('.dh-face')]
    .map((face) => ({ sides: [face.dataset.left, face.dataset.right], prompt: face.dataset.prompt || '' }))
    .filter((face) => face.sides.every(Boolean))
  if (listed.length) {
    return listed
  }
  return DOCS_HERO_PREVIEWS.map((face) => ({
    sides: DOCS_HERO_SIDES.map((side) => `/docs-hero/${face}${side}`),
    prompt: '',
  }))
}

const DOCS_HERO = {
  /* theirs: the sag the plane rides, and the plane itself */
  curveFrequency: 0.18,
  curveStrength: 0.12,
  /* Ours, in place of their fall-away curve: the row lies flat across
     the middle and falls away at one fixed angle to either side, so a
     preview funnels in, squares up to the reader as it crosses the
     centre, and funnels out again. A power curve keeps bending the
     further out a card goes, which reads as one long tilt instead of a
     funnel. The three are world units, where a preview is imageSizeX
     across and flatSpan is measured from the centre. */
  flatSpan: 1,
  funnelSlope: 0.8,
  funnelCorner: 0.35,
  /* theirs is a tall plane; these previews are the wide pages they were
     drawn as, so the same numbers stand the other way round */
  imageSizeX: 1.28,
  imageSizeY: 0.72,
  gap: 0.12,
  cameraDistance: 3.3,
  /* where the seam starts, as a share of the row's width, and how far
     it may be taken before one side is too thin to read */
  split: 0.5,
  splitMin: 0.14,
  splitMax: 0.86,
  /* theirs: the scrubbing. A frame keeps 92% of its speed, and the
     travel that speed works out to is also the bow */
  friction: 0.92,
  wheelFactor: 0.52,
  wheelDirection: -1,
  wheelGain: 0.18,
  dragGain: 0.315,
  maxVelocity: 180,
  /* ours */
  drift: 0.85,
  bowFloor: 1,
  slices: 8,
  cards: 12,
  /* a fifth larger than the funnel first wanted them: the funnel reads
     best when a preview's whole turn fits on the screen beside the flat
     one in the middle, but the previews are the point of the row */
  cardMin: 312,
  cardMax: 816,
  cardShare: 0.624,
  /* how much of the room above the hero's foot a card may take, and how
     far above the words the row rides, as a share of a card */
  cardRoom: 0.92,
  rowLift: 0.04,
}

const DOCS_HERO_FRAME = 1000 / 60

/* The row reaches both edges of the column the page clips to, past the
   text column and past the sidebar. The hero is already centred in
   whatever room the page left it, so the shorter of its two margins is
   that room — no need to know what the sidebar is doing, which is just
   as well, since --scalar-sidebar-width keeps its desktop value on a
   phone where the sidebar is a drawer.

   The two lengths go on the hero rather than the field because the
   seam's handle and its grip are placed from them as well, and a custom
   property only reaches down.

   A hero in a card of its own (data-dh-contained, the row on
   the home page) keeps the row to its own width instead, so the
   row is laid out for the card and its windows keep their share of it. */
const docsHeroBleed = (hero) => {
  const box = hero.getBoundingClientRect()
  const page = document.documentElement.clientWidth || window.innerWidth
  const middle = box.left + box.width / 2
  const reach = hero.dataset.dhContained === 'true' ? box.width / 2 : Math.min(middle, page - middle)
  const space = Math.max(reach * 2, box.width)
  if (!box.width) {
    /* a hero that is not laid out yet measures as nothing; leave the two
       lengths unwritten rather than put a zero in them */
    return { box, space }
  }
  hero.style.setProperty('--dh-left', `${Math.round(middle - reach - box.left)}px`)
  hero.style.setProperty('--dh-width', `${Math.round(space)}px`)
  /* the handle waits for this: the page swaps the hero out from under an
     early measurement while it hydrates, so the lengths can arrive a
     moment after the words, and a handle placed before them would stand
     in the text column and then jump out to the row's edge */
  hero.dataset.dhBleed = 'true'
  return { box, space }
}

/* The field is on the page before the row is built, so it is measured
   on its own as well, without the wait the rest of the hero can afford:
   left to the debounced build below, it would be laid out at the text
   column's width and then jump out to the row's. */
const measureDocsHero = () => {
  const hero = document.querySelector('.dh-hero')
  if (hero) {
    docsHeroBleed(hero)
  }
}
const docsHeroMod = (value, span) => ((value % span) + span) % span

/* Every docs hero's sync, so one that left the page while it was off
   screen — where no observer fires again — is released on the next page
   change, as the landing page's flows are. */
const docsHeroSyncs = new Set()

const initDocsHero = debounce(() => {
  const field = document.querySelector('.dh-field')
  if (!field || field.dataset.dhBound === 'true') {
    return
  }
  /* One row a side of the seam. Both are laid out from the same numbers
     and placed by the same call, so they register to the pixel and the
     seam reads as one portal rendering two things rather than as two
     portals side by side. */
  const panes = [...field.querySelectorAll('.dh-pane')]
  const stages = panes.map((pane) => pane.querySelector('.dh-stage'))
  if (stages.length !== DOCS_HERO_SIDES.length || stages.some((stage) => !stage)) {
    return
  }
  field.dataset.dhBound = 'true'

  const faces = docsHeroFaces(field)
  /* a whole number of rounds of the faces, so that where the row comes
     round no face is followed by itself */
  const cardCount = faces.length * Math.max(1, Math.round(DOCS_HERO.cards / faces.length))
  const cards = []
  for (let index = 0; index < cardCount; index += 1) {
    const copies = stages.map((stage) => {
      const card = document.createElement('div')
      card.className = 'dh-card'
      const slices = []
      for (let slice = 0; slice < DOCS_HERO.slices; slice += 1) {
        const element = document.createElement('div')
        element.className = 'dh-slice'
        element.style.setProperty('--i', String(slice))
        card.appendChild(element)
        slices.push(element)
      }
      stage.appendChild(card)
      return { element: card, slices }
    })
    cards.push({ copies, flat: false, off: false, face: index % faces.length })
  }

  /* The bitmaps go on once the row is within a screen of being seen: a
     row further down a page, as the headless page's is, is a few hundred
     kilobytes nobody may scroll to. Both themes are set and the page's
     class picks one, so a reader switching themes costs nothing. */
  let painted = false
  const paint = () => {
    if (painted) {
      return
    }
    painted = true
    for (const card of cards) {
      card.copies.forEach((copy, side) => {
        const source = faces[card.face].sides[side]
        copy.element.style.setProperty('--dh-src', `url("${source}.webp")`)
        copy.element.style.setProperty('--dh-src-dark', `url("${source}-dark.webp")`)
      })
    }
  }
  const fieldBox = field.getBoundingClientRect()
  const viewHeight = window.innerHeight || document.documentElement.clientHeight
  const approach =
    fieldBox.top < viewHeight * 2 || typeof IntersectionObserver !== 'function'
      ? null
      : new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              approach.disconnect()
              paint()
            }
          },
          { rootMargin: '100% 0px' },
        )
  if (approach) {
    approach.observe(field)
  } else {
    paint()
  }

  /* px per world unit, and the run of one card plus its gap */
  let unit = 0
  let stride = 0
  let span = 0
  let cardHeight = 0
  /* how far from the middle a preview's middle can land and still have
     any of itself on the screen */
  let reach = 0
  /* how far the row has travelled: the row's whole position, so a resize
     can carry it over rather than snapping every card back to its slot */
  let offset = 0

  const hero = field.parentElement
  const copy = hero && hero.querySelector('.dh-copy')

  /* The prompt box, where a hero has one (the headless page's): it types
     the prompt of whichever face stands at the seam, as someone would ask
     for what the window right of the seam is answering. */
  const promptBox = hero?.querySelector('.dh-prompt')
  const promptText = promptBox ? promptBox.querySelector('.dh-prompt-text') : null
  const promptStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let promptFace = -1
  let promptTimer = 0
  /* The words go into one text node, changed in place. A change to a text
     node's data inserts nothing and wakes none of the page's childList
     observers, where setting textContent did both on every keystroke. */
  const promptWords = document.createTextNode('')
  const setWords = (words) => {
    if (promptWords.parentNode !== promptText) {
      promptText.replaceChildren(promptWords)
    }
    promptWords.data = words
  }
  /* It types only while the row runs (on screen, the page in front): a
     prompt typed out of sight would greet the reader already sent. The
     face nearest the seam is asked for every frame, so it starts on the
     row's first frame back. */
  let promptLive = false
  const showPrompt = (index) => {
    if (!promptText || index === promptFace || !faces[index] || !faces[index].prompt) {
      return
    }
    if (!promptStill && !promptLive) {
      return
    }
    promptFace = index
    clearTimeout(promptTimer)
    const words = faces[index].prompt
    promptBox.classList.remove('is-sent')
    if (promptStill) {
      setWords(words)
      promptBox.classList.add('is-composing')
      return
    }
    setWords('')
    promptBox.classList.remove('is-composing')
    let typed = 0
    const type = () => {
      typed += 1
      setWords(words.slice(0, typed))
      promptBox.classList.add('is-composing')
      promptTimer =
        typed < words.length
          ? setTimeout(type, 26 + Math.random() * 44)
          : setTimeout(() => promptBox.classList.add('is-sent'), 600)
    }
    promptTimer = setTimeout(type, 280)
  }
  /* where the seam stands, as a share of the row, and how wide the row is,
     so the card nearest the seam can be found as the row moves */
  let splitShare = DOCS_HERO.split
  let rowWidth = 0
  let previousStride = 0

  const layout = () => {
    const bleed = hero ? docsHeroBleed(hero) : null
    const box = bleed ? bleed.box : null
    const space = bleed ? bleed.space : document.documentElement.clientWidth || window.innerWidth
    /* The row runs from the top of the hero down to its foot — the rule
       and the logos — so that room, not the whole hero, is what a card is
       measured against. The foot's own height is read from the page
       rather than written down twice. */
    const footing = hero ? hero.querySelector('.dh-foot') : null
    const gap = footing ? Number.parseFloat(getComputedStyle(footing).marginTop) || 0 : 0
    const footRoom = footing && box ? Math.round(box.bottom - footing.getBoundingClientRect().top + gap) : 0
    /* on the hero rather than on the row: the handle beside the row ends
       at the foot as well, and a custom property only reaches down */
    if (hero) {
      hero.style.setProperty('--dh-foot', `${footRoom}px`)
    }
    const room = box ? box.height - footRoom : 0
    const tallest = room
      ? (room * DOCS_HERO.cardRoom * DOCS_HERO.imageSizeX) / DOCS_HERO.imageSizeY
      : Number.POSITIVE_INFINITY
    /* the room binds last: a card that will not fit in it would be cut
       off flat at the top of the hero, and a smaller card is better than
       a sliced one on a short screen */
    const width = Math.round(
      Math.min(Math.max(DOCS_HERO.cardMin, Math.min(DOCS_HERO.cardMax, space * DOCS_HERO.cardShare)), tallest),
    )
    cardHeight = Math.round((width / DOCS_HERO.imageSizeX) * DOCS_HERO.imageSizeY)
    unit = width / DOCS_HERO.imageSizeX
    stride = (DOCS_HERO.imageSizeX + DOCS_HERO.gap) * unit
    span = cards.length * stride
    reach = (space + width) / 2
    rowWidth = space
    field.style.setProperty('--dh-w', `${width}px`)
    field.style.setProperty('--dh-h', `${cardHeight}px`)
    field.style.setProperty('--dh-sh', `${cardHeight / DOCS_HERO.slices}px`)
    /* The row is centred on the words and lifted a little above them, so
       the previews ride high in the hero rather than hanging at its foot.
       Centring on the copy rather than on the room keeps the two together
       however long the heading runs, and at every width. */
    const words = copy && box ? copy.getBoundingClientRect() : null
    const centre = words ? words.top + words.height / 2 - box.top : room / 2
    const middleY = Math.round(centre - DOCS_HERO.rowLift * cardHeight)
    field.style.setProperty('--dh-top', `${middleY}px`)
    /* the same camera for both rows, so neither is a hair's breadth off
       the other where the seam cuts them */
    for (const pane of panes) {
      pane.style.perspective = `${DOCS_HERO.cameraDistance * unit}px`
      pane.style.perspectiveOrigin = `50% ${middleY}px`
    }
    /* The handle rides a little below the top edge of a preview, and
       never lower than the words begin: on a narrow screen the previews
       are small and the words reach the top of them, and a handle in
       among the words is one the words take the pointer from. */
    if (hero) {
      const clear = words ? Math.round(words.top - box.top - 26) : Number.POSITIVE_INFINITY
      const rides = Math.round(middleY - cardHeight / 2 + 44)
      hero.style.setProperty('--dh-grip', `${Math.max(28, Math.min(rides, clear))}px`)
    }
    offset = previousStride ? (offset * stride) / previousStride : offset
    previousStride = stride
  }

  /* Move the row along by travel, put every card back on the curve, and
     bend it by bow. One call with both at zero is the still picture a
     reader who asked for less motion gets. */
  const place = (travel, bow) => {
    const half = span / 2
    const count = DOCS_HERO.slices
    offset = docsHeroMod(offset + travel, span)
    const bending = Math.abs(bow) > DOCS_HERO.bowFloor
    field.classList.toggle('is-bowing', bending)
    /* the seam, from the row's middle, and the card that lands nearest it */
    const seamAt = (splitShare - 0.5) * rowWidth
    let nearest = -1
    let nearestGap = Number.POSITIVE_INFINITY

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index]
      const at = docsHeroMod(index * stride + offset + half, span) - half
      const x = at / unit
      /* A card is a chord of the curve, not a tangent to it: its two
         edges are put on the curve and the card is laid between them.
         Reading the slope at the middle instead would snap a card round
         as it crossed the centre, where the funnel's two sides meet: the
         slope there is continuous but the bend is not, and a tangent
         feels that within a few pixels of travel. A chord spans it and
         never does. */
      const edge = DOCS_HERO.imageSizeX / 2
      /* flat across the middle, a straight fall beyond it, and a corner
         of funnelCorner rounding the turn between the two */
      const fall = (place) => {
        const out = Math.abs(place) - DOCS_HERO.flatSpan
        const turn = (out + Math.sqrt(out * out + DOCS_HERO.funnelCorner ** 2)) / 2
        return -turn * DOCS_HERO.funnelSlope
      }
      const drop = (place) =>
        -(Math.cos(place * DOCS_HERO.curveFrequency) * DOCS_HERO.curveStrength - DOCS_HERO.curveStrength)
      const backLeft = fall(x - edge)
      const backRight = fall(x + edge)
      const downLeft = drop(x - edge)
      const downRight = drop(x + edge)
      const depth = ((backLeft + backRight) / 2) * unit
      const sag = ((downLeft + downRight) / 2) * unit
      const yaw = Math.atan((backLeft - backRight) / (2 * edge))
      const roll = Math.atan((downRight - downLeft) / (2 * edge))
      const placed = `translate3d(${at}px, ${sag}px, ${depth}px) rotateY(${yaw}rad) rotateZ(${roll}rad)`
      for (const copy of card.copies) {
        copy.element.style.transform = placed
      }

      /* The row is far longer than the screen, and bending a card is the
         expensive part: eight slices a card, twice over now that there
         are two rows. Only the two or three cards anywhere near the
         screen are worth it; the rest lie flat until they come round.

         Where a card lands is not where it stands: a card out on the
         funnel's slope is a long way back, and the perspective divides
         it toward the middle again, so the test has to be made on the
         screen rather than on the stage. */
      const away = DOCS_HERO.cameraDistance * unit
      const seen = (at * away) / (away - depth)
      /* A card past the row's reach is off the screen, out of the row's
         box. It keeps its place, so it comes back exactly where it would
         have been, but renders nothing while it is away: no slices to
         style, paint or put in layers. The tenth of a card is room for a
         turned card's near edge. */
      const off = Math.abs(seen) > reach + unit * DOCS_HERO.imageSizeX * 0.1
      if (off !== card.off) {
        card.off = off
        for (const copy of card.copies) {
          copy.element.style.contentVisibility = off ? 'hidden' : ''
        }
      }
      if (Math.abs(seen - seamAt) < nearestGap) {
        nearestGap = Math.abs(seen - seamAt)
        nearest = card.face
      }
      if (!bending || Math.abs(seen) > reach) {
        if (!card.flat) {
          card.flat = true
          for (const copy of card.copies) {
            for (const slice of copy.slices) {
              slice.style.transform = ''
            }
          }
        }
        continue
      }
      card.flat = false
      for (let slice = 0; slice < count; slice += 1) {
        /* sin(uv.y * PI) at this slice's top and bottom edge; uv.y runs
           up the card, so slice 0 is the top one */
        const top = Math.sin((1 - slice / count) * Math.PI) * bow
        const bottom = Math.sin((1 - (slice + 1) / count) * Math.PI) * bow
        const bent = `translateX(${top}px) skewX(${Math.atan((bottom - top) / (cardHeight / count))}rad)`
        for (const copy of card.copies) {
          copy.slices[slice].style.transform = bent
        }
      }
    }
    if (nearest >= 0) {
      showPrompt(nearest)
    }
  }

  /* The site is one page, so this hero's field is thrown away on the way
     to another. Everything hung on the window goes with it. */
  let release = () => {}
  let measured = ''
  const onResize = debounce(() => {
    if (!field.isConnected) {
      release()
      return
    }
    /* the hero's height is in the key because a card is sized against
       it; laying out does not change it, so this cannot answer itself */
    const page = document.documentElement.clientWidth || window.innerWidth
    const box = hero ? hero.getBoundingClientRect() : null
    const shape = box ? `${page}:${Math.round(box.left)}:${Math.round(box.width)}:${Math.round(box.height)}` : `${page}`
    if (shape === measured) {
      return
    }
    measured = shape
    layout()
    place(0, 0)
  })

  layout()
  /* placed before the first paint: without this every card sits on the
     stage's origin, stacked, until the first frame runs */
  place(0, 0)
  measured = (() => {
    const page = document.documentElement.clientWidth || window.innerWidth
    const box = hero ? hero.getBoundingClientRect() : null
    return box ? `${page}:${Math.round(box.left)}:${Math.round(box.width)}:${Math.round(box.height)}` : `${page}`
  })()
  window.addEventListener('resize', onResize)
  /* The sidebar and the content column settle after this runs, so the
     first measurement can be of a page that is not finished. Watching the
     hero catches that, and a sidebar that opens or closes later. */
  const watcher = typeof ResizeObserver === 'function' && hero ? new ResizeObserver(onResize) : null
  watcher?.observe(hero)

  /* The seam. Both rows are already drawn one on top of the other, so
     moving it only changes where each of them is cut — the previews
     themselves do not move, which is what makes it read as one portal
     showing a page's markdown on one side and the rendered page on
     the other.

     The handle is a sibling of the row rather than a child of it: the
     row is decorative and hidden from screen readers, and a control
     inside it would be focusable but unreachable. */
  const splitter = hero && hero.querySelector('.dh-split')
  const setSplit = (share) => {
    const next = Math.min(DOCS_HERO.splitMax, Math.max(DOCS_HERO.splitMin, share))
    splitShare = next
    hero.style.setProperty('--dh-split', String(Math.round(next * 1e4) / 1e4))
    splitter.setAttribute('aria-valuenow', String(Math.round(next * 100)))
    /* with motion, the next frame finds the face at the seam; without, nothing would */
    if (promptStill && promptText) {
      place(0, 0)
    }
  }
  if (splitter && hero) {
    setSplit(DOCS_HERO.split)
    let holding = null
    const share = (clientX) => {
      const box = field.getBoundingClientRect()
      return box.width ? (clientX - box.left) / box.width : DOCS_HERO.split
    }
    splitter.addEventListener('pointerdown', (event) => {
      holding = event.pointerId
      try {
        splitter.setPointerCapture(event.pointerId)
      } catch {
        /* a pointer that has already gone */
      }
      splitter.classList.add('is-dragging')
      /* otherwise the browser starts a text selection across the words
         the handle is standing in front of */
      event.preventDefault()
    })
    splitter.addEventListener('pointermove', (event) => {
      if (holding === event.pointerId) {
        setSplit(share(event.clientX))
      }
    })
    const letGo = (event) => {
      if (holding !== event.pointerId) {
        return
      }
      try {
        splitter.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
      holding = null
      splitter.classList.remove('is-dragging')
    }
    splitter.addEventListener('pointerup', letGo)
    splitter.addEventListener('pointercancel', letGo)
    /* A click on the row takes the seam to where it was clicked. The row
       has no other click of its own — it is scrubbed by dragging — and a
       seam that can only be dragged is a seam some readers cannot move
       at all. */
    let pressed = null
    field.addEventListener('pointerdown', (event) => {
      pressed = event.clientX
    })
    field.addEventListener('pointerup', (event) => {
      if (pressed !== null && Math.abs(event.clientX - pressed) < 5) {
        setSplit(share(event.clientX))
      }
      pressed = null
    })
    splitter.addEventListener('keydown', (event) => {
      const by = event.shiftKey ? 0.1 : 0.02
      const now = Number.parseFloat(getComputedStyle(hero).getPropertyValue('--dh-split')) || DOCS_HERO.split
      const moves = {
        ArrowLeft: now - by,
        ArrowRight: now + by,
        Home: DOCS_HERO.splitMin,
        End: DOCS_HERO.splitMax,
      }
      if (event.key in moves) {
        setSplit(moves[event.key])
        event.preventDefault()
      }
    })
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    /* the row stays where layout() put it: the sites are the point, the
       sliding is the flourish */
    release = () => {
      watcher?.disconnect()
      approach?.disconnect()
      clearTimeout(promptTimer)
      window.removeEventListener('resize', onResize)
    }
    return
  }

  /* A pointer resting on the row stops it drifting, the way the customer
     logo walls stop: moving content that started on its own has to be
     stoppable. A drag still works, and so does the wheel. */
  let resting = false
  const hoverable = window.matchMedia('(hover: hover)')
  field.addEventListener('pointerenter', (event) => {
    resting = event.pointerType === 'mouse' && hoverable.matches
  })
  field.addEventListener('pointerleave', () => {
    resting = false
  })

  let velocity = 0
  const push = (amount) => {
    velocity = Math.max(-DOCS_HERO.maxVelocity, Math.min(DOCS_HERO.maxVelocity, velocity + amount))
  }

  /* The wheel alone, as theirs does. Listening to scroll as well would
     count a wheel twice on a page that can still scroll, and once on one
     that cannot. The page scrolls as it always did: nothing is taken. */
  /* Only while the row runs: friction only acts in its frames, so a wheel
     turned while the row is out of sight would bank speed it then spends
     all at once on the way back, bowing every card. */
  const onWheel = (event) => {
    if (running) {
      push(DOCS_HERO.wheelGain * event.deltaY)
    }
  }
  window.addEventListener('wheel', onWheel, { passive: true })

  let drag = null
  field.addEventListener('pointerdown', (event) => {
    drag = { id: event.pointerId, last: event.clientX }
    try {
      field.setPointerCapture(event.pointerId)
    } catch {
      /* a pointer that has already gone */
    }
    field.classList.add('is-dragging')
  })
  field.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) {
      return
    }
    push(-(DOCS_HERO.dragGain * (event.clientX - drag.last)))
    drag.last = event.clientX
  })
  const endDrag = (event) => {
    if (!drag || drag.id !== event.pointerId) {
      return
    }
    try {
      field.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
    drag = null
    field.classList.remove('is-dragging')
  }
  field.addEventListener('pointerup', endDrag)
  field.addEventListener('pointercancel', endDrag)

  /* The row runs only while it is on screen and the page is in front. A
     background tab paints nothing, and a row that has scrolled away is
     work nobody sees. */
  let running = false
  let inView = false
  let previous = 0
  /* The frame that has already been asked for, if there is one. A tab sent
     to the background stops running its frame callbacks but keeps the last
     one it was given, so a page that is left and come back to still has a
     frame owed to it. Asking for another one on the way back would leave
     two chains of frames driving the row, at twice the speed, and one more
     chain for every visit after that. Holding the handle is how the other
     animations on these pages stay at one. */
  let frame = 0

  const step = (now) => {
    frame = 0
    if (!running) {
      return
    }
    if (!field.isConnected) {
      release()
      return
    }
    const elapsed = Math.min(64, now - previous) || DOCS_HERO_FRAME
    previous = now
    const steps = elapsed / DOCS_HERO_FRAME

    velocity *= DOCS_HERO.friction ** steps
    if (Math.abs(velocity) < 0.001) {
      velocity = 0
    }
    /* their travel for one sixtieth of a second, which is also the bow;
       taking it per sixtieth rather than per frame keeps a 120 Hz screen
       showing the same slide as a 60 Hz one */
    const drift = resting ? 0 : DOCS_HERO.drift
    const bow = 0.005 * velocity * DOCS_HERO.wheelFactor * DOCS_HERO.wheelDirection * unit + drift
    place(bow * steps, bow)
    frame = requestAnimationFrame(step)
  }

  const sync = () => {
    if (!field.isConnected) {
      release()
      return
    }
    const wanted = inView && !document.hidden
    if (wanted === running) {
      return
    }
    running = wanted
    if (promptText) {
      promptLive = running
      promptBox.classList.toggle('is-idle', !running)
      if (!running) {
        clearTimeout(promptTimer)
        promptFace = -1
      }
    }
    if (running) {
      /* the time the tab spent away is not travel the row has to make up */
      previous = performance.now()
      if (!frame) {
        frame = requestAnimationFrame(step)
      }
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        inView = entry.isIntersecting
      })
      sync()
    },
    { threshold: 0 },
  )
  observer.observe(field)
  document.addEventListener('visibilitychange', sync)
  docsHeroSyncs.add(sync)
  release = () => {
    running = false
    observer.disconnect()
    watcher?.disconnect()
    approach?.disconnect()
    clearTimeout(promptTimer)
    docsHeroSyncs.delete(sync)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('wheel', onWheel)
    document.removeEventListener('visibilitychange', sync)
  }
})

initFooterMeadow()
initCustomerBalls()
initLandingOnboard()
initLandingFlow()
initTrustedWalls()
initEnterpriseSky()
measureDocsHero()
/* a hero with no field has nothing else watching the window: initDocsHero stops before it listens.
   Under reduced motion the site gives everything a .01ms transition, so the column only reaches its
   new box on the second frame, and has to be measured again there. */
window.addEventListener('resize', () => {
  measureDocsHero()
  requestAnimationFrame(() => requestAnimationFrame(measureDocsHero))
})
initDocsHero()

const observer = new MutationObserver((records) => {
  if (!records.some((r) => r.addedNodes.length)) {
    return
  }

  // the page that has just been replaced lets go of what it bound, before
  // the initialisers below bind the one that replaced it
  sweepLanding()
  initFooterMeadow()
  initCustomerBalls()
  initLandingOnboard()
  initLandingFlow()
  initTrustedWalls()
  initEnterpriseSky()
  docsHeroSyncs.forEach((sync) => sync())
  measureDocsHero()
  /* the same late column as on a resize: under reduced motion, a hero arriving from a page laid out
     differently is still on its way to its box here */
  requestAnimationFrame(() => requestAnimationFrame(measureDocsHero))
  initDocsHero()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

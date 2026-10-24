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

/* Draggable Elements */
const initDraggableElements = debounce(() => {
  const draggables = document.querySelectorAll('.draggable')
  if (!draggables.length) {
    return
  }

  let isDragging = !1,
    currentDraggable = null,
    dragOffsetX = 0,
    dragOffsetY = 0,
    highestZIndex = 1e3
  function getContainingBlockOffset(t) {
    const e = t.offsetParent || document.documentElement,
      n = e.getBoundingClientRect()
    return { left: n.left, top: n.top }
  }
  function updateLightPosition(t, e) {
    const n = document.querySelectorAll('.draggable')
    n.forEach((n, r) => {
      const g = n.getBoundingClientRect()
      const i = t - g.left
      const l = e - g.top
      const a = t >= g.left && t <= g.right && e >= g.top && e <= g.bottom
      if (a) {
        const o = Array.from(n.classList).find((t) => t.startsWith('sticker-')),
          s = o ? o.split('-')[1] : r + 1,
          f = document.getElementById(`light${s}`),
          u = document.getElementById(`lightFlipped${s}`)
        f && (f.setAttribute('x', i), f.setAttribute('y', l)),
          u && (u.setAttribute('x', i), u.setAttribute('y', g.height - l))
      }
    })
  }
  function bringToFront(t) {
    highestZIndex++, (t.style.zIndex = highestZIndex)
  }
  function startDrag(t) {
    ;(isDragging = !0), (currentDraggable = t.currentTarget)
    const e = currentDraggable.getBoundingClientRect(),
      n = getContainingBlockOffset(currentDraggable)
    ;(dragOffsetX = t.clientX - e.left),
      (dragOffsetY = t.clientY - e.top),
      (currentDraggable.style.left = e.left - n.left + 'px'),
      (currentDraggable.style.top = e.top - n.top + 'px')
  }
  function updateDragPosition(t) {
    if (isDragging && currentDraggable) {
      const e = getContainingBlockOffset(currentDraggable)
      ;(currentDraggable.style.left = t.clientX - dragOffsetX - e.left + 'px'),
        (currentDraggable.style.top = t.clientY - dragOffsetY - e.top + 'px')
    }
  }
  function stopDrag() {
    isDragging = !1
  }
  draggables.forEach((t) => {
    t.addEventListener('mousedown', startDrag),
      t.addEventListener('mouseenter', () => {
        bringToFront(t)
      })
  }),
    document.addEventListener('mouseup', stopDrag),
    document.addEventListener('mousemove', (t) => {
      updateLightPosition(t.clientX, t.clientY), updateDragPosition(t)
    })
})

/* Footer Animation */
function setFooterAnimationActive(item) {
  const items = document.querySelectorAll('.footer-animation .fa i')

  items.forEach((target) => target.classList.remove('active'))
  item.classList.add('active')
}

document.addEventListener(
  'mouseover',
  (event) => {
    const item = event.target.closest?.('.footer-animation .fa i')
    if (!item) {
      return
    }

    setFooterAnimationActive(item)
  },
  { passive: true },
)

const initFooterAnimation = debounce(() => {
  const items = document.querySelectorAll('.footer-animation .fa i')
  if (!items.length) {
    return
  }

  items.forEach((item) => {
    if (item.dataset.footerAnimationBound === 'true') {
      return
    }

    item.dataset.footerAnimationBound = 'true'
    item.addEventListener('mouseenter', () => {
      setFooterAnimationActive(item)
    })
    item.addEventListener('mouseover', () => {
      setFooterAnimationActive(item)
    })
  })
})

/* Slide Gallery */
const initGallery = debounce(() => {
  const buttons = document.querySelectorAll('button[data-target^="#slide-"]')
  const slides = document.querySelectorAll('[id^="slide-"]')
  const gallery = document.querySelector('#gallery')

  let observerPaused = false

  if (!buttons.length || !slides.length || !gallery) {
    return
  }

  buttons.forEach((button) => {
    button.addEventListener('click', function () {
      const target = document.querySelector(this.getAttribute('data-target'))

      observerPaused = true
      buttons.forEach((button) => button.classList.remove('active'))
      this.classList.add('active')

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      }
    })
  })

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const isMobile = window.innerWidth < 540

        if (isMobile ? entry.intersectionRatio > 0.5 : entry.intersectionRatio === 1) {
          const slideId = entry.target.id

          const button = document.querySelector(`button[data-target^="#${slideId}"]`)

          if (button?.classList.contains('active')) {
            observerPaused = false
          }

          if (observerPaused) {
            return
          }

          buttons.forEach((button) => {
            if (button.getAttribute('data-target') === `#${slideId}`) {
              button.classList.add('active')
            } else {
              button.classList.remove('active')
            }
          })
        }
      })
    },
    {
      root: gallery,
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '0px',
    },
  )

  slides.forEach((slide) => observer.observe(slide))
})

/* Hero SDK language tabs (per glass card, so every scene's card works) */
const initHeroSdkTabs = debounce(() => {
  const cards = document.querySelectorAll('.hero-glass')
  if (!cards.length) {
    return
  }

  cards.forEach((card) => {
    const buttons = card.querySelectorAll('.hero-glass-tabs button[data-sdk-lang]')
    const panels = card.querySelectorAll('.hero-glass-codewrap[data-sdk-lang]')
    if (!buttons.length || !panels.length) {
      return
    }

    buttons.forEach((button) => {
      if (button.dataset.sdkTabsBound === 'true') {
        return
      }

      button.dataset.sdkTabsBound = 'true'
      button.addEventListener('click', () => {
        buttons.forEach((other) => other.classList.toggle('active', other === button))

        const current = card.querySelector('.hero-glass-codewrap:not(.is-hidden)')
        const target = [...panels].find((panel) => panel.dataset.sdkLang === button.dataset.sdkLang)
        if (!target || target === current) {
          return
        }

        // The code area is a fixed-height scroller now: no height animation,
        // just land the new language scrolled to the top
        panels.forEach((panel) => panel.classList.toggle('is-hidden', panel !== target))
        target.scrollTop = 0
      })
    })
  })
})

/* Hero scene switcher (Profound SDK / Zoom API). Inactive scene panels are
   detached from the DOM entirely, so only one background is rendered at a time. */
const initHeroScenes = debounce(() => {
  const strip = document.querySelector('.hero-tabs')
  const visual = document.querySelector('.hero-visual')
  if (!strip || !visual) {
    return
  }

  const buttons = strip.querySelectorAll('button[data-hero-scene]')
  const panels = [...visual.querySelectorAll('[data-hero-scene-panel]')]
  if (!buttons.length || !panels.length) {
    return
  }

  const registry = (window.__heroScenePanels = window.__heroScenePanels || new Map())

  panels.forEach((panel) => {
    if (panel.dataset.heroSceneAnchored === 'true') {
      return
    }

    panel.dataset.heroSceneAnchored = 'true'
    panel.classList.remove('scene-hidden')
    const scene = panel.dataset.heroScenePanel
    const anchor = document.createComment(`hero-scene:${scene}`)
    panel.before(anchor)
    const list = registry.get(scene) || []
    list.push({ panel, anchor })
    registry.set(scene, list)
  })

  const showScene = (scene) => {
    registry.forEach((list, key) => {
      // Drop entries whose anchors were removed by a re-render
      const alive = list.filter((entry) => entry.anchor.isConnected)
      registry.set(key, alive)

      alive.forEach(({ panel, anchor }) => {
        if (key === scene) {
          if (!panel.isConnected) {
            anchor.after(panel)
          }
        } else if (panel.isConnected) {
          panel.remove()
        }
      })
    })
  }

  buttons.forEach((button) => {
    if (button.dataset.heroScenesBound === 'true') {
      return
    }

    button.dataset.heroScenesBound = 'true'
    button.addEventListener('click', () => {
      buttons.forEach((other) => other.classList.toggle('active', other === button))
      showScene(button.dataset.heroScene)
    })
  })

  const active = strip.querySelector('button.active[data-hero-scene]') || buttons[0]
  showScene(active.dataset.heroScene)
})

/* Hero cards: hover affordance, and a view-transitioned popup on click.
   The real cell node is moved into the overlay rather than cloned, so the
   artwork's turbulence filters are never re-run and the browser has a single
   element to morph. View transitions animate static snapshots on the
   compositor, which is what keeps this at 60fps despite the heavy SVG. */
const initHeroCards = debounce(() => {
  const grid = document.querySelector('.hero-grid')
  if (!grid) {
    return
  }

  const cells = grid.querySelectorAll('.hero-cell')
  if (!cells.length) {
    return
  }

  let overlay = document.querySelector('.hero-modal')
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.className = 'hero-modal'
    overlay.hidden = true
    overlay.innerHTML =
      '<div class="hero-modal-scrim"></div>' +
      '<div class="hero-modal-stage"></div>' +
      '<button type="button" class="hero-modal-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
    document.body.appendChild(overlay)
  }
  const stage = overlay.querySelector('.hero-modal-stage')

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const animate = (update) => {
    if (reduced.matches || !document.startViewTransition) {
      update()
      return Promise.resolve()
    }
    const transition = document.startViewTransition(update)
    // an aborted transition rejects ready/updateCallbackDone as well as
    // finished; leaving those unhandled logs InvalidStateError noise
    const hush = () => {
      // Aborted view transitions are expected when navigation interrupts an animation.
    }
    transition.ready.catch(hush)
    transition.updateCallbackDone.catch(hush)
    return transition.finished.catch(hush)
  }

  let open = null
  let anchor = null
  let natural = null
  let cellIndex = 0
  let busy = false

  /* One transition at a time. Without this, clicking again mid-animation
     aborts the running transition and desyncs `open` from the DOM, leaving a
     card on screen that no close path can dismiss. */
  const settle = (promise) => {
    busy = true
    return Promise.resolve(promise)
      .catch(() => {
        // Always release the animation lock, including when a transition is interrupted.
      })
      .finally(() => {
        busy = false
      })
  }

  /* Scale the opened card with zoom rather than transform: zoom re-lays the
     card out at the larger size, so the vector art and code stay crisp. */
  const fit = (cell) => {
    if (!natural) {
      return
    }
    const factor = Math.min((window.innerWidth * 0.92) / natural.w, (window.innerHeight * 0.86) / natural.h, 2.6)
    cell.style.zoom = Math.max(1, factor)
  }

  const openCard = (cell) => {
    if (open || busy) {
      return
    }

    const rect = cell.getBoundingClientRect()
    natural = { w: rect.width, h: rect.height }
    anchor = document.createComment('hero-cell')
    cell.before(anchor)
    // index is the fallback of last resort: anchors and the grid element
    // itself can both be replaced if the app re-renders while a card is open
    cellIndex = [...cell.parentElement.children].indexOf(cell)
    cell.dataset.heroCellOpen = 'true'
    cell.style.viewTransitionName = 'hero-card'
    open = cell

    void settle(
      animate(() => {
        stage.appendChild(cell)
        overlay.hidden = false
        document.documentElement.style.overflow = 'hidden'
        // outside the grid there is no column to size against, and every child
        // is absolutely positioned, so the card needs its width carried over
        cell.style.width = `${natural.w}px`
        fit(cell)
      }),
    ).then(() => {
      const close = overlay.querySelector('.hero-modal-close')
      if (close && open) {
        close.focus({ preventScroll: true })
      }
    })
  }

  /* Put the card back in the document, whatever happened while it was open.
     Re-queries the grid every time: the captured element can be detached by a
     re-render, and appending to a detached node makes the card disappear. */
  const restore = (cell) => {
    const liveGrid = document.querySelector('.hero-grid') || grid
    if (anchor?.isConnected) {
      anchor.replaceWith(cell)
    } else if (liveGrid) {
      const at = liveGrid.children[cellIndex]
      if (at) {
        liveGrid.insertBefore(cell, at)
      } else {
        liveGrid.appendChild(cell)
      }
    }
  }

  const closeCard = () => {
    // recover if a previous run desynced: the stage still holds a card
    if (!open) {
      open = stage.querySelector('.hero-cell')
    }
    if (!open || busy) {
      return
    }
    const cell = open
    open = null

    void settle(
      animate(() => {
        cell.style.zoom = ''
        cell.style.width = ''
        restore(cell)
        anchor = null
        overlay.hidden = true
        document.documentElement.style.overflow = ''
      }),
    ).then(() => {
      delete cell.dataset.heroCellOpen
      cell.style.viewTransitionName = ''
      // last line of defence: if the card is not in the live grid by now,
      // put it there. A visible card is always better than a lost one.
      if (!cell.isConnected || !cell.closest('.hero-grid')) {
        anchor = null
        restore(cell)
      }
    })
  }

  if (overlay.dataset.heroModalBound !== 'true') {
    overlay.dataset.heroModalBound = 'true'
    overlay.addEventListener('click', (event) => {
      // anywhere off the card closes: the scrim, the gap around it, or the X
      if (event.target.closest('.hero-modal-close') || !event.target.closest('.hero-cell')) {
        closeCard()
      }
    })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeCard()
      }
    })
    window.addEventListener('resize', () => {
      if (open) {
        fit(open)
      }
    })
  }

  cells.forEach((cell) => {
    if (cell.dataset.heroCardBound === 'true') {
      return
    }
    cell.dataset.heroCardBound = 'true'
    cell.setAttribute('role', 'button')
    cell.setAttribute('tabindex', '0')

    cell.addEventListener('click', (event) => {
      // an opened card is just content; its language tabs keep working
      if (cell.dataset.heroCellOpen === 'true') {
        return
      }
      // and in the grid, a language tab is a tab, not a card click
      if (event.target.closest('.hero-glass-tabs')) {
        return
      }
      openCard(cell)
    })

    cell.addEventListener('keydown', (event) => {
      if (cell.dataset.heroCellOpen === 'true') {
        return
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openCard(cell)
      }
    })
  })
})

/* Landing boxes: a click on a product box in the hero drawing scrolls to
   that product's section. */
const initLandingBoxLinks = debounce(() => {
  const boxes = [...document.querySelectorAll('[data-lp-target]')].filter((box) => box.dataset.lpBoxBound !== 'true')
  if (!boxes.length) {
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  boxes.forEach((box) => {
    box.dataset.lpBoxBound = 'true'
    box.addEventListener('click', (event) => {
      const section = document.getElementById(`lp-${box.dataset.lpTarget}`)
      if (!section) {
        return
      }

      event.preventDefault()

      const header = Number.parseFloat(getComputedStyle(section).getPropertyValue('--scalar-header-height')) || 48
      const top = section.getBoundingClientRect().top + window.scrollY - header
      window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' })
    })
  })
})

/* MCP chat: plays the conversation (prompt, thinking, tool steps, reply,
   then the next prompt typed and sent), after the chat mockup on
   equals.com. Without the script, or with reduced motion, the finished
   conversation shows. */
const createLandingChatPlayer = (chat) => {
  const messages = chat.querySelector('.lp-chat-messages')
  const composer = chat.querySelector('.lp-chat-composer')
  const placeholder = chat.querySelector('.lp-chat-placeholder')
  const send = chat.querySelector('.lp-chat-send')
  const turns = [...chat.querySelectorAll('.lp-chat-turn')]
  if (!messages || !composer || !placeholder || !turns.length) {
    return null
  }

  const idleText = placeholder.textContent
  const timers = new Set()
  const later = (fn, ms) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, ms)
    timers.add(id)
  }
  const clearTimers = () => {
    timers.forEach((id) => {
      window.clearTimeout(id)
      window.clearInterval(id)
    })
    timers.clear()
  }

  // keeps the newest line in view
  const reveal = (el) => {
    const over = el.getBoundingClientRect().bottom - messages.getBoundingClientRect().bottom + 20
    if (over > 0) {
      messages.scrollTop += over
    }
  }

  // the old text lifts and blurs out while the new one rises in
  const swap = (think, text, delay = 25) => {
    const old = think.querySelector('.lp-chat-think-text')
    old.classList.add('is-exit')
    const next = document.createElement('span')
    next.className = 'lp-chat-think-text is-enter-start'
    next.textContent = text
    next.setAttribute('data-text', text)
    think.appendChild(next)
    later(() => {
      void next.offsetWidth
      next.classList.remove('is-enter-start')
    }, delay)
    later(() => old.remove(), 150 + delay)
  }

  // a thinking or tool line starts: running text, shimmer on
  const start = (line) => {
    const think = line.querySelector('.lp-chat-think')
    const text = think.querySelector('.lp-chat-think-text')
    line.classList.remove('is-done')
    text.textContent = think.dataset.running
    text.setAttribute('data-text', think.dataset.running)
    think.classList.add('is-running')
    return think
  }

  // ...and settles: shimmer off, done text in
  const settle = (line, delay) => {
    const think = line.querySelector('.lp-chat-think')
    think.classList.remove('is-running')
    line.classList.add('is-settling')
    later(() => line.classList.add('is-done'), 150)
    swap(think, think.dataset.done, delay)
  }

  // every step does its thing and returns how long to wait for the next
  const steps = []
  turns.forEach((turn, index) => {
    const prompt = turn.querySelector('.lp-chat-prompt')
    const thinking = turn.querySelector('.lp-chat-thinking')
    const tool = turn.querySelector('.lp-chat-tool')
    const toolSteps = [...turn.querySelectorAll('.lp-chat-step')]
    const lines = [...turn.querySelectorAll('.lp-chat-line')]
    const spark = turn.querySelector('.lp-chat-spark')

    if (index > 0) {
      const text = prompt.textContent.trim()
      let typing = 0
      steps.push(() => {
        placeholder.classList.add('is-typing')
        composer.classList.add('is-composing')
        placeholder.textContent = ''
        let typed = 0
        const id = window.setInterval(() => {
          typed += 1
          placeholder.textContent = text.slice(0, typed)
          if (typed >= text.length) {
            window.clearInterval(id)
            timers.delete(id)
          }
        }, 22)
        timers.add(id)
        typing = id
        return 700 + 22 * text.length + 250
      })
      steps.push(() => {
        // A background tab runs the typing interval at most once a second, so
        // it can outlast its step and type over the idle text; stop it here
        window.clearInterval(typing)
        timers.delete(typing)
        send.classList.add('is-pressed')
        later(() => {
          placeholder.classList.remove('is-typing')
          composer.classList.remove('is-composing')
          placeholder.textContent = idleText
          send.classList.remove('is-pressed')
        }, 130)
        return 130
      })
    }

    steps.push(() => {
      if (index > 0) {
        const previous = turns[index - 1].querySelector('.lp-chat-spark')
        if (previous) {
          previous.classList.add('is-out')
        }
      }
      prompt.classList.add('is-in')
      reveal(prompt)
      return 300
    })

    if (thinking) {
      steps.push(() => {
        start(thinking)
        thinking.classList.add('is-in')
        reveal(thinking)
        return 650
      })
    }

    if (tool) {
      let toolThink = null
      steps.push(() => {
        toolThink = start(tool)
        tool.classList.add('is-open', 'is-in')
        reveal(tool)
        return 650
      })
      toolSteps.forEach((step) => {
        steps.push(() => {
          step.classList.add('is-in')
          reveal(step)
          return 450
        })
      })
      steps.push(() => {
        toolThink.classList.remove('is-running')
        swap(toolThink, toolThink.dataset.done)
        tool.classList.remove('is-open')
        later(() => tool.classList.add('is-done'), 175)
        if (thinking) {
          later(() => settle(thinking, 150), 250)
        }
        return 870
      })
    } else if (thinking) {
      steps.push(() => {
        settle(thinking, 150)
        return 400
      })
    }

    if (spark) {
      steps.push(() => {
        spark.classList.add('is-in', 'is-working')
        reveal(spark)
        return 200
      })
    }

    lines.forEach((line) => {
      steps.push(() => {
        line.classList.add('is-laid-out')
        void line.offsetWidth
        line.classList.add('is-in')
        reveal(line)
        return 300
      })
    })

    if (spark) {
      steps.push(() => {
        spark.classList.remove('is-working')
        return 0
      })
    }
  })

  const step = (index) => {
    if (index >= steps.length) {
      return
    }
    const wait = steps[index]()
    later(() => step(index + 1), wait)
  }

  // back to the finished conversation, with nothing shown yet
  const reset = () => {
    clearTimers()
    chat.querySelectorAll('[class*="is-"]').forEach((el) => {
      ;[...el.classList].filter((name) => name.startsWith('is-')).forEach((name) => el.classList.remove(name))
    })
    chat.querySelectorAll('.lp-chat-thinking, .lp-chat-tool').forEach((line) => line.classList.add('is-done'))
    chat.querySelectorAll('.lp-chat-think').forEach((think) => {
      const texts = [...think.querySelectorAll('.lp-chat-think-text')]
      texts.slice(0, -1).forEach((text) => text.remove())
      const text = texts[texts.length - 1]
      text.className = 'lp-chat-think-text'
      text.textContent = think.dataset.done
      text.setAttribute('data-text', think.dataset.done)
    })
    placeholder.textContent = idleText
    messages.scrollTop = 0
  }

  const play = () => {
    reset()
    chat.classList.add('is-armed')
    later(() => step(0), 450)
  }

  return { play, stop: clearTimers }
}

/* The agent globes in the hero: each a glass ball with the agent's mark
   and name standing on its equator, turning. The ring is built here from
   the name's kerned advances, so the word wraps the ball; every globe
   starts at its own angle. The globes are planets: each travels its own
   tilted orbit round the copy (the orbit paths are the ellipses in the
   field's svg, laid out from where the copy and its lines land, and wider
   than the column where the column is too narrow to clear them), in front
   of the copy across the front and behind it round the back. A
   hovered globe holds still and eases its mark to the front (its bubble
   is CSS). */
const LANDING_ORB_TURN = 3000
/* the two orbits: the long radius as a share of half the field's width,
   the short one as a share of the long (the tilt), and seconds a lap;
   then each planet's orbit and where it starts (in laps), in the order
   the globes stand in the markup */
const LANDING_ORBITS = [
  { share: 0.93, flat: 0.46, lap: 36 },
  { share: 1, flat: 0.42, lap: 54 },
]
const LANDING_PLANETS = [
  { orbit: 0, start: 0.05 },
  { orbit: 1, start: 0.22 },
  { orbit: 0, start: 0.38 },
  { orbit: 1, start: 0.88 },
  { orbit: 0, start: 0.72 },
  { orbit: 1, start: 0.55 },
]
/* how long a pointer rests on a planet before the button flies (a
   pointer only crossing the planet gets the bubble and no more), then
   the talk's turns, in ms from the flight: whose bubble, and what it
   shows (the dots, or which of its lines) */
const LANDING_TALK_INTENT = 300
const LANDING_TALK = [
  [500, 'sun', 'typing'],
  [1300, 'sun', 0],
  [2300, 'orb', 'typing'],
  [2900, 'orb', 1],
  [3900, 'sun', 'typing'],
  [4500, 'sun', 1],
]
const landingMeasure = document.createElement('canvas').getContext('2d')
let landingDressCopies = 0
/* a globe's dressing: a copy of its mark (with gradient ids of its
   own, as one mark can stand on two globes), a gap and the glyphs
   of its name round the ring's equator, the word centred on the
   front; the angles hold whatever size the globe takes, as the type
   scales with it */
const dressLandingGlobe = (globe, ring, size) => {
  const template = document.getElementById(`lp-icon-${globe.dataset.icon}`)
  const label = globe.dataset.label || ''
  if (!template) {
    return false
  }
  const suffix = `-o${++landingDressCopies}`
  const holder = document.createElement('div')
  holder.innerHTML = template.innerHTML
    .replace(/id="([^"]+)"/g, `id="$1${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`)
  const icon = holder.firstElementChild
  // the name's metrics, from a probe glyph in the ring's own style
  const probe = document.createElement('span')
  probe.className = 'lp-orb-glyph'
  probe.textContent = 'x'
  ring.appendChild(probe)
  const style = getComputedStyle(probe)
  landingMeasure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
  const type = Number.parseFloat(style.fontSize)
  const tracking = Number.parseFloat(style.letterSpacing) || 0
  probe.remove()
  // the mark, a gap and the glyphs on a line first, with the kerned
  // advances the whole word has
  const iconWidth = type * 1.15
  const items = [{ node: icon, x: 0, w: iconWidth }]
  let x = iconWidth + type * 0.32
  for (let i = 0; i < label.length; i++) {
    const w = landingMeasure.measureText(label[i]).width + tracking
    const advance =
      landingMeasure.measureText(label.slice(0, i + 1)).width -
      landingMeasure.measureText(label.slice(0, i)).width +
      tracking
    const span = document.createElement('span')
    span.textContent = label[i]
    items.push({ node: span, x, w })
    x += advance
  }
  const total = x
  // then round the equator: each item's middle on the ring at the
  // angle its arc position gives
  items.forEach(({ node, x: at, w }) => {
    const item = document.createElement('span')
    item.className = 'lp-orb-item'
    const glyph = document.createElement('span')
    glyph.className = 'lp-orb-glyph'
    glyph.appendChild(node)
    item.appendChild(glyph)
    const angle = ((at + w / 2 - total / 2) / size) * 2 * (180 / Math.PI)
    item.style.setProperty('--a', `${angle}deg`)
    ring.appendChild(item)
  })
  return true
}
const initLandingOrbs = debounce(() => {
  const fields = [...document.querySelectorAll('.lp-orbs')].filter((field) => field.dataset.lpOrbsBound !== 'true')
  if (!fields.length) {
    return
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  fields.forEach((field) => {
    field.dataset.lpOrbsBound = 'true'
    const hero = field.parentElement
    const paths = [...field.querySelectorAll('.lp-orbit')]
    const orbs = [...field.querySelectorAll('.lp-orb')]
      .map((orb, index, all) => {
        const ring = orb.querySelector('.lp-orb-ring')
        const size = Number.parseFloat(getComputedStyle(orb).getPropertyValue('--s'))
        if (!ring || !size || !dressLandingGlobe(orb, ring, size)) {
          return null
        }
        const bubble = orb.querySelector('.lp-orb-bubble')
        return {
          orb,
          ring,
          size,
          bubble,
          // the planet's lines, and Scalar's replies to them
          lines: bubble ? [...bubble.querySelectorAll('.lp-say')] : [],
          says: [...orb.querySelectorAll('.lp-orb-says > span')],
          planet: LANDING_PLANETS[index % LANDING_PLANETS.length],
          angle: reduceMotion ? 0 : (index * 360) / all.length,
          target: null,
          hover: false,
          lapTime: 0,
          z: null,
        }
      })
      .filter(Boolean)
    if (!orbs.length) {
      return
    }
    /* the Scalar globe in the onboard button, dressed like the planets;
       it shows while a planet talks */
    const button = hero.querySelector('[data-lp-onboard]')
    const sun = button?.querySelector('.lp-sun')
    const sunRing = sun?.querySelector('.lp-orb-ring')
    let sunSize = sun ? Number.parseFloat(getComputedStyle(sun).getPropertyValue('--s')) : 0
    const hasSun = Boolean(sunRing && sunSize && dressLandingGlobe(sun, sunRing, sunSize))
    let sunAngle = 0

    /* The orbits: the sun is the copy's middle. Each orbit's long radius
       is its share of half the field and the short one its share of
       that, held back so the largest planet on it never reaches the logo
       strip at the front nor leaves the field at the back; then, where
       that would run the planets through the heading, the lede or the
       buttons, the orbit widens past the column until it clears their
       boxes (main clips the overflow). The inner orbit stays inside the
       outer. Laid out again when the field changes size. */
    let geo = null
    const layout = () => {
      const box = field.getBoundingClientRect()
      const sun = hero.querySelector('.lp-copy')?.getBoundingClientRect() ?? box
      const foot = hero.querySelector('.lp-hero-foot')?.getBoundingClientRect()
      const cx = sun.left + sun.width / 2 - box.left
      const cy = sun.top + sun.height / 2 - box.top
      // where the planets get clipped: the content box (the page clips
      // at the sidebar's edge) within the viewport, in the field's frame
      const clip = field.closest('.page-content')?.getBoundingClientRect()
      const clipL = Math.max(clip?.left ?? 0, 0) - box.left
      const clipR = Math.min(clip?.right ?? window.innerWidth, window.innerWidth) - box.left
      const floor = (foot ? foot.top : box.bottom) - box.top
      // the lines of the copy, each as its reach from the sun
      const lines = [...hero.querySelectorAll('.hero > *')].map((el) => {
        const r = el.getBoundingClientRect()
        return {
          a: Math.max(Math.abs(r.left - box.left - cx), Math.abs(r.right - box.left - cx)),
          b: Math.max(Math.abs(r.top - box.top - cy), Math.abs(r.bottom - box.top - cy)),
        }
      })
      orbs.forEach((o) => {
        if (o.away) {
          return
        }
        o.size = Number.parseFloat(getComputedStyle(o.orb).getPropertyValue('--s')) || o.size
        // the bubble's width, for keeping it inside the content box
        o.bw = o.orb.querySelector('.lp-orb-bubble')?.offsetWidth || 250
      })
      const rings = LANDING_ORBITS.map((orbit, index) => {
        const largest = Math.max(...orbs.filter((o) => o.planet.orbit === index).map((o) => o.size), 0)
        const reach = largest / 2 + 6
        const room = Math.min(floor - cy - reach - 2, cy - reach)
        const span = (orbit.share * box.width) / 2
        const tallest = Math.max(...lines.map((l) => l.b + reach), 0)
        let ry = Math.min(orbit.flat * span, room)
        if (ry <= tallest + 6) {
          ry = Math.min(room, tallest + 12)
        }
        const clear = Math.max(
          ...lines.map((l) => {
            const b = l.b + reach
            return b < ry ? (l.a + reach) / Math.sqrt(1 - (b / ry) ** 2) : (l.a + reach) * 3
          }),
          0,
        )
        return { rx: Math.max(span, clear * 1.03), ry: Math.max(40, ry) }
      })
      for (let i = 1; i < rings.length; i++) {
        rings[i].rx = Math.max(rings[i].rx, rings[i - 1].rx + 36)
        if (rings[i].ry < rings[i - 1].ry + 6) {
          rings[i - 1].ry = rings[i].ry - 6
        }
      }
      geo = { cx, cy, rings, clipL, clipR }
      const svg = field.querySelector('.lp-orbits')
      svg?.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`)
      paths.forEach((path, i) => {
        const r = rings[i]
        if (!r) {
          return
        }
        path.setAttribute('cx', cx.toFixed(1))
        path.setAttribute('cy', cy.toFixed(1))
        path.setAttribute('rx', r.rx.toFixed(1))
        path.setAttribute('ry', r.ry.toFixed(1))
      })
    }
    // a planet's place on its orbit: in front of the copy across the
    // front (the lower half of the ellipse), behind it round the back;
    // the same size throughout, so its name and bubble read the same
    // wherever it is. The move is a translate, composited on the
    // globe's own layer, never a layout; the stacking changes only at
    // the two crossings
    const place = (o) => {
      if (o.away) {
        return
      }
      const r = geo.rings[o.planet.orbit]
      const orbit = LANDING_ORBITS[o.planet.orbit]
      const theta = 2 * Math.PI * (o.planet.start + o.lapTime / orbit.lap)
      const depth = (Math.sin(theta) + 1) / 2
      const x = geo.cx + r.rx * Math.cos(theta) - o.size / 2
      const y = geo.cy + r.ry * Math.sin(theta) - o.size / 2
      o.orb.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
      const z = o.hover ? '4' : depth >= 0.5 ? '3' : '0'
      if (o.z !== z) {
        o.z = z
        o.orb.style.zIndex = z
      }
      // the bubble opens towards the copy, so it never runs off the
      // content's edge: leftwards from a planet on the right half of
      // its orbit, rightwards from one on the left; and where the
      // planet itself is clipped at that edge, the bubble is nudged
      // back inside. Left alone while hovered, so a shown bubble never
      // jumps
      if (o.hover) {
        return
      }
      const west = Math.cos(theta) >= 0
      if (o.west !== west) {
        o.west = west
        o.orb.classList.toggle('lp-orb--left', west)
      }
      // the bubble's span before any nudge, from the planet's centre
      // leftwards or rightwards; the nudge keeps both ends inside, the
      // far end first where the box is too narrow for both
      const mid = x + o.size / 2
      const span = west ? [mid - o.bw, mid] : [mid, mid + o.bw]
      // written on the bubble itself (a custom property on the planet
      // would restyle its whole ring), in 4px steps, so a clipped planet
      // writes it on few frames
      const shift =
        Math.round(
          (west
            ? Math.max(Math.min(0, geo.clipR - 12 - span[1]), geo.clipL + 12 - span[0])
            : Math.min(Math.max(0, geo.clipL + 12 - span[0]), geo.clipR - 12 - span[1])) / 4,
        ) * 4
      if (o.shift !== shift) {
        o.shift = shift
        o.bubble?.style.setProperty('--bubble-shift', `${shift}px`)
      }
    }
    /* The talk. A hovered planet holds its place and its bubble opens;
       the onboard button flies to the galaxy's centre, becoming the
       Scalar globe on the way, and the two speak by turns, Scalar's
       lines in a bubble of its own in the field (over every planet),
       under the globe. The talk ends the moment the pointer leaves the
       planet, whichever way, and everything flies back. The globe is
       still the button, so a copy (from the keyboard) ends the talk on
       Scalar's side with the paste line. A planet without replies just
       shows its bubble. */
    const sunBubble = document.createElement('div')
    sunBubble.className = 'lp-sun-bubble'
    sunBubble.innerHTML =
      '<span class="lp-say is-on"></span><span class="lp-typing" aria-hidden="true"><i></i><i></i><i></i></span>'
    const sunSay = sunBubble.querySelector('.lp-say')
    // Saturn's ring, in two halves: the back one under the copy, the
    // front one over it. It wraps the pill in the row, and the globe at
    // the centre for a talk
    const halos = ['', ' lp-sun-halo--front'].map((kind) => {
      const halo = document.createElement('div')
      halo.className = `lp-sun-halo${kind}`
      halo.innerHTML = '<div class="lp-sun-halo-reveal"><div class="lp-sun-halo-paint"></div></div>'
      return halo
    })
    if (hasSun) {
      field.append(...halos, sunBubble)
    }
    // the ring's own half-size comes off in the translate, which runs
    // before the tilt, so the tilt turns the ring about its centre
    const placeHalos = (x, y) => {
      halos.forEach((halo) => {
        halo.style.translate = `calc(${x.toFixed(1)}px - 50%) calc(${y.toFixed(1)}px - 50%)`
      })
    }
    // on the pill: 6px beyond it on every side
    const haloHome = () => {
      if (!hasSun || home) {
        return
      }
      const box = field.getBoundingClientRect()
      const b = button.getBoundingClientRect()
      halos.forEach((halo) => {
        halo.style.setProperty('--hw', `${(b.width + 12).toFixed(1)}px`)
        halo.style.setProperty('--hh', `${(b.height + 12).toFixed(1)}px`)
      })
      placeHalos(b.left + b.width / 2 - box.left, b.top + b.height / 2 - box.top)
    }
    let talk = null
    // a bubble shows the dots, or one of its lines
    const say = (bubble, lines, what) => {
      bubble.classList.toggle('is-typing', what === 'typing')
      if (what !== 'typing') {
        lines.forEach((line, i) => line.classList.toggle('is-on', i === what))
      }
    }
    // Scalar's bubble under the globe's lower edge at the galaxy's
    // centre, opening sideways from its middle: away from the planet
    // first, then towards it, and lower if both would cover the planet
    // or its bubble (the planet holds still for the talk, so this is
    // settled once); each way nudged back inside the content box like
    // the planets' bubbles
    const placeSun = (keepClear) => {
      if (!talk || !hasSun || !geo) {
        return
      }
      const mid = geo.cx
      const top = geo.cy + sunSize * 0.3
      placeHalos(mid, geo.cy)
      const bw = 250
      const bh = 66
      const planetMid = keepClear[0] ? (keepClear[0].l + keepClear[0].r) / 2 : mid
      const starts = planetMid >= mid ? [mid - bw, mid] : [mid, mid - bw]
      const inside = (x0) => x0 + Math.round(Math.min(Math.max(0, geo.clipL + 12 - x0), geo.clipR - 12 - (x0 + bw)))
      const clear = (x, y) => keepClear.every((k) => x + bw <= k.l || x >= k.r || y + bh <= k.t || y >= k.b)
      // under the globe first, away then towards; then over it (the copy
      // is hidden meanwhile, so the room above is free); then lower
      const above = geo.cy - sunSize * 0.3 - bh
      const spots = [
        [starts[0], top],
        [starts[1], top],
        [starts[0], above],
        [starts[1], above],
      ]
      let [start, y] = spots[0]
      let x = inside(start)
      const fit = spots.find(([s0, y0]) => clear(inside(s0), y0))
      if (fit) {
        ;[start, y] = fit
        x = inside(start)
      } else {
        y = Math.max(top, ...keepClear.map((k) => k.b))
      }
      // the tight corner points at the globe: which side it opens to,
      // and whether it is above
      sunBubble.classList.toggle('lp-sun-bubble--left', start === mid - bw)
      sunBubble.classList.toggle('lp-sun-bubble--above', y < top)
      // a bubble opening leftwards hangs from its right edge, so the
      // dots and a short line sit by the globe like a full line does
      sunBubble.style.translate =
        start === mid - bw
          ? `calc(${(x + bw).toFixed(1)}px - 100%) ${y.toFixed(1)}px`
          : `${x.toFixed(1)}px ${y.toFixed(1)}px`
    }
    /* the flight: the button leaves the row at its own offsets, so the
       row is undisturbed, and its box shrinks to the globe's circle as
       a translate takes it to the galaxy's centre; on the way back it
       regrows and returns, and once it has landed it is in the row
       again. The box is set inline both ways (the pill's width is its
       content's), and a flight that starts mid-return carries on from
       wherever the pill is */
    let home = null
    let landing = 0
    const row = button?.parentElement
    const fly = (box, at, start) => {
      window.clearTimeout(landing)
      if (!home && start) {
        // the row holds its box and its items' places meanwhile
        row.style.width = `${start.rw}px`
        row.style.height = `${start.rh}px`
        row.classList.add('is-held')
        button.style.left = `${start.left}px`
        button.style.top = `${start.top}px`
        button.style.width = `${start.w}px`
        button.style.height = `${start.h}px`
        button.classList.add('is-flying')
        // the start box must take before the move (a width that was
        // auto has nothing to move from): the one layout this forces
        home = { left: start.left, top: start.top, w: button.offsetWidth, h: button.offsetHeight }
      }
      const dx = box.left + geo.cx - (at.left + home.left + sunSize / 2)
      const dy = box.top + geo.cy - (at.top + home.top + sunSize / 2)
      button.style.width = `${sunSize}px`
      button.style.height = `${sunSize}px`
      button.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`
    }
    const land = () => {
      if (!home) {
        return
      }
      button.style.width = `${home.w}px`
      button.style.height = `${home.h}px`
      button.style.translate = '0px 0px'
      landing = window.setTimeout(() => {
        home = null
        button.classList.remove('is-flying')
        for (const prop of ['left', 'top', 'width', 'height', 'translate']) {
          button.style.removeProperty(prop)
        }
        row.classList.remove('is-held')
        row.style.removeProperty('width')
        row.style.removeProperty('height')
        // the ring on the pill where it stands in the row again
        haloHome()
      }, 500)
    }
    const stopTalk = () => {
      if (!talk) {
        return
      }
      const { o, focus } = talk
      window.clearTimeout(talk.intent)
      talk.timers.forEach((t) => window.clearTimeout(t))
      talk = null
      hero.classList.remove('lp-hero--talk')
      if (focus?.isConnected && document.activeElement === button) {
        focus.focus({ preventScroll: true })
      }
      o.orb.classList.remove('is-talking')
      o.bubble?.classList.remove('is-typing')
      sunBubble.classList.remove('is-on')
      sunBubble.classList.remove('is-typing')
      // the planet moves on first: nothing below may keep it held
      o.hover = false
      o.angle = ((o.angle % 360) + 360) % 360
      o.target = null
      if (hasSun && home) {
        // the pill flew: it lands, and the ring heads for its home
        land()
        const box = field.getBoundingClientRect()
        const at = button.offsetParent?.getBoundingClientRect() ?? box
        placeHalos(at.left + home.left + home.w / 2 - box.left, at.top + home.top + home.h / 2 - box.top)
      }
    }
    const startTalk = (o) => {
      if (talk?.o === o) {
        return
      }
      stopTalk()
      if (o.settling) {
        window.clearTimeout(o.settle)
        o.settling = false
        o.ring.style.transition = ''
        o.angle = o.phase
        o.ring.style.transform = `rotateY(${o.angle}deg)`
      }
      o.hover = true
      o.target = Math.round(o.angle / 360) * 360
      talk = { o, timers: [], focus: null, intent: 0 }
      // the lines back to the start before the bubble shows
      if (o.bubble) {
        say(o.bubble, o.lines, 0)
      }
      o.orb.classList.add('is-talking')
      if (!hasSun || !o.says.length) {
        return
      }
      // the flight waits for the pointer to rest on the planet
      talk.intent = window.setTimeout(() => launch(o), LANDING_TALK_INTENT)
    }
    const launch = (o) => {
      if (talk?.o !== o) {
        return
      }
      // a focus on the copy about to hide (Get Started, the heading's
      // anchor) moves to the button for the talk, and back after
      const active = document.activeElement
      if (active && active !== button && hero.querySelector('.lp-copy')?.contains(active)) {
        talk.focus = active
        button.focus({ preventScroll: true })
      }
      // every read before the writes, so the handler lays out once
      const box = field.getBoundingClientRect()
      const at = button.offsetParent?.getBoundingClientRect() ?? box
      const start = home
        ? null
        : {
            left: button.offsetLeft,
            top: button.offsetTop,
            w: button.offsetWidth,
            h: button.offsetHeight,
            rw: row.offsetWidth,
            rh: row.offsetHeight,
          }
      const keepClear = [o.orb, o.bubble].filter(Boolean).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          l: r.left - box.left - 10,
          r: r.right - box.left + 10,
          t: r.top - box.top - 10,
          b: r.bottom - box.top + 10,
        }
      })
      sunSay.textContent = ''
      say(sunBubble, [], 'typing')
      // the ring settles with its mark to the front, as a hovered planet's
      sunAngle = reduceMotion ? 0 : -50
      sunRing.style.transform = `rotateY(${sunAngle}deg)`
      placeSun(keepClear)
      fly(box, at, start)
      // the ring's wipe from its start, so the band is revealed the way
      // round it will be wiped away: both angles to the start with no
      // transition (nothing shows either way), then the talk's values
      const reveals = halos.map((halo) => halo.firstElementChild)
      reveals.forEach((reveal) => {
        reveal.style.transition = 'none'
        reveal.style.setProperty('--lp-head', '0deg')
        reveal.style.setProperty('--lp-tail', '0deg')
      })
      // both starts take in one layout: forcing one after letting the
      // other go would start the other's wipe early, on the wrong values
      o.box = reveals[0].getBoundingClientRect()
      reveals.forEach((reveal) => {
        reveal.style.transition = ''
        reveal.style.removeProperty('--lp-head')
        reveal.style.removeProperty('--lp-tail')
      })
      hero.classList.add('lp-hero--talk')
      talk.timers = LANDING_TALK.map(([at, who, what]) =>
        window.setTimeout(() => {
          if (who === 'sun') {
            if (what !== 'typing') {
              sunSay.textContent = o.says[what]?.textContent ?? ''
            }
            say(sunBubble, [], what)
            sunBubble.classList.add('is-on')
          } else if (o.bubble && (what === 'typing' || o.lines[what])) {
            say(o.bubble, o.lines, what)
          }
        }, at),
      )
    }
    // a planet is hovered when the pointer comes to it, not when it
    // drifts under a pointer parked on the copy: the enter counts only
    // after a recent move, and a move over the planet counts after
    // that. A touch has no hover: a tap starts the talk and a tap
    // anywhere else ends it
    let lastMove = 0
    hero.addEventListener(
      'pointermove',
      () => {
        lastMove = performance.now()
      },
      { passive: true },
    )
    hero.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch') {
        stopTalk()
      }
    })
    orbs.forEach((o) => {
      o.orb.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'touch' || performance.now() - lastMove < 200) {
          startTalk(o)
        }
      })
      o.orb.addEventListener('pointermove', () => startTalk(o))
      o.orb.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'touch') {
          stopTalk()
        }
      })
    })
    // the keyboard can end a talk, as the copy is hidden meanwhile
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && talk) {
        stopTalk()
      }
    })
    document.addEventListener('pointerdown', (event) => {
      if (
        talk &&
        event.pointerType === 'touch' &&
        !talk.o.orb.contains(event.target) &&
        !button?.contains(event.target)
      ) {
        stopTalk()
      }
    })
    if (hasSun) {
      button.addEventListener('lp-onboard-copied', () => {
        if (!talk) {
          return
        }
        talk.timers.forEach((t) => window.clearTimeout(t))
        talk.o.bubble?.classList.remove('is-typing')
        sunSay.textContent = 'Copied. Paste it to your agent.'
        say(sunBubble, [], 0)
        sunBubble.classList.add('is-on')
      })
    }
    orbs.forEach((o) => {
      o.orb.addEventListener('animationend', (event) => {
        if (event.animationName === 'lp-orb-pop') {
          o.orb.classList.add('is-popped')
        }
      })
    })
    const apply = () => {
      // a talk in flight was laid out for the old size: it ends
      stopTalk()
      haloHome()
      if (sun) {
        sunSize = Number.parseFloat(getComputedStyle(sun).getPropertyValue('--s')) || sunSize
      }
      layout()
      orbs.forEach(place)
      orbs.forEach((o) => o.orb.classList.add('is-placed'))
    }
    apply()
    new ResizeObserver(apply).observe(field)
    // the orbit's state, for the page's tests
    field.lpOrbs = () =>
      orbs.map((o) => ({
        label: o.orb.dataset.label,
        hover: o.hover,
        away: Boolean(o.away),
        settling: Boolean(o.settling),
        lent: Boolean(o.sdk),
        target: o.target,
        lapTime: Number(o.lapTime.toFixed(2)),
        talking: talk?.o === o,
      }))

    /* The Docs card. As it scrolls into view, the planets it names leave
       their orbits for its stage: the same elements, moved there and
       flown from where they were (the stage place is set, the old one
       put back as a transform, and the transform let go on the CSS
       transition), their rings settling to the front; then each asks
       the docs its question, the third line in its bubble. When the
       card leaves below the viewport they fly back onto their orbits,
       the same way round, and their laps go on. A talk with one of them
       ends as they go. */
    const stage = document.querySelector('[data-lp-stage]')
    const cast = (stage?.dataset.lpStage ?? '').split(/\s+/).filter(Boolean)
    const extras = orbs.filter((o) => cast.includes(o.orb.dataset.icon))
    if (stage && extras.length && stage.dataset.lpStageBound !== 'true') {
      stage.dataset.lpStageBound = 'true'
      const STAGE_Z = { claude: '2' }
      let onStage = false
      let timers = []
      // a ring's angle as rendered, in [0, 360), transition or not
      const ringAngle = (ring) => {
        const m = getComputedStyle(ring).transform
        if (!m.startsWith('matrix3d')) {
          return 0
        }
        const n = m.slice(9, -1).split(',').map(Number)
        return ((((Math.atan2(n[8], n[0]) * 180) / Math.PI) % 360) + 360) % 360
      }
      /* the second act: the globe, its ring and the answers are in the
         stage's markup; the globe is dressed like the hero's. Once the
         questions have been up a few seconds the planets shrink and
         settle into an orbit round the globe (a loop of its own, the
         planet's offset from the centre on a translate, like the hero's)
         and the answers cycle round it */
      const stageSun = stage.querySelector('.lp-stage-sun .lp-sun')
      const stageRing = stageSun?.querySelector('.lp-orb-ring')
      const stageSunSize = stageSun ? Number.parseFloat(getComputedStyle(stageSun).getPropertyValue('--s')) : 0
      const hasStageSun = Boolean(stageRing && stageSunSize && dressLandingGlobe(stageSun, stageRing, stageSunSize))
      const stageHalos = [...stage.querySelectorAll('.lp-stage-halo .lp-sun-halo-reveal')]
      const says = [...stage.querySelectorAll('.lp-stage-say')]
      let orbitFrame = 0
      let orbitLast = null
      let saying = 0
      let sayGen = 0
      // the SDK card below borrows the globe and a planet: whether it has
      // them, and how to take them back at once (bound further down)
      const lent = { on: false, reset: () => {}, check: () => {} }
      const STAGE_LAP = 30
      const SAY_EVERY = 1400
      const SAY_FOR = 3300
      const stopOrbit = () => {
        if (orbitFrame) {
          cancelAnimationFrame(orbitFrame)
          orbitFrame = 0
        }
        orbitLast = null
        stage.classList.remove('is-orbit', 'is-sun')
        says.forEach((say) => say.classList.remove('is-on'))
        extras.forEach((o) => {
          o.orbit = null
          o.orb.style.removeProperty('left')
          o.orb.style.removeProperty('top')
        })
      }
      const orbitTick = (now) => {
        orbitFrame = 0
        if (!onStage) {
          return
        }
        const dt = orbitLast === null ? 0 : Math.min(now - orbitLast, 100)
        orbitLast = now
        const w = stage.clientWidth
        const h = stage.clientHeight
        const rx = w * 0.36
        const ry = rx * 0.42
        extras.forEach((o) => {
          const k = o.orbit
          if (!k) {
            return
          }
          k.t += dt / 1000
          k.angle += (2 * Math.PI * dt) / 1000 / STAGE_LAP
          // a planet lent to the SDK card keeps its place on the ring in
          // mind, and nothing else
          if (o.sdk) {
            return
          }
          const ex = rx * Math.cos(k.angle)
          const ey = ry * Math.sin(k.angle)
          // the first second eases from where the planet stood onto the ring
          const m = Math.min(k.t / 1, 1)
          const e = m < 0.5 ? 2 * m * m : 1 - (-2 * m + 2) ** 2 / 2
          const x = k.x0 + (ex - k.x0) * e
          const y = k.y0 + (ey - k.y0) * e
          o.orb.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`
          const z = Math.sin(k.angle) >= 0 ? '5' : '1'
          if (o.orb.style.zIndex !== z) {
            o.orb.style.zIndex = z
          }
          k.spin = (k.spin + (360 * dt) / LANDING_ORB_TURN) % 360
          o.ring.style.transform = `rotateY(${k.spin}deg)`
        })
        if (!reduceMotion) {
          orbitFrame = requestAnimationFrame(orbitTick)
        }
      }
      const startOrbit = () => {
        if (!onStage) {
          return
        }
        const w = stage.clientWidth
        const h = stage.clientHeight
        extras.forEach((o) => {
          if (o.sdk) {
            return
          }
          o.orb.classList.remove('is-talking')
          o.bubble?.classList.remove('is-typing')
          // the planet's offset from the centre, as it stands
          const cs = getComputedStyle(o.orb)
          const x0 = (Number.parseFloat(cs.getPropertyValue('--x')) / 100 - 0.5) * w
          const y0 = (Number.parseFloat(cs.getPropertyValue('--y')) / 100 - 0.5) * h
          // the ring spins on from where it is, on the loop's own writes:
          // a transition left from its turn to the front would swallow them
          const spin = ringAngle(o.ring)
          o.ring.style.transition = ''
          o.orbit = { x0, y0, t: 0, angle: Math.atan2(y0, x0), spin }
          o.orb.style.left = '50%'
          o.orb.style.top = '50%'
          o.orb.style.translate = `${x0.toFixed(1)}px ${y0.toFixed(1)}px`
        })
        stage.classList.add('is-orbit')
        orbitLast = null
        orbitTick(performance.now())
      }
      // a chain of answers; a newer chain (the globe back from the SDK
      // card) retires the old one by its number
      const nextSay = (gen) => {
        if (!onStage || !says.length || gen !== sayGen) {
          return
        }
        const say = says[saying % says.length]
        saying++
        say.classList.add('is-on')
        timers.push(window.setTimeout(() => say.classList.remove('is-on'), SAY_FOR))
        timers.push(window.setTimeout(() => nextSay(gen), SAY_EVERY))
      }
      // the ring's wipe from its start, as in the hero: both angles to
      // the start with no transition, then let go to the stage's values
      const primeReveals = () => {
        stageHalos.forEach((reveal) => {
          reveal.style.transition = 'none'
          reveal.style.setProperty('--lp-head', '0deg')
          reveal.style.setProperty('--lp-tail', '0deg')
        })
        // both starts take in one layout, then the values are let go
        // together, so each wipe starts on the stage's class with its
        // delay (forcing one after letting the other go started that
        // one's wipe early, on the base values)
        extras[0].box = stageHalos[0].getBoundingClientRect()
        stageHalos.forEach((reveal) => {
          reveal.style.transition = ''
          reveal.style.removeProperty('--lp-head')
          reveal.style.removeProperty('--lp-tail')
        })
      }
      // once: not while the SDK card has the globe, nor again
      const riseSun = () => {
        if (!onStage || !hasStageSun || lent.on || stage.classList.contains('is-sun')) {
          return
        }
        primeReveals()
        stageRing.style.transform = 'rotateY(0deg)'
        stage.classList.add('is-sun')
        timers.push(window.setTimeout(startOrbit, 400))
        const gen = ++sayGen
        timers.push(window.setTimeout(() => nextSay(gen), 1400))
      }
      // settle() puts the planet in its new place; then() runs once that
      // has taken (a layout is forced), the only time a transition on
      // the moved planet or its ring has a value to start from
      const move = (o, to, index, settle, then) => {
        const first = o.orb.getBoundingClientRect()
        window.clearTimeout(o.moving)
        o.orb.classList.remove('is-moving')
        o.orb.style.transform = ''
        o.orb.style.transitionDelay = ''
        to.appendChild(o.orb)
        settle()
        const last = o.orb.getBoundingClientRect()
        if (reduceMotion) {
          then()
          return
        }
        const dx = first.left + first.width / 2 - (last.left + last.width / 2)
        const dy = first.top + first.height / 2 - (last.top + last.height / 2)
        const k = last.width ? first.width / last.width : 1
        o.orb.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${k.toFixed(4)})`
        // the start takes before the transition is switched on
        o.box = o.orb.getBoundingClientRect()
        then()
        o.orb.style.transitionDelay = `${index * 120}ms`
        o.orb.classList.add('is-moving')
        o.orb.style.transform = ''
        o.moving = window.setTimeout(
          () => {
            o.orb.classList.remove('is-moving')
            o.orb.style.transitionDelay = ''
          },
          1150 + index * 120,
        )
      }
      // a planet's ring finishes its turn to the front, on at the pace
      // it had, from wherever it is as rendered (a turn still settling
      // back from the last visit just carries on from where it got to):
      // pinned now, turned by the function returned once the planet is
      // in its new place
      const faceFront = (o) => {
        window.clearTimeout(o.settle)
        o.settling = false
        const turned = ringAngle(o.ring)
        o.ring.style.transition = ''
        o.ring.style.transform = `rotateY(${turned.toFixed(1)}deg)`
        return () => {
          const left = turned < 0.5 ? 0 : 360 - turned
          o.ring.style.transition =
            reduceMotion || !left
              ? ''
              : `transform ${Math.round((left / 360) * LANDING_ORB_TURN * 1.3 + 400)}ms cubic-bezier(0.3, 0, 0.15, 1)`
          o.ring.style.transform = left ? 'rotateY(360deg)' : 'rotateY(0deg)'
          o.angle = 0
        }
      }
      // a planet at its spot on the Docs stage, its question ready
      const standOnStage = (o) => {
        o.orb.style.removeProperty('left')
        o.orb.style.removeProperty('top')
        o.orb.style.translate = ''
        o.orb.style.zIndex = STAGE_Z[o.orb.dataset.icon] ?? '1'
        o.orb.classList.toggle('lp-orb--left', o.orb.dataset.icon === 'chatgpt')
        o.orb.classList.remove('is-talking')
        o.bubble?.classList.remove('is-typing')
        o.bubble?.style.removeProperty('--bubble-shift')
        o.shift = undefined
        o.west = undefined
        o.z = null
        if (o.bubble) {
          say(o.bubble, o.lines, 2)
        }
      }
      // and asks it once it has landed, unless lent away meanwhile
      const askOnStage = (o, landed) => {
        timers.push(
          window.setTimeout(() => {
            if (o.sdk) {
              return
            }
            if (!reduceMotion) {
              o.bubble?.classList.add('is-typing')
            }
            o.orb.classList.add('is-talking')
          }, landed),
        )
        timers.push(
          window.setTimeout(() => {
            if (!o.sdk) {
              o.bubble?.classList.remove('is-typing')
            }
          }, landed + 800),
        )
      }
      const toStage = () => {
        if (onStage) {
          return
        }
        onStage = true
        stopOrbit()
        if (talk && extras.includes(talk.o)) {
          stopTalk()
        }
        // the second act, a few seconds after the last question
        timers.push(window.setTimeout(riseSun, (reduceMotion ? 200 : 1150) + extras.length * 120 + 800 + 3000))
        extras.forEach((o, index) => {
          o.away = true
          move(o, stage, index, () => standOnStage(o), faceFront(o))
          askOnStage(o, (reduceMotion ? 200 : 1150) + index * 120)
        })
      }
      const toOrbit = () => {
        if (!onStage) {
          return
        }
        onStage = false
        // whatever the SDK card has comes along from where it is
        lent.reset()
        timers.forEach((t) => window.clearTimeout(t))
        timers = []
        stopOrbit()
        extras.forEach((o, index) => {
          o.orb.classList.remove('is-talking')
          o.bubble?.classList.remove('is-typing')
          move(
            o,
            field,
            index,
            () => {
              o.away = false
              o.orb.classList.remove('lp-orb--left')
              o.west = undefined
              o.z = null
              if (o.bubble) {
                say(o.bubble, o.lines, 0)
              }
              if (geo) {
                place(o)
              }
            },
            () => {
              // the ring turns on from where it is (the card's orbit left
              // it anywhere) by an amount of its own, all three over the
              // same time, and the loop carries them on from there, a
              // quarter turn apart; at most two thirds of a turn, so no
              // ring spins up
              const from = ringAngle(o.ring)
              const phase = 60 + index * 90
              const ms = reduceMotion ? 0 : 1800
              o.phase = (from + phase) % 360
              window.clearTimeout(o.settle)
              o.ring.style.transition = ''
              o.ring.style.transform = `rotateY(${from.toFixed(1)}deg)`
              if (ms) {
                // the start takes before the turn is switched on
                o.box = o.ring.getBoundingClientRect()
                o.settling = true
                o.ring.style.transition = `transform ${ms}ms linear`
                o.ring.style.transform = `rotateY(${from + phase}deg)`
                o.settle = window.setTimeout(() => {
                  o.settling = false
                  o.ring.style.transition = ''
                  o.angle = o.phase
                  o.ring.style.transform = `rotateY(${o.angle}deg)`
                }, ms)
              } else {
                o.settling = false
                o.ring.style.transition = ''
                o.angle = o.phase
                o.ring.style.transform = `rotateY(${o.angle}deg)`
              }
            },
          )
        })
      }
      // the planets come once the card has risen into the top part of
      // the viewport (its top above the 45% line), and go back once it
      // has dropped below that line; past the top they stay
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              toStage()
            } else if (entry.boundingClientRect.top > 0) {
              toOrbit()
            }
          })
        },
        { rootMargin: '0px 0px -55% 0px', threshold: 0 },
      ).observe(stage)

      /* The SDK card, below. As it scrolls into view the globe, with its
         ring, leaves the Docs card for the top of this one and one of the
         three planets, picked at random (a different one each time),
         follows to stand below it, its ring finishing its turn to the
         front as on the Docs stage. Then the two speak by turns, the
         planet from its bubble and Scalar from the card's own, the dots
         between, the last line of each staying. When the card drops below
         the viewport's middle both go back: the globe to the Docs card's
         centre, the planet onto the orbit where its lap has got to, or,
         where the Docs card's second act has not begun, to its spot and
         its question (and that act follows). Reached before the globe has
         risen there, the globe rises here instead, and sets again as it
         goes. The MCP card below borrows both again in turn. */
      const sdk = document.querySelector('[data-lp-stage-sdk]')
      const sunRow = sdk?.querySelector('[data-lp-sdk-sun]')
      const planetRow = sdk?.querySelector('[data-lp-sdk-planet]')
      const globe = stage.querySelector('.lp-stage-globe')
      const sdkBubble = sdk?.querySelector('.lp-sun-bubble')
      const sdkSay = sdkBubble?.querySelector('.lp-say')
      if (sdk && sunRow && planetRow && globe && hasStageSun && sdkSay && sdk.dataset.lpStageBound !== 'true') {
        sdk.dataset.lpStageBound = 'true'
        // the globe group moves like a planet; its size is each stage's,
        // eased from the old one on a move: set inline for the start,
        // let go once that has taken
        const globeO = { orb: globe, moving: 0, box: null }
        const moveGlobe = (to, settle) => {
          const from = getComputedStyle(globe).getPropertyValue('--s')
          move(
            globeO,
            to,
            0,
            () => {
              globe.style.setProperty('--s', from)
              settle()
            },
            () => globe.style.removeProperty('--s'),
          )
        }
        // whether the stage the globe stands on shows it, ring out
        const globeShown = () => Boolean(globe.closest('.lp-stage')?.classList.contains('is-sun'))
        let guest = null
        let lastGuest = null
        let sdkTimers = []
        let globeBack = 0
        // the MCP card below borrows both again: its hold, bound further
        // down (off: let go at once; left: the globe has left it; check:
        // after a scroll, give them up if below the line)
        const next = { on: false, off: () => {}, left: () => {}, check: () => {} }
        // the talk, from the planet's landing: who, and the dots or a line
        const SDK_TALK = [
          [300, 'orb', 'typing'],
          [1100, 'orb', 3],
          [1900, 'sun', 'typing'],
          [2700, 'sun', 2],
          [4000, 'orb', 'typing'],
          [4800, 'orb', 4],
          [5600, 'sun', 'typing'],
          [6400, 'sun', 3],
        ]
        const talkOff = () => {
          sdkTimers.forEach((t) => window.clearTimeout(t))
          sdkTimers = []
          sdkBubble.classList.remove('is-on', 'is-typing')
        }
        // a planet's stand on a card below: at its row's spot, nothing of
        // the hero's or the Docs stage's left on it
        const standBelow = (o, z) => {
          o.orb.style.removeProperty('left')
          o.orb.style.removeProperty('top')
          o.orb.style.translate = ''
          o.orb.style.zIndex = z
          o.orb.classList.remove('is-talking', 'lp-orb--left')
          o.bubble?.classList.remove('is-typing')
          o.bubble?.style.removeProperty('--bubble-shift')
          o.shift = undefined
          o.z = null
        }
        // the globe and the planet to this card's rows, from wherever they
        // are, and the talk once the planet has landed
        const takeToSdk = (o) => {
          window.clearTimeout(globeBack)
          if (globeShown()) {
            moveGlobe(sunRow, () => {
              next.left()
              sdk.classList.add('is-sun')
            })
          } else {
            // nothing to fly: it rises here, as it would have there
            sunRow.appendChild(globe)
            primeReveals()
            stageRing.style.transform = 'rotateY(0deg)'
            sdk.classList.add('is-sun')
          }
          move(
            o,
            planetRow,
            1,
            () => {
              standBelow(o, '6')
              if (o.bubble) {
                say(o.bubble, o.lines, 3)
              }
            },
            faceFront(o),
          )
          const landed = (reduceMotion ? 200 : 1150) + 120
          talkOff()
          sdkSay.textContent = ''
          sdkTimers = SDK_TALK.map(([at, who, what]) =>
            window.setTimeout(() => {
              if (who === 'sun') {
                if (what !== 'typing') {
                  sdkSay.textContent = o.says[what]?.textContent ?? ''
                }
                say(sdkBubble, [], what)
                sdkBubble.classList.add('is-on')
              } else if (o.bubble && (what === 'typing' || o.lines[what])) {
                say(o.bubble, o.lines, what)
                o.orb.classList.add('is-talking')
              }
            }, landed + at),
          )
        }
        const toSdk = () => {
          if (lent.on || !onStage) {
            return
          }
          lent.on = true
          // the answers pause while the globe is away
          sayGen++
          says.forEach((s) => s.classList.remove('is-on'))
          // the planet below: any but the last one
          const pool = extras.filter((o) => o !== lastGuest)
          const o = pool[Math.floor(Math.random() * pool.length)]
          guest = o
          lastGuest = o
          o.sdk = true
          takeToSdk(o)
        }
        const fromSdk = () => {
          if (!lent.on) {
            return
          }
          lent.on = false
          next.off()
          talkOff()
          const o = guest
          guest = null
          o.sdk = false
          o.orb.classList.remove('is-talking')
          o.bubble?.classList.remove('is-typing')
          if (stage.classList.contains('is-sun')) {
            // the globe flies back to the centre, and the answers go on
            moveGlobe(stage, () => {
              sdk.classList.remove('is-sun')
              next.left()
            })
            const gen = ++sayGen
            timers.push(window.setTimeout(() => nextSay(gen), 1200))
          } else {
            // it sets where it is, and rises there once the planet has asked
            sdk.classList.remove('is-sun')
            next.left()
            globeBack = window.setTimeout(() => stage.appendChild(globe), 1000)
            timers.push(window.setTimeout(riseSun, 4000))
          }
          if (stage.classList.contains('is-orbit')) {
            // onto the ring, where its lap has got to
            move(
              o,
              stage,
              1,
              () => {
                const w = stage.clientWidth
                const h = stage.clientHeight
                const rx = w * 0.36
                const ry = rx * 0.42
                const cs = getComputedStyle(o.orb)
                const x0 = (Number.parseFloat(cs.getPropertyValue('--x')) / 100 - 0.5) * w
                const y0 = (Number.parseFloat(cs.getPropertyValue('--y')) / 100 - 0.5) * h
                const k = o.orbit ?? { x0, y0, t: 1, angle: Math.atan2(y0, x0), spin: 0 }
                k.t = 1
                o.orbit = k
                o.orb.style.left = '50%'
                o.orb.style.top = '50%'
                o.orb.style.translate = `${(rx * Math.cos(k.angle)).toFixed(1)}px ${(ry * Math.sin(k.angle)).toFixed(1)}px`
                o.orb.style.zIndex = Math.sin(k.angle) >= 0 ? '5' : '1'
                o.orb.classList.remove('lp-orb--left')
              },
              () => {
                // the ring spins on from where it is
                window.clearTimeout(o.settle)
                o.settling = false
                o.orbit.spin = ringAngle(o.ring)
                o.ring.style.transition = ''
                o.ring.style.transform = `rotateY(${o.orbit.spin.toFixed(1)}deg)`
              },
            )
          } else {
            move(o, stage, 1, () => standOnStage(o), faceFront(o))
            askOnStage(o, (reduceMotion ? 200 : 1150) + 120)
          }
        }
        // the Docs card taking its planets home takes these too, as they
        // are: no flight back to it first
        lent.reset = () => {
          if (!lent.on) {
            return
          }
          lent.on = false
          next.off()
          talkOff()
          window.clearTimeout(globeBack)
          sdk.classList.remove('is-sun')
          next.left()
          stage.appendChild(globe)
          if (guest) {
            guest.sdk = false
            guest.orb.classList.remove('is-talking')
            guest.bubble?.classList.remove('is-typing')
            guest = null
          }
        }
        new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                toSdk()
              } else if (entry.boundingClientRect.top > 0) {
                fromSdk()
              }
            })
          },
          { rootMargin: '0px 0px -55% 0px', threshold: 0 },
        ).observe(sdk)
        lent.check = () => {
          const line = window.innerHeight * 0.45
          const top = sdk.getBoundingClientRect().top
          if (lent.on && top > line) {
            fromSdk()
          } else {
            if (!lent.on && top <= line) {
              toSdk()
            }
            next.check()
          }
        }
        // the card's state, for the page's tests
        sdk.lpSdk = () => ({ on: lent.on, guest: guest?.orb.dataset.icon ?? null })

        /* The MCP card, below again: a message thread, no window, after
           the chat on x.ai/voice. The rows come on one by one, each up
           from below while the earlier ones glide up (a FLIP on their
           transforms), the assistants' lines streaming in by the word.
           The SDK card's guest comes on (or straight from the Docs card,
           on a jump) to sit as the agent's profile photo by its first
           message; the globe comes on to sit by Scalar's reply; the
           planet moves down to the agent's answer. When the card drops
           below the viewport's middle both go back to the SDK card and
           its talk plays again. */
        const mcp = document.querySelector('[data-lp-stage-mcp]')
        const slot = (name) => mcp?.querySelector(`[data-lp-thread-slot="${name}"]`)
        const row = (name) => mcp?.querySelector(`[data-lp-thread="${name}"]`)
        const seats = { a: slot('a'), b: slot('b'), c: slot('c') }
        const rows = { user: row('user'), agent1: row('agent1'), scalar: row('scalar'), agent2: row('agent2') }
        if (
          mcp &&
          Object.values(seats).every(Boolean) &&
          Object.values(rows).every(Boolean) &&
          mcp.dataset.lpStageBound !== 'true'
        ) {
          mcp.dataset.lpStageBound = 'true'
          const mark = mcp.querySelector('.lp-thread-chip-mark')
          const icon = document.getElementById('lp-icon-scalar')
          if (mark && icon) {
            mark.innerHTML = icon.innerHTML
          }
          // the streamed lines, a span a word, each a beat after the last
          mcp.querySelectorAll('.lp-thread-text').forEach((text) => {
            const words = text.textContent.trim().split(/\s+/)
            text.textContent = ''
            words.forEach((word, i) => {
              const span = document.createElement('span')
              span.className = 'lp-thread-w'
              span.textContent = word
              span.style.transitionDelay = `${i * 34}ms`
              text.appendChild(span)
              if (i < words.length - 1) {
                text.appendChild(document.createTextNode(' '))
              }
            })
          })
          const order = [rows.user, rows.agent1, rows.scalar, rows.agent2]
          let mcpTimers = []
          const quiet = () => {
            mcpTimers.forEach((t) => window.clearTimeout(t))
            mcpTimers = []
            order.forEach((r) => {
              r.classList.remove('is-shown', 'is-past')
              r.style.transition = ''
              r.style.transform = ''
              r.style.opacity = ''
            })
          }
          // a row comes on: up from below, the others to their new places
          // from their old ones; all but the two latest step back
          const reveal = (r) => {
            const shown = order.filter((other) => other.classList.contains('is-shown'))
            const before = new Map(shown.map((other) => [other, other.getBoundingClientRect().top]))
            r.classList.add('is-shown')
            if (!reduceMotion) {
              r.style.transition = 'none'
              r.style.opacity = '0'
              r.style.transform = 'translateY(14px)'
              shown.forEach((other) => {
                other.style.transition = 'none'
                other.style.transform = `translateY(${(before.get(other) - other.getBoundingClientRect().top).toFixed(1)}px)`
              })
              // the starts take before the moves are switched on
              globeO.box = r.getBoundingClientRect()
              for (const el of [r, ...shown]) {
                el.style.transition = ''
                el.style.transform = ''
                el.style.opacity = ''
              }
            }
            const all = order.filter((other) => other.classList.contains('is-shown'))
            all.forEach((other, i) => other.classList.toggle('is-past', i < all.length - 2))
          }
          next.off = () => {
            next.on = false
            quiet()
          }
          next.left = () => mcp.classList.remove('is-sun')
          // a planet into a seat of the thread, centred, ring to the front
          const seat = (o, at) => move(o, at, 0, () => standBelow(o, '3'), faceFront(o))
          const toMcp = () => {
            if (next.on) {
              return
            }
            // on a jump the SDK card has not had them yet: it takes them
            // first, so there is a guest, and they come on from there
            if (!lent.on) {
              toSdk()
            }
            if (!lent.on || !guest) {
              return
            }
            next.on = true
            talkOff()
            quiet()
            const o = guest
            const at = (ms, fn) => mcpTimers.push(window.setTimeout(fn, ms))
            at(300, () => reveal(rows.user))
            at(1500, () => {
              reveal(rows.agent1)
              seat(o, seats.a)
            })
            at(3300, () => {
              reveal(rows.scalar)
              moveGlobe(seats.b, () => {
                sdk.classList.remove('is-sun')
                mcp.classList.add('is-sun')
              })
            })
            at(5800, () => {
              reveal(rows.agent2)
              seat(o, seats.c)
            })
          }
          const fromMcp = () => {
            if (!next.on) {
              return
            }
            next.off()
            if (!lent.on || !guest) {
              return
            }
            takeToSdk(guest)
          }
          new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  toMcp()
                } else if (entry.boundingClientRect.top > 0) {
                  fromMcp()
                }
              })
            },
            { rootMargin: '0px 0px -55% 0px', threshold: 0 },
          ).observe(mcp)
          next.check = () => {
            const line = window.innerHeight * 0.45
            const top = mcp.getBoundingClientRect().top
            if (next.on && top > line) {
              fromMcp()
            } else if (!next.on && top <= line) {
              toMcp()
            }
          }
          // the card's state, for the page's tests
          mcp.lpMcp = () => ({ on: next.on, shown: order.filter((r) => r.classList.contains('is-shown')).length })
        }
      }
      // a jump of the page (an anchor, a scroll to the top) can take a
      // card from one side of the viewport to the other with no moment
      // in between for its observer to see: after a scroll, a card
      // below the middle of the viewport gives up what it holds, and one
      // above it takes what it is owed
      let scrolled = 0
      window.addEventListener(
        'scroll',
        () => {
          if (scrolled) {
            return
          }
          scrolled = requestAnimationFrame(() => {
            scrolled = 0
            const line = window.innerHeight * 0.45
            const top = stage.getBoundingClientRect().top
            if (onStage && top > line) {
              toOrbit()
            } else {
              if (!onStage && top <= line) {
                toStage()
              }
              lent.check()
            }
          })
        },
        { passive: true },
      )
    }
    orbs.forEach((o) => {
      o.ring.style.transform = `rotateY(${o.angle}deg)`
    })
    if (reduceMotion) {
      return
    }

    /* the motion, while the field is on screen and the page visible:
       every ring turns and every planet moves along its orbit; a hovered
       globe holds its place and heads for the nearest full turn of its
       ring instead, the short way round, then carries on when the pointer
       leaves */
    let inView = false
    let frame = 0
    let last = null
    const tick = (now) => {
      frame = 0
      const dt = last === null ? 0 : Math.min(now - last, 100)
      last = now
      orbs.forEach((o) => {
        if (o.away) {
          return
        }
        // a ring settling back from the stage is on a transition of its own
        if (!o.settling) {
          if (o.target === null) {
            o.angle = (o.angle + (360 * dt) / LANDING_ORB_TURN) % 360
          } else {
            const gap = o.target - o.angle
            o.angle = Math.abs(gap) < 0.05 ? o.target : o.angle + gap * (1 - Math.exp(-dt / 110))
          }
          o.ring.style.transform = `rotateY(${o.angle}deg)`
        }
        if (geo) {
          if (!o.hover) {
            o.lapTime += dt / 1000
          }
          place(o)
        }
      })
      if (talk && hasSun && sunAngle !== 0) {
        sunAngle = Math.abs(sunAngle) < 0.05 ? 0 : sunAngle * Math.exp(-dt / 160)
        sunRing.style.transform = `rotateY(${sunAngle}deg)`
      }
      if (inView && !document.hidden) {
        frame = requestAnimationFrame(tick)
      }
    }
    const sync = () => {
      if (inView && !document.hidden) {
        if (!frame) {
          last = null
          frame = requestAnimationFrame(tick)
        }
      } else if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting
        })
        sync()
      },
      { threshold: 0.1 },
    )
    observer.observe(field)
    document.addEventListener('visibilitychange', sync)
  })
})

/* Each chat plays every time it scrolls into view. */
const initLandingChat = debounce(() => {
  const chats = [...document.querySelectorAll('.lp-chat')].filter((chat) => chat.dataset.lpChatBound !== 'true')
  if (!chats.length) {
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  chats.forEach((chat) => {
    chat.dataset.lpChatBound = 'true'
    if (reduceMotion) {
      return
    }

    const player = createLandingChatPlayer(chat)
    if (!player) {
      return
    }

    let visible = false
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting === visible) {
            return
          }
          visible = entry.isIntersecting
          if (visible) {
            player.play()
          } else {
            player.stop()
          }
        })
      },
      { threshold: 0.4 },
    )
    observer.observe(chat)
  })
})

/* Hero flow: packets travel the connectors from Acme's API to the Scalar
   hub, out to the products and on to the people and agents that use
   them. Whatever a packet lands on pulses and its subtitle flips over
   to say what arrived, then flips back (after the motion on
   lightspark.com's capability pages). One round every few seconds while
   the panel is in view; nothing moves under reduced motion. */
/* A flow lists its edges (data-lp-edges="api>hub,hub>maya") and gets
   them drawn here from where the nodes land, so the lines hold whatever
   the layout does. Side by side (the hero on wide screens) a line runs
   from the end of a chip's text to the next chip's tile, level with the
   middle of each; stacked (the cards, the hero on phones) it runs from
   the bottom middle of one node to the top middle of the next. The chips
   have no box of their own, so the lines stop short of the words. */
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
  // the hairlines in the cards end in a dot at each label
  const withDots = flow.classList.contains('lp-flow--card')
  const box = flow.getBoundingClientRect()
  svg.setAttribute('viewBox', `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`)
  // where a chip's words end: the wider of its name and its subtitle
  const textEnd = (node) => {
    const spans = node.querySelectorAll('.lp-chip-label > span, .lp-chip-sub-face--main > span')
    return spans.length ? Math.max(...[...spans].map((span) => span.getBoundingClientRect().right)) : null
  }
  const f = (n) => n.toFixed(1)
  const sideways = getComputedStyle(flow).getPropertyValue('--lp-flow-dir').trim() === 'row'
  keys.forEach((key) => {
    const [from, to] = key.split('>').map((name) => flow.querySelector(`[data-lp-node="${name}"]`))
    if (!from || !to) {
      return
    }
    const a = from.getBoundingClientRect()
    const b = to.getBoundingClientRect()
    let x0
    let y0
    let x1
    let y1
    let d
    if (sideways) {
      const tile = to.querySelector('.lp-chip-icon')
      x0 = (textEnd(from) ?? a.right) - box.left + LINE_GAP
      y0 = a.top + a.height / 2 - box.top
      x1 = (tile ? tile.getBoundingClientRect().left : b.left) - box.left - LINE_GAP
      y1 = b.top + b.height / 2 - box.top
      const mid = (x0 + x1) / 2
      d =
        Math.abs(y1 - y0) < 0.5
          ? `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)}`
          : `M ${f(x0)} ${f(y0)} C ${f(mid)} ${f(y0)}, ${f(mid)} ${f(y1)}, ${f(x1)} ${f(y1)}`
    } else {
      x0 = a.left + a.width / 2 - box.left
      y0 = a.bottom - box.top + 6
      x1 = b.left + b.width / 2 - box.left
      y1 = b.top - box.top - 6
      const mid = (y0 + y1) / 2
      d = `M ${f(x0)} ${f(y0)} C ${f(x0)} ${f(mid)}, ${f(x1)} ${f(mid)}, ${f(x1)} ${f(y1)}`
    }
    let path = svg.querySelector(`[data-lp-edge="${key}"]`)
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
    path.setAttribute('d', d)
    if (!withDots) {
      return
    }
    let dot = svg.querySelector(`[data-lp-dot="${key}"]`)
    if (!dot) {
      dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('class', 'lp-flow-dot')
      dot.setAttribute('r', '2.5')
      dot.dataset.lpDot = key
      svg.appendChild(dot)
    }
    // the dot sits at whichever end is a label, not the window
    const atLabel = from.dataset.lpNode === 'hub' ? [x1, y1] : [x0, y0]
    dot.setAttribute('cx', f(atLabel[0]))
    dot.setAttribute('cy', f(atLabel[1]))
  })
}

const createLandingFlowPlayer = (flow) => {
  const layers = [...flow.querySelectorAll(':scope > .lp-flow-lines')]
  const layer = () => layers.find((svg) => svg.getClientRects().length) || layers[0]
  const nodes = new Map()
  flow.querySelectorAll('[data-lp-node]').forEach((node) => nodes.set(node.dataset.lpNode, node))
  const products = [...nodes.values()].filter((node) => node.dataset.lpTarget).map((node) => node.dataset.lpNode)
  const leaves = (product) =>
    [...nodes.values()].filter((node) => node.dataset.lpParent === product).map((node) => node.dataset.lpNode)
  if (!layers.length || !nodes.has('api') || !nodes.has('hub')) {
    return null
  }

  const SPEED = 640 // scene units per second
  const PERIOD = 3600
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

  const bounce = (key) => {
    const target = nodes.get(key)?.querySelector('.lp-chip, .lp-hub')
    if (!target) {
      return
    }
    target.classList.remove('is-bounce')
    void target.offsetWidth
    target.classList.add('is-bounce')
  }

  const FLIP_HOLD = 1700
  let version = 0

  /* the subtitle flips to the text (one of the chip's data-lp-flip
     options, {v} being this round's version), holds, and flips back */
  const flip = (key) => {
    const node = nodes.get(key)
    const sub = node?.querySelector('.lp-chip-sub')
    const texts = (node?.dataset.lpFlip || '').split('|').filter(Boolean)
    if (!sub || !texts.length) {
      return
    }
    sub.querySelectorAll('.lp-chip-sub-face--alt').forEach((face) => face.remove())
    sub.classList.remove('is-in', 'is-out')
    const face = document.createElement('span')
    face.className = 'lp-chip-sub-face lp-chip-sub-face--alt'
    face.textContent = texts[Math.floor(Math.random() * texts.length)].replace('{v}', `v2.4.${version}`)
    sub.appendChild(face)
    void sub.offsetWidth
    sub.classList.add('is-in')
    after(FLIP_HOLD, () => {
      sub.classList.remove('is-in')
      sub.classList.add('is-out')
      after(560, () => {
        face.remove()
        sub.classList.remove('is-out')
      })
    })
  }

  /* A dot that should have landed this long ago went without frames (the
     browser stopped painting), so it is dropped instead of arriving late
     and setting off the rest of its round alongside newer ones */
  const STALE = 1000

  const tick = () => {
    const now = performance.now()
    packets.forEach((packet) => {
      if (now - packet.start - packet.duration > STALE) {
        packets.delete(packet)
        packet.el.remove()
        return
      }
      const t = Math.min(1, (now - packet.start) / packet.duration)
      const point = packet.edge.path.getPointAtLength(t * packet.length)
      packet.el.setAttribute('cx', point.x)
      packet.el.setAttribute('cy', point.y)
      packet.el.style.opacity = Math.min(1, (now - packet.start) / 90)
      if (t >= 1) {
        packets.delete(packet)
        packet.el.remove()
        packet.onArrive()
      }
    })
    frame = packets.size ? requestAnimationFrame(tick) : 0
  }

  const send = (edgeKey, onArrive) => {
    const svg = layer()
    const path = svg?.querySelector(`[data-lp-edge="${edgeKey}"]`)
    if (!path) {
      return
    }
    const el = document.createElementNS(SVG_NS, 'circle')
    el.setAttribute('class', 'lp-packet')
    el.setAttribute('r', '4.5')
    el.style.opacity = '0'
    svg.appendChild(el)
    const length = path.getTotalLength()
    packets.add({ el, edge: { path }, length, start: performance.now(), duration: (length / SPEED) * 1000, onArrive })
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
          bounce(leaf)
          flip(leaf)
        })
      })
    })
  }

  const round = () => {
    version = (version % 9) + 1
    bounce('api')
    flip('api')
    send('api>hub', () => {
      bounce('hub')
      if (!products.length) {
        fanOut('hub')
        return
      }
      products.forEach((product, i) => {
        after(i * 90, () => {
          send(`hub>${product}`, () => {
            bounce(product)
            flip(product)
            fanOut(product)
          })
        })
      })
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
    timers.forEach((id) => clearTimeout(id))
    timers.clear()
    if (frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    packets.forEach((packet) => packet.el.remove())
    packets.clear()
    flow.querySelectorAll('.lp-chip-sub-face--alt').forEach((el) => el.remove())
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
    if (flow.dataset.lpEdges) {
      drawLandingFlowEdges(flow)
      const observer = new ResizeObserver(() => drawLandingFlowEdges(flow))
      observer.observe(flow)
      flow.querySelectorAll('[data-lp-node], .lp-chip-body').forEach((el) => observer.observe(el))
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

/* Code windows: the language tabs swap the sample underneath and the
   repo name in the title bar. */
const initLandingWinTabs = debounce(() => {
  const wins = [...document.querySelectorAll('.lp-win--code')].filter((win) => win.dataset.lpTabsBound !== 'true')
  if (!wins.length) {
    return
  }

  wins.forEach((win) => {
    win.dataset.lpTabsBound = 'true'
    const tabs = [...win.querySelectorAll('.lp-win-tabs [data-lp-tab]')]
    const repo = win.querySelector('.lp-win-repo')
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((other) => other.classList.toggle('is-active', other === tab))
        win.querySelectorAll('[data-lp-code]').forEach((code) => {
          code.classList.toggle('is-active', code.dataset.lpCode === tab.dataset.lpTab)
        })
        if (repo && tab.dataset.lpRepo) {
          repo.textContent = tab.dataset.lpRepo
        }
      })
    })
  })
})

/* Docs windows: in each pair, the last window hovered stays in front */
const initLandingDocsWindows = debounce(() => {
  const pairs = [...document.querySelectorAll('.lp-win--pair')].filter(
    (pair) => pair.dataset.lpDocsWindowsBound !== 'true',
  )
  if (!pairs.length) {
    return
  }

  pairs.forEach((pair) => {
    pair.dataset.lpDocsWindowsBound = 'true'
    const windows = [...pair.querySelectorAll('.lp-browser')]
    windows.forEach((win) => {
      win.addEventListener('mouseenter', () => {
        windows.forEach((other) => other.classList.toggle('is-front', other === win))
      })
    })
  })
})

/* lp-funnel:start */
/* The prompt funnel under "Just write the prompts and manage it yourself":
   the cards are built here rather than written into the page, so their
   words stay out of the page's markdown twin (as the hero flow's do). Each
   card has its phase of the cycle, a width, a tilt, and the pose it holds
   when motion is reduced. Generated by a scratch script. */
const LANDING_FUNNEL = [
  {
    text: 'Update the docs for the new /invoices endpoint',
    w: 230,
    p: -0.007,
    rz: -3.5,
    pose: 'translate3d(calc(var(--lp-fr) * 0.997), calc(var(--lp-fh) * -0.507), calc(var(--lp-fr) * -0.106)) rotateY(6.2deg) rotateZ(-6.9deg) scale(1.004)',
    op: 0,
  },
  {
    text: 'Regenerate the Python SDK, the types broke again',
    w: 240,
    p: 0.068,
    rz: -4.3,
    pose: 'translate3d(calc(var(--lp-fr) * 0.267), calc(var(--lp-fh) * -0.432), calc(var(--lp-fr) * 0.772)) rotateY(-48deg) rotateZ(-2deg) scale(0.958)',
    op: 1,
  },
  {
    text: 'Why does the TypeScript SDK 404 on /v2/users?',
    w: 236,
    p: 0.126,
    rz: -1.3,
    pose: 'translate3d(calc(var(--lp-fr) * -0.653), calc(var(--lp-fh) * -0.374), calc(var(--lp-fr) * 0.528)) rotateY(-34.4deg) rotateZ(5.1deg) scale(0.922)',
    op: 1,
  },
  {
    text: 'Write a changelog for last week’s API changes',
    w: 226,
    p: 0.171,
    rz: 0.1,
    pose: 'translate3d(calc(var(--lp-fr) * -0.864), calc(var(--lp-fh) * -0.329), calc(var(--lp-fr) * -0.059)) rotateY(4deg) rotateZ(7deg) scale(0.894)',
    op: 1,
  },
  {
    text: 'Add an MCP tool for refunds',
    w: 184,
    p: 0.233,
    rz: -0.7,
    pose: 'translate3d(calc(var(--lp-fr) * -0.263), calc(var(--lp-fh) * -0.267), calc(var(--lp-fr) * -0.659)) rotateY(47.4deg) rotateZ(2.2deg) scale(0.856)',
    op: 1,
  },
  {
    text: 'Fix the OpenAPI lint errors before the release',
    w: 232,
    p: 0.296,
    rz: -4.1,
    pose: 'translate3d(calc(var(--lp-fr) * 0.59), calc(var(--lp-fh) * -0.204), calc(var(--lp-fr) * -0.419)) rotateY(32.1deg) rotateZ(-5.4deg) scale(0.816)',
    op: 1,
  },
  {
    text: 'Document the rate limits, support keeps asking',
    w: 240,
    p: 0.372,
    rz: 3.3,
    pose: 'translate3d(calc(var(--lp-fr) * 0.528), calc(var(--lp-fh) * -0.128), calc(var(--lp-fr) * 0.403)) rotateY(-33.4deg) rotateZ(-5.2deg) scale(0.769)',
    op: 1,
  },
  {
    text: 'Bump the Go SDK to match the new auth flow',
    w: 226,
    p: 0.423,
    rz: -2.8,
    pose: 'translate3d(calc(var(--lp-fr) * -0.085), calc(var(--lp-fh) * -0.077), calc(var(--lp-fr) * 0.565)) rotateY(-49.6deg) rotateZ(0.9deg) scale(0.737)',
    op: 1,
  },
  {
    text: 'Can you sync the docs with the main branch?',
    w: 220,
    p: 0.505,
    rz: 4.5,
    pose: 'translate3d(calc(var(--lp-fr) * -0.604), calc(var(--lp-fh) * 0.005), calc(var(--lp-fr) * -0.046)) rotateY(4.5deg) rotateZ(7deg) scale(0.687)',
    op: 1,
  },
  {
    text: 'The Java SDK is three versions behind',
    w: 206,
    p: 0.565,
    rz: -1,
    pose: 'translate3d(calc(var(--lp-fr) * -0.185), calc(var(--lp-fh) * 0.065), calc(var(--lp-fr) * -0.448)) rotateY(47.2deg) rotateZ(2.3deg) scale(0.649)',
    op: 1,
  },
  {
    text: 'Rewrite the quickstart, it still uses API keys',
    w: 232,
    p: 0.643,
    rz: -4.5,
    pose: 'translate3d(calc(var(--lp-fr) * 0.449), calc(var(--lp-fh) * 0.143), calc(var(--lp-fr) * -0.184)) rotateY(21.7deg) rotateZ(-6.3deg) scale(0.601)',
    op: 1,
  },
  {
    text: 'Add curl and Python examples to every endpoint',
    w: 244,
    p: 0.701,
    rz: -2.1,
    pose: 'translate3d(calc(var(--lp-fr) * 0.362), calc(var(--lp-fh) * 0.201), calc(var(--lp-fr) * 0.232)) rotateY(-30.1deg) rotateZ(-5.6deg) scale(0.565)',
    op: 1,
  },
  {
    text: 'Publish the SDKs to npm and PyPI',
    w: 196,
    p: 0.737,
    rz: -3.8,
    pose: 'translate3d(calc(var(--lp-fr) * 0.106), calc(var(--lp-fh) * 0.237), calc(var(--lp-fr) * 0.35)) rotateY(-48.4deg) rotateZ(-1.7deg) scale(0.543)',
    op: 1,
  },
  {
    text: 'Make the MCP server stop timing out',
    w: 206,
    p: 0.805,
    rz: 3.2,
    pose: 'translate3d(calc(var(--lp-fr) * -0.321), calc(var(--lp-fh) * 0.305), calc(var(--lp-fr) * 0.159)) rotateY(-25.2deg) rotateZ(6deg) scale(0.501)',
    op: 1,
  },
  {
    text: 'Who changed the webhook schema?',
    w: 196,
    p: 0.863,
    rz: 0.8,
    pose: 'translate3d(calc(var(--lp-fr) * -0.277), calc(var(--lp-fh) * 0.363), calc(var(--lp-fr) * -0.148)) rotateY(26.5deg) rotateZ(5.9deg) scale(0.465)',
    op: 1,
  },
  {
    text: 'Add the new auth scopes to the reference',
    w: 220,
    p: 0.943,
    rz: -1.3,
    pose: 'translate3d(calc(var(--lp-fr) * 0.125), calc(var(--lp-fh) * 0.443), calc(var(--lp-fr) * -0.198)) rotateY(44.1deg) rotateZ(-3.3deg) scale(0.416)',
    op: 0.48,
  },
]

const initLandingFunnel = debounce(() => {
  const tracks = [...document.querySelectorAll('.lp-funnel-track[data-lp-funnel]')].filter(
    (track) => track.dataset.lpFunnelBound !== 'true',
  )
  if (!tracks.length) {
    return
  }

  tracks.forEach((track) => {
    track.dataset.lpFunnelBound = 'true'
    LANDING_FUNNEL.forEach((card) => {
      const item = document.createElement('div')
      item.className = 'lp-funnel-item'
      item.style.setProperty('--p', String(card.p))
      item.style.setProperty('--w', `${card.w}px`)
      item.style.setProperty('--rz', `${card.rz}deg`)
      item.style.setProperty('--pose', card.pose)
      item.style.setProperty('--pose-op', String(card.op))
      const text = document.createElement('div')
      text.className = 'lp-funnel-card'
      text.textContent = card.text
      item.appendChild(text)
      track.appendChild(item)
    })
  })
})

/* The prompt as text, read off the box's markup so the clipboard gets
   what the box shows: a blank line between paragraphs, the list
   numbered, code in backticks, and the blanks filled in with what was
   typed or picked (an empty brand field falls back to its data-fallback) */
const landingPromptText = (root) => {
  const inline = (node) =>
    [...node.childNodes]
      .map((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          return child.textContent
        }
        if (child.nodeType !== Node.ELEMENT_NODE || child instanceof SVGElement) {
          return ''
        }
        if (child instanceof HTMLInputElement) {
          return child.value.trim() || child.dataset.fallback || ''
        }
        if (child instanceof HTMLSelectElement) {
          return child.options[child.selectedIndex]?.text ?? ''
        }
        if (child.tagName === 'CODE') {
          return `\`${child.textContent}\``
        }
        return inline(child)
      })
      .join('')
  const tidy = (text) => text.replace(/\s+/g, ' ').trim()
  return [...root.children]
    .map((block) =>
      block.tagName === 'OL'
        ? [...block.children].map((item, i) => `${i + 1}. ${tidy(inline(item))}`).join('\n')
        : tidy(inline(block)),
    )
    .filter(Boolean)
    .join('\n\n')
}

/* The short form the prompt box shows at rest: the prompt's own words,
   fewer of them. Each block is built from the prompt's parts (elements
   with data-lp-part, cloned, so the brand field and the language menu are
   the same controls in both and initLandingPrompt keeps the twins in
   step); a part string starting with a space is literal text between
   them. A step with no parts is the whole list item. Built here rather
   than written into the page so nothing is in the markdown twin twice. */
const LANDING_PROMPT_SHORT = [
  { tag: 'p', parts: ['setup', 'setup-end'] },
  { tag: 'p', parts: ['find', ' ', 'brand', ' ', 'confirm'] },
  {
    tag: 'ol',
    items: [
      { part: 'step-1' },
      { part: 'step-2', parts: ['create', ' ', 'lang', ' ', 'sdk', 'sdk-end'] },
      { part: 'step-3', parts: ['mcp', 'mcp-end'] },
      { part: 'step-4', parts: ['docs', 'docs-end'] },
      { part: 'step-5' },
    ],
  },
]

const buildLandingPromptShort = (text) => {
  const part = (key) => text.querySelector(`[data-lp-part="${key}"]`)
  const fill = (el, parts) => {
    parts.forEach((key) => {
      if (key.startsWith(' ')) {
        el.appendChild(document.createTextNode(key))
        return
      }
      const source = part(key)
      if (source) {
        el.appendChild(source.cloneNode(true))
      }
    })
  }
  const short = document.createElement('div')
  short.className = 'lp-prompt-text lp-prompt-text--short'
  LANDING_PROMPT_SHORT.forEach((block) => {
    if (block.tag === 'ol') {
      const list = document.createElement('ol')
      block.items.forEach((item) => {
        const source = part(item.part)
        if (!source) {
          return
        }
        if (!item.parts) {
          list.appendChild(source.cloneNode(true))
          return
        }
        const li = source.cloneNode(false)
        fill(li, item.parts)
        list.appendChild(li)
      })
      short.appendChild(list)
      return
    }
    const el = document.createElement(block.tag)
    fill(el, block.parts)
    short.appendChild(el)
  })
  return short
}

/* The prompt box on the right: it shows the short form until the pointer
   is over it, a field or a keyboard focus is inside it, or (where nothing
   hovers) it is tapped, then the full prompt, swapped with a view
   transition where there is one. The blanks size themselves to what they
   hold and the short form's twins mirror the prompt's, the shade under
   the text lifts at the end of the scroll, and the button puts the prompt
   on the clipboard and says so for a moment */
const initLandingPrompt = debounce(() => {
  const boxes = [...document.querySelectorAll('.lp-prompt')].filter((box) => box.dataset.lpPromptBound !== 'true')
  if (!boxes.length) {
    return
  }

  const canHover = window.matchMedia('(hover: hover)')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  boxes.forEach((box) => {
    box.dataset.lpPromptBound = 'true'
    // the icons are decoration; the controls' labels say what they do
    box.querySelectorAll('svg').forEach((icon) => icon.setAttribute('aria-hidden', 'true'))

    const body = box.querySelector('.lp-prompt-body')
    const text = box.querySelector('.lp-prompt-text:not(.lp-prompt-text--short)')

    // the short form at rest, and each field paired with its twin
    const twins = new Map()
    if (body && text) {
      const short = buildLandingPromptShort(text)
      text.after(short)
      const pairs = [
        [text.querySelector('.lp-prompt-input'), short.querySelector('.lp-prompt-input')],
        [text.querySelector('.lp-prompt-select'), short.querySelector('.lp-prompt-select')],
      ]
      pairs.forEach(([a, b]) => {
        if (!a || !b) {
          return
        }
        twins.set(a, b)
        twins.set(b, a)
        const mirror = (from, to) => () => {
          if (to.value !== from.value) {
            to.value = from.value
            to.dispatchEvent(new Event('input'))
            to.dispatchEvent(new Event('change'))
          }
        }
        a.addEventListener('input', mirror(a, b))
        b.addEventListener('input', mirror(b, a))
        a.addEventListener('change', mirror(a, b))
        b.addEventListener('change', mirror(b, a))
      })
    }

    /* Each part is named for the swap, the same on a part and its clone.
       Without nested transition groups (Safari, Firefox) a part gliding
       below the fold would show over the button on its way, so the deep
       steps are left unnamed there and fade instead */
    const nested = typeof CSS !== 'undefined' && CSS.supports('view-transition-group', 'nearest')
    box.querySelectorAll('[data-lp-part]').forEach((part) => {
      if (nested || !part.closest('[data-lp-deep]')) {
        part.style.setProperty('--lp-vt', `lp-part-${part.dataset.lpPart}`)
      }
    })

    box.querySelectorAll('.lp-prompt-fill, .lp-prompt-pick').forEach((chip) => {
      const field = chip.querySelector('input, select')
      if (!field) {
        return
      }
      const fit = () => {
        chip.dataset.value =
          field instanceof HTMLSelectElement
            ? (field.options[field.selectedIndex]?.text ?? '')
            : field.value || field.placeholder
      }
      field.addEventListener('input', fit)
      field.addEventListener('change', fit)
      fit()
    })

    let atEnd = () => {}
    if (body) {
      atEnd = () => box.classList.toggle('is-at-end', body.scrollTop + body.clientHeight >= body.scrollHeight - 2)
      body.addEventListener('scroll', atEnd, { passive: true })
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(atEnd).observe(body)
      }
      atEnd()
    }

    /* The box is never shorter than the short form: its height goes into
       --lp-prompt-short (the stylesheet takes the larger of that and the
       base height), read while the short form shows, so a narrow column
       or a long brand name wraps the box taller instead of into a scroll */
    const short = box.querySelector('.lp-prompt-text--short')
    const fitBody = () => {
      if (!body || !short || !box.classList.contains('is-simple')) {
        return
      }
      const style = getComputedStyle(body)
      const needed = short.scrollHeight + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
      box.style.setProperty('--lp-prompt-short', `${Math.ceil(needed)}px`)
    }
    if (short) {
      short.addEventListener('input', fitBody)
      short.addEventListener('change', fitBody)
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(fitBody).observe(short)
      }
    }

    /* The swap. The pointer counts as over the box by where it last was,
       not by a hit test: while a swap runs the browser skips what it has
       captured, and reports the still pointer as having left, which would
       fold the box back and start over. A focus inside counts when it is
       in one of the prompt's fields or shows a ring (a click on the text
       focuses the region too, and should not hold the prompt open once
       the pointer has left). The short form's own fields do not count:
       a tap on one types into the sentence where it is, since swapping
       under the tap would hide the field and the move to its twin, made
       outside the gesture, would not bring up the keyboard on a phone.
       While a swap runs the wish is parked and read again when it is
       done, so a pointer darting in and out never stacks transitions. A
       field focused when the forms do swap (a tap, then the pointer of a
       hybrid device) hands its focus to its twin, caret and all. */
    let simple = false
    let pinned = false
    let pointer = null
    let transition = null
    const over = () => {
      if (!canHover.matches || !pointer) {
        return false
      }
      const rect = box.getBoundingClientRect()
      return pointer.x >= rect.left && pointer.x < rect.right && pointer.y >= rect.top && pointer.y < rect.bottom
    }
    const engaged = (el) =>
      !!el &&
      box.contains(el) &&
      !el.closest('.lp-prompt-text--short') &&
      (el.matches('input, select') || el.matches(':focus-visible'))
    const wantsOpen = (active) => over() || pinned || engaged(active)

    const show = (next, animate = true) => {
      if (next === simple || transition) {
        return
      }
      simple = next
      const apply = () => {
        const active = document.activeElement
        const twin = twins.get(active)
        box.classList.toggle('is-simple', simple)
        if (twin) {
          twin.focus({ preventScroll: true })
          if (active instanceof HTMLInputElement && twin instanceof HTMLInputElement) {
            try {
              twin.setSelectionRange(active.selectionStart, active.selectionEnd, active.selectionDirection ?? 'none')
            } catch {
              // a type of input without a selection
            }
          }
        }
        if (body) {
          body.scrollTop = 0
        }
        fitBody()
        atEnd()
      }
      // without nested groups a scrolled prompt's words would start their
      // glide from above the box, over the heading, so that swap just lands
      const scrolled = !nested && !!body && body.scrollTop > 0
      if (
        !animate ||
        scrolled ||
        typeof document.startViewTransition !== 'function' ||
        reduceMotion.matches ||
        !box.isConnected
      ) {
        apply()
        return
      }
      document.documentElement.classList.add('lp-prompt-swap')
      transition = document.startViewTransition(apply)
      // a swap skipped before it starts (a scroll, a hidden tab) rejects
      // ready, which is nothing to report
      transition.ready.catch(() => {})
      transition.finished
        .catch(() => {})
        .then(() => {
          document.documentElement.classList.remove('lp-prompt-swap')
          transition = null
          update(document.activeElement)
        })
    }
    const update = (active) => show(!wantsOpen(active))

    // a finger is not a hover: it lifts without leaving, and would hold the box open
    const onPointer = (event) => {
      if (event.pointerType === 'touch') {
        return
      }
      pointer = { x: event.clientX, y: event.clientY }
      update(document.activeElement)
    }
    box.addEventListener('pointerenter', onPointer)
    box.addEventListener('pointerleave', onPointer)
    // the snapshots are pinned to the viewport, so a page scroll mid-swap
    // (a focus or an anchor bringing the box into view) would draw the
    // words away from the box; the swap just lands instead
    window.addEventListener('scroll', () => transition?.skipTransition(), { passive: true })
    // read once focus has settled: at focusout the next element is not
    // focused yet, so a Tab to the button would read as leaving; and a
    // window blur leaves the active element where it is, so nothing moves
    const refocus = () => window.setTimeout(() => update(document.activeElement), 0)
    box.addEventListener('focusin', refocus)
    box.addEventListener('focusout', refocus)
    // a tap on the words opens it and one outside closes it, on a phone or
    // with a finger on a laptop that also has a pointer
    let tapped = false
    box.addEventListener('pointerdown', (event) => {
      tapped = event.pointerType === 'touch'
    })
    box.addEventListener('click', (event) => {
      if ((canHover.matches && !tapped) || event.target.closest('input, select, button')) {
        return
      }
      pinned = !pinned
      update(document.activeElement)
    })
    document.addEventListener('pointerdown', (event) => {
      if (pinned && !box.contains(event.target)) {
        pinned = false
        update(document.activeElement)
      }
    })
    // the short form at rest, with no transition at mount
    show(true, false)

    const button = box.querySelector('.lp-prompt-copy')
    const label = box.querySelector('.lp-prompt-copy-text')
    let timer = 0
    button?.addEventListener('click', () => {
      const prompt = text ? landingPromptText(text) : ''
      if (!prompt || !navigator.clipboard) {
        return
      }
      navigator.clipboard
        .writeText(prompt)
        .then(() => {
          button.classList.add('is-copied')
          if (label) {
            label.textContent = 'Copied'
          }
          window.clearTimeout(timer)
          timer = window.setTimeout(() => {
            button.classList.remove('is-copied')
            if (label) {
              label.textContent = 'Copy'
            }
          }, 1600)
        })
        .catch(() => {})
    })
  })
})
/* lp-funnel:end */

/* "Onboard your agent" in the hero (after vercel.com): the three agent
   marks come from the icon templates; a click puts the setup prompt from
   the prompt section on the clipboard, as the text that section's Copy
   gives, and the button shows its copied state for a moment */
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
      const text = document.querySelector('#lp-prompts .lp-prompt-text')
      const prompt = text ? landingPromptText(text) : ''
      if (!prompt || !navigator.clipboard) {
        return
      }
      navigator.clipboard
        .writeText(prompt)
        .then(() => {
          button.classList.add('is-copied')
          button.dispatchEvent(new CustomEvent('lp-onboard-copied'))
          window.clearTimeout(timer)
          timer = window.setTimeout(() => button.classList.remove('is-copied'), 2200)
        })
        .catch(() => {})
    })
  })
}

initDraggableElements()
initFooterAnimation()
initGallery()
initHeroSdkTabs()
initHeroScenes()
initHeroCards()
initLandingBoxLinks()
initLandingOrbs()
initLandingOnboard()
initLandingChat()
initLandingFlow()
initLandingPrompt()
initLandingFunnel()
initLandingWinTabs()
initLandingDocsWindows()

const observer = new MutationObserver((records) => {
  if (!records.some((r) => r.addedNodes.length)) {
    return
  }

  initDraggableElements()
  initFooterAnimation()
  initGallery()
  initHeroSdkTabs()
  initHeroScenes()
  initHeroCards()
  initLandingBoxLinks()
  initLandingOrbs()
  initLandingOnboard()
  initLandingChat()
  initLandingFlow()
  initLandingPrompt()
  initLandingFunnel()
  initLandingWinTabs()
  initLandingDocsWindows()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

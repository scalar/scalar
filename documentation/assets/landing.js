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
/* The grain a planet is painted with runs round it as it turns.

   The ball is a flat disc, so the grain on it would otherwise lie still
   while the name goes round, and a planet whose surface never moves is
   a drawing of a ball rather than a ball. Putting the grain on the ring
   as a shell of little sphere pieces is the true answer and costs far
   too much: pieces carrying a picture, inside a ring whose transform
   changes every frame, took the home page from 120 frames a second to
   46, at any count down to six a planet. So the grain travels across
   the disc instead, at the speed the surface facing us moves, which is
   the planet's whole circumference in one turn. It does not slow into
   the edges the way a real surface does; at this size, against noise
   with no feature in it to follow, what reads is that the surface is
   moving at all. One tile of grain is 160px, so a tile goes by in that
   share of a turn. A scene that turns its rings at a pace of its own
   passes that pace in, so the surface keeps step with the name there
   too. */
const LANDING_GRAIN_TILE = 160
const landingGrainTurn = (globe, size, turn = LANDING_ORB_TURN) => {
  if (size && globe.querySelector('.lp-orb-ball')) {
    globe.style.setProperty('--lp-grain-turn', `${Math.round((turn * LANDING_GRAIN_TILE) / (Math.PI * size))}ms`)
  }
}
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
/* The metrics of a name, from a probe glyph in each ring's own style.
   Reading a style after a write has the browser work out styles again,
   so several globes dressed together hand in all their rings at once:
   the probes go in together, are read together and come out together. */
const measureGlobeNames = (rings) => {
  const probes = rings.map((ring) => {
    const probe = document.createElement('span')
    probe.className = 'lp-orb-glyph'
    probe.textContent = 'x'
    ring.appendChild(probe)
    return probe
  })
  const metrics = probes.map((probe) => {
    const style = getComputedStyle(probe)
    return {
      font: `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
      type: Number.parseFloat(style.fontSize),
      tracking: Number.parseFloat(style.letterSpacing) || 0,
    }
  })
  probes.forEach((probe) => probe.remove())
  return metrics
}
/* a globe's dressing: a copy of its mark (with gradient ids of its
   own, as one mark can stand on two globes), a gap and the glyphs
   of its name round the ring's equator, the word centred on the
   front; the angles hold whatever size the globe takes, as the type
   scales with it. `metrics` is its name's, if they have been measured
   already. */
const dressLandingGlobe = (globe, ring, size, turn = LANDING_ORB_TURN, metrics = null) => {
  const template = document.getElementById(`lp-icon-${globe.dataset.icon}`)
  const label = globe.dataset.label || ''
  if (!template) {
    return false
  }
  landingGrainTurn(globe, size, turn)
  const suffix = `-o${++landingDressCopies}`
  const holder = document.createElement('div')
  holder.innerHTML = template.innerHTML
    .replace(/id="([^"]+)"/g, `id="$1${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`)
  const icon = holder.firstElementChild
  const { font, type, tracking } = metrics ?? measureGlobeNames([ring])[0]
  landingMeasure.font = font
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
/* Planet faces.

   While a planet talks, the glyphs of its name leave the ball's equator
   and settle on an arc across its lower face, a smile, two eyes open
   above them, and the whole head turns towards the pointer.

   Everything stands on the sphere. The name is already a ring of glyphs
   round the ball (dressLandingGlobe puts one .lp-orb-item per glyph on
   the ring, the mark first, each at its angle in --a: rotateY(a)
   translateZ(--s / 2), facing out). A face feature is the same thing at
   a latitude too: rotateY(lon) rotateX(-lat) translateZ(--s / 2)
   rotateZ(roll), so the radius is the host's own --s and follows it. So
   the smile is each glyph sliding over the sphere from its place on the
   equator to its place on the arc, rolling into the curve on the way,
   and the eyes are two more such features. All of them sit in one face
   box inside the ring, and the look is that box turning: a yaw and a
   pitch towards the pointer, which foreshortens the features like a
   head turning, while the eyes themselves stay straight.

   The brand's mark has a part in the face too: a nose between the eyes
   and the smile, the two eyes themselves (two copies of it, in the
   ink), the lead of the smile (the lockup as it stands on the ring,
   bent), or gone. And with body: 'shape' (an experiment) the ball
   itself becomes the mark while the face is on: the mark's silhouette,
   traced once (or baked ahead of time), clips the ball's skin, morphing
   from the disc on the face's own curve; the ball carries is-shaped
   while it is off the disc, so the stylesheet can shade a shape (a
   filter) differently from the disc (its own shadows).

   One controller per page: it keeps the pointer, the frame and the
   settings for every face. Attach a face to a dressed globe after
   dressing it; set(true) for a talk, set(false) after. Transforms and
   opacity only (a clip while a mark-eye opens). The look is the face
   box's rotate property and the expression's tilt its transform, so a
   settled face with no pointer hands its wander to the compositor and
   the main thread rests. Layout is read in the pointer and scroll
   events, before a frame's writes; the frame runs only while something
   moves. */
const createPlanetFaces = (options = {}) => {
  const DEFAULTS = {
    // what the mark does: 'nose', 'eyes', 'smile' (it leads the name
    // round the arc) or 'hide'. A planet whose mark makes a poor eye
    // (a wordmark) opts out with data-mark-eyes="false" and keeps pills
    mark: 'nose',
    // the pupils: 'pill' (upright capsule) or 'dot'; their width, how
    // tall a pill is (times its width), and, when the eyes are the
    // mark, the mark's size; then their distance from the middle and
    // their height, each as a share of the ball's radius (up is negative)
    eyeShape: 'pill',
    eye: 0.18,
    eyeTall: 1.7,
    eyeMark: 0.34,
    eyeX: 0.3,
    eyeY: -0.2,
    // the smile: the circle the glyphs stand on and its lowest point,
    // as shares of the radius
    mouthR: 0.5,
    mouthY: 0.55,
    // a short name is spaced out to this arc, a long one scaled down
    // to that (degrees)
    minSpan: 75,
    maxSpan: 150,
    // where the nose lands, as a share of the radius
    noseY: 0.1,
    // the face's expression: 'happy' (the smile), 'straight' (the name
    // on a line) or 'thinking' (the mouth pulled to one side, one eye
    // narrowed, the head tilted); a change tweens over expressMs
    expression: 'happy',
    expressMs: 340,
    // how far the head turns towards the pointer (degrees, at most);
    // past about 25 the far end of a long smile reaches the rim, and a
    // look up is held short so the eyes stay clear of the bubble
    turn: 24,
    turnUp: 4,
    blink: true,
    // without a pointer the head looks about on its own
    wander: true,
    inMs: 700,
    outMs: 520,
    // the ball itself: 'ball' keeps the disc; 'shape' lets the mark's
    // silhouette take it over while the face is on (the mark drawn
    // filled, its holes filled and its gaps bridged, then softened: a
    // bump or a tip for each of the mark's, none of its detail).
    // shapeClose is the notch it bridges and shapeRound the tip it
    // rounds, each a radius as a share of the mark's size (more than a
    // little rounding erodes a thin ray away); shapeSoft how many waves
    // round the outline survive after that (60: smooth sides, round
    // tips); shapeSize scales it (1 keeps the disc's area); shapeMix
    // how far from the disc it goes. A planet overrides the first four
    // with data-shape-close, -round, -soft and -size, takes its shape
    // from a template lp-shape-<icon> when the page has one, and keeps
    // the disc with data-shape="false"; so does a host with no
    // .lp-orb-skin
    body: 'ball',
    // the shapes baked ahead of time, by the planet's icon (the lab's
    // exportShapes() writes them): when given, nothing is traced on the
    // page, and a planet missing from them keeps its disc
    shapes: null,
    shapeClose: 0.02,
    shapeRound: 0.015,
    shapeSoft: 60,
    shapeSize: 1,
    shapeMix: 1,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
  const settings = { ...DEFAULTS, ...(options.settings ?? {}) }
  /* an expression: how the mouth lies, how open each eye is, and the
     head's tilt (degrees, a roll). The mouth is the name: 'smile' puts
     it on the smile's circle, 'frown' on the same circle turned over,
     'flat' on a line, 'hmm' on a line that rises to one side, shifted
     that way */
  const EXPRESSIONS = {
    happy: { mouth: 'smile', lids: [1, 1], tilt: 0 },
    sad: { mouth: 'frown', lids: [0.72, 0.72], tilt: 0 },
    straight: { mouth: 'flat', lids: [1, 1], tilt: 0 },
    thinking: { mouth: 'hmm', lids: [0.5, 1], tilt: -6 },
  }
  const faces = new Set()
  let pointer = null
  let frame = 0
  let last = null
  const recent = []
  let copies = 0

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  // the mark's shape is traced while the page is idle, one planet at a
  // time, so it never costs a frame (Safari has no idle callback: a
  // timer stands in)
  const idle = (fn) =>
    window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 3000 }) : window.setTimeout(fn, 300)
  const cancelIdle = (id) => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id))
  const clamp01 = (v) => clamp(v, 0, 1)
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
  // a soft overshoot on the way in: the smile dips a touch past and settles
  const easeBack = (p) => 1 + 2.1 * (p - 1) ** 3 + 1.1 * (p - 1) ** 2
  const RAD = 180 / Math.PI
  /* the wander: where a face with no pointer looks at a time, as the
     look's x and y */
  const wanderAt = (seed, ms) => {
    const t = ms / 1000 + seed
    return [0.55 * Math.sin(t * 0.71) * Math.cos(t * 0.23), 0.4 * Math.sin(t * 0.47 + 1.3)]
  }
  /* the head's turn, rotateX(-pitch) rotateY(yaw), as one axis and
     angle for the rotate property (the product of the two half-angle
     quaternions); the transform keeps the tilt, which rotate composes
     outside of, so the matrix is the old transform's exactly */
  const lookRotate = (yaw, pitch) => {
    // the old transform wrote its angles to three places, so these start
    // from the same numbers
    const a = (Number((-pitch).toFixed(3)) * Math.PI) / 360
    const b = (Number(yaw.toFixed(3)) * Math.PI) / 360
    const x = Math.sin(a) * Math.cos(b)
    const y = Math.cos(a) * Math.sin(b)
    const z = Math.sin(a) * Math.sin(b)
    const s = Math.hypot(x, y, z)
    if (s < 1e-7) {
      return '1 0 0 0deg'
    }
    const angle = 2 * Math.atan2(s, Math.cos(a) * Math.cos(b)) * RAD
    return `${(x / s).toFixed(9)} ${(y / s).toFixed(9)} ${(z / s).toFixed(9)} ${angle.toFixed(7)}deg`
  }
  const lookAngles = (gx, gy, on) => [gx * settings.turn * on, Math.max(gy * settings.turn, -settings.turnUp) * on]
  /* a settled face's wander on the compositor: the same curve sampled
     every 100 ms for twenty seconds (linear steps stay within a fiftieth
     of a degree of it), delayed by the look's own easing, from this
     frame; the frame starts the next stretch when one ends */
  const WANDER_SPAN = 20000
  const WANDER_STEP = 100
  const WANDER_LAG = 80
  const startWander = (face, now) => {
    const keyframes = []
    for (let ms = 0; ms <= WANDER_SPAN; ms += WANDER_STEP) {
      const [gx, gy] = wanderAt(face.seed, now + ms - WANDER_LAG)
      const [yaw, pitch] = lookAngles(gx, gy, 1)
      keyframes.push({ offset: ms / WANDER_SPAN, rotate: lookRotate(yaw, pitch) })
    }
    const anim = face.box.animate(keyframes, { duration: WANDER_SPAN, fill: 'forwards' })
    anim.startTime = now
    anim.onfinish = wake
    face.wanderAnim = anim
  }
  /* a pill's blink on the compositor: its lid closes and opens on the
     frame's curve (1 - 0.94 sin(pi p) over 150 ms, sampled every 7.5 ms)
     from where it stands, then holds open until the next blink replaces
     it (an animation that ends costs main-thread frames of its own). The
     frame drops the hold whenever it writes the eyes, and finishes a
     blink itself when the lids are moving (an expression's tween) */
  const BLINK_MS = 150
  const BLINK_HOLD = 6000
  const BLINK = Array.from({ length: 21 }, (_, i) => 1 - 0.94 * Math.sin((Math.PI * i) / 20))
  const blinkLids = (face) => {
    face.eyes.forEach((eye, i) => {
      const v = clamp01((face.e - 0.5) / 0.35) * face.lids[i]
      eye.blink?.cancel()
      const keyframes = BLINK.map((k, j) => ({
        offset: (j * BLINK_MS) / 20 / BLINK_HOLD,
        transform: `scaleY(${(v * k).toFixed(3)})`,
      }))
      keyframes.push({ offset: 1, transform: `scaleY(${v.toFixed(3)})` })
      eye.blink = eye.lid.animate(keyframes, { duration: BLINK_HOLD })
      eye.blink.startTime = face.blinkAt
    })
  }
  const blinking = (face) => face.eyes.some((eye) => eye.blink && eye.blink.currentTime < BLINK_MS)
  const dropBlinks = (face) => {
    face.eyes.forEach((eye) => {
      eye.blink?.cancel()
      eye.blink = null
    })
  }
  const stopWander = (face, now, dt) => {
    face.wanderAnim.cancel()
    face.wanderAnim = null
    // the look carries on from where the wander had it a frame ago, as
    // this frame eases it one more step
    const [gx, gy] = wanderAt(face.seed, now - WANDER_LAG - dt)
    face.gx = gx
    face.gy = gy
    face.rotateWritten = ''
  }

  /* the frame: runs while a face moves, sleeps otherwise; a pointer
     move, a blink's timer, a change of settings or a talk wakes it */
  const awake = () => {
    for (const face of faces) {
      if (!face.rest && face.visible) {
        return true
      }
    }
    return false
  }
  const wake = () => {
    if (!frame && !document.hidden) {
      last = null
      frame = requestAnimationFrame(tick)
    }
  }
  const tick = (now) => {
    frame = 0
    // a frame after a sleep steps as the frames before it did when the
    // look was moving all along, on the compositor
    const woke = last === null
    let dt = 16
    if (last !== null) {
      dt = Math.min(now - last, 100)
      recent.push(dt)
      if (recent.length > 8) {
        recent.shift()
      }
    } else if (recent.length && [...faces].some((face) => face.wanderAnim)) {
      // the shortest of the last few, so one long frame does not count
      dt = Math.min(...recent)
    }
    last = now
    // the planets' places come from the pointer and scroll events and a
    // read after each frame, when layout is clean; a frame reads one
    // itself (a forced style pass, before any write) only when it has
    // none, or for a face out of view, whose frames are rare
    let follow = false
    faces.forEach((face) => {
      if (!face.orb.isConnected) {
        // its planet left the page
        faces.delete(face)
        byOrb.delete(face.orb)
        inView.unobserve(face.orb)
      } else {
        if ((face.far || !face.visible) && face.to === 1 && (face.e !== face.to || now - face.start < face.dur)) {
          // the flags are from the observer's last notice: check them
          // before a morph is skipped, or shown whole on its way back in
          const r = face.orb.getBoundingClientRect()
          face.far =
            r.bottom < -innerHeight / 2 ||
            r.top > innerHeight * 1.5 ||
            r.right < -innerWidth / 2 ||
            r.left > innerWidth * 1.5
          if (!face.far && face.e === 1 && now - face.start < face.dur) {
            // it formed at once while far, but is back before its morph
            // would have ended: the clock takes it from there
            face.e = face.from
          }
        }
        if (pointer && !face.rest) {
          // a frame after a sleep reads an old place too: the planet may
          // have moved while nothing ran
          if (!face.rect || (!face.visible && now - face.rectAt > 400) || (woke && now - face.rectAt > 100)) {
            face.rect = face.orb.getBoundingClientRect()
            face.rectAt = now
          }
          follow ||= face.visible
        }
      }
    })
    if (follow && !refreshing) {
      refreshing = true
      after.port2.postMessage(0)
    }
    let busy = false
    faces.forEach((face) => {
      if (face.frame(now, dt)) {
        busy = true
      }
    })
    if (busy && !document.hidden) {
      frame = requestAnimationFrame(tick)
    }
  }
  const nudge = () => {
    if (awake()) {
      wake()
    }
  }
  /* the talking planets' places, read in the input and scroll events:
     they run before the frame's animation callbacks, while style is
     usually still clean, so the read seldom costs a style pass */
  const measure = () => {
    const at = performance.now()
    faces.forEach((face) => {
      if (!face.rest && face.visible && face.orb.isConnected) {
        face.rect = face.orb.getBoundingClientRect()
        face.rectAt = at
      }
    })
  }
  // the places read again once a frame is done and layout is clean; a
  // planet that moved wakes the frame, so its head follows it
  let refreshing = false
  const after = new MessageChannel()
  after.port1.onmessage = () => {
    refreshing = false
    const before = new Map([...faces].map((face) => [face, face.rect]))
    measure()
    for (const face of faces) {
      const was = before.get(face)
      const rect = face.rect
      if (
        was &&
        rect &&
        was !== rect &&
        (Math.abs(was.left - rect.left) > 0.5 ||
          Math.abs(was.top - rect.top) > 0.5 ||
          Math.abs(was.width - rect.width) > 0.5)
      ) {
        wake()
        break
      }
    }
  }
  // a finger lifts without leaving, so it never sets the look
  const onMove = (event) => {
    if (event.pointerType === 'touch') {
      return
    }
    pointer = { x: event.clientX, y: event.clientY }
    if (awake()) {
      measure()
      wake()
    }
  }
  // a scroll keeps the places fresh; the heads re-aim at the next frame
  // that runs anyway, as they always did
  const onScroll = () => {
    if (pointer && awake()) {
      measure()
    }
    // a face that formed at once far out of view may be scrolled back
    // in before its morph would have ended: the frame checks, before it
    // paints
    const at = performance.now()
    for (const face of faces) {
      if (!face.visible && face.to === 1 && face.e === 1 && at - face.start < face.dur) {
        wake()
        break
      }
    }
  }
  const onLeave = () => {
    pointer = null
    nudge()
  }
  const onUp = (event) => {
    if (event.pointerType !== 'mouse') {
      pointer = null
      nudge()
    }
  }
  /* a face out of view does not form, look about, blink or tween to a
     new expression: nobody would see it, and each would cost frames */
  const byOrb = new Map()
  const inView = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const face = byOrb.get(entry.target)
      if (!face) {
        return
      }
      face.visible = entry.isIntersecting
      // far enough out that a frame cannot bring it in before the next
      // notice: half a viewport beyond any edge
      const root = entry.rootBounds
      const r = entry.boundingClientRect
      face.far =
        !face.visible &&
        Boolean(root) &&
        (r.bottom < root.top - root.height / 2 ||
          r.top > root.bottom + root.height / 2 ||
          r.right < root.left - root.width / 2 ||
          r.left > root.right + root.width / 2)
      if (face.rest) {
        return
      }
      window.clearTimeout(face.blinkTimer)
      if (face.visible) {
        // its place as the observer saw it, fresh and free
        face.rect = entry.boundingClientRect
        face.rectAt = performance.now()
        if (face.to === 1 && face.e === 1 && performance.now() - face.start < face.dur) {
          // it formed at once out of view, but its morph would still be
          // running: the clock takes it from there
          face.e = face.from
          wake()
        }
        if (face.to === 1) {
          // the next blink a little while after it comes into view, and
          // that blink wakes the frame, as a blink always did
          face.nextBlink = performance.now() + 900 + Math.random() * 1600
          face.blinkTimer = window.setTimeout(wake, face.nextBlink - performance.now())
        }
      } else if (!pointer) {
        // its wander goes to the compositor at once
        wake()
      }
    })
  })
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true, capture: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onUp, { passive: true })
  document.documentElement.addEventListener('mouseleave', onLeave)
  document.addEventListener('visibilitychange', nudge)

  /* the mark's silhouette, for a ball that takes its shape. The mark is
     drawn filled on a small canvas and stroked wide, which bridges any
     gap narrower than the closing radius; the outside is flooded from
     the border, so what is left is the mark with its holes filled; its
     edge is traced, the stroke's width taken back off, and the outline
     resampled to even steps and kept as a Fourier series, so a softer
     copy is the same series with fewer of its waves. A mark in pieces (a
     wordmark) keeps each piece as a series of its own */
  // enough points that a ray's sides are curves, not facets, and enough
  // waves kept that the softening has died away before the series ends
  // (cut off early, a series ripples along every edge)
  const SHAPE_N = 400
  const SHAPE_PX = 384
  const SHAPE_FIT = 0.56
  const SHAPE_WAVES = 160
  // the skin's box is this many planets wide, so a tip has room past
  // the disc (the stylesheet's inset on .lp-orb-ball must agree)
  const SHAPE_BOX = 1.5
  const floodOutside = (mask) => {
    const W = SHAPE_PX
    const seen = new Uint8Array(mask.length)
    const stack = []
    const push = (i) => {
      if (!seen[i] && !mask[i]) {
        seen[i] = 1
        stack.push(i)
      }
    }
    for (let x = 0; x < W; x++) {
      push(x)
      push((W - 1) * W + x)
    }
    for (let y = 0; y < W; y++) {
      push(y * W)
      push(y * W + W - 1)
    }
    while (stack.length) {
      const i = stack.pop()
      const x = i % W
      if (x > 0) {
        push(i - 1)
      }
      if (x < W - 1) {
        push(i + 1)
      }
      if (i >= W) {
        push(i - W)
      }
      if (i < mask.length - W) {
        push(i + W)
      }
    }
    for (let i = 0; i < mask.length; i++) {
      mask[i] = seen[i] ? 0 : 1
    }
  }
  /* the edges between a filled pixel and an empty one, chained into
     loops with the filled side always to the same hand; the vertices
     are the pixel corners */
  const outline = (mask) => {
    const W = SHAPE_PX
    const V = W + 1
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= W ? 0 : mask[y * W + x])
    const next = new Map()
    const add = (a, b) => {
      const list = next.get(a)
      if (list) {
        list.push(b)
      } else {
        next.set(a, [b])
      }
    }
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        if (!mask[y * W + x]) {
          continue
        }
        if (!at(x, y - 1)) {
          add(y * V + x, y * V + x + 1)
        }
        if (!at(x + 1, y)) {
          add(y * V + x + 1, (y + 1) * V + x + 1)
        }
        if (!at(x, y + 1)) {
          add((y + 1) * V + x + 1, (y + 1) * V + x)
        }
        if (!at(x - 1, y)) {
          add((y + 1) * V + x, y * V + x)
        }
      }
    }
    const loops = []
    next.forEach((_, start) => {
      let list = next.get(start)
      if (!list || !list.length) {
        return
      }
      const loop = []
      let v = start
      while (true) {
        list = next.get(v)
        if (!list || !list.length) {
          break
        }
        loop.push([v % V, Math.floor(v / V)])
        v = list.pop()
        if (v === start) {
          break
        }
      }
      if (loop.length > 2) {
        loops.push(loop)
      }
    })
    return loops
  }
  const area = (pts) => {
    let a = 0
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[(i + 1) % pts.length]
      a += x0 * y1 - x1 * y0
    }
    return a / 2
  }
  /* the loops worth keeping: the biggest and any other at least a
     twentieth of it (a wordmark is more than one piece), biggest first */
  const loopsOf = (loops) => {
    const sized = loops
      .map((loop) => ({ loop, a: Math.abs(area(loop)) }))
      .filter((l) => l.a > 0)
      .sort((p, q) => q.a - p.a)
    if (!sized.length) {
      return null
    }
    return sized.filter((l) => l.a >= sized[0].a / 20).map((l) => l.loop)
  }
  const perimeter = (loop) => {
    let total = 0
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i]
      const b = loop[(i + 1) % loop.length]
      total += Math.hypot(b[0] - a[0], b[1] - a[1])
    }
    return total
  }
  const resample = (loop, n) => {
    const along = [0]
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i]
      const b = loop[(i + 1) % loop.length]
      along.push(along[i] + Math.hypot(b[0] - a[0], b[1] - a[1]))
    }
    const total = along[loop.length]
    const out = []
    let j = 0
    for (let k = 0; k < n; k++) {
      const s = (total * k) / n
      while (j + 1 < loop.length && along[j + 1] <= s) {
        j++
      }
      const a = loop[j]
      const b = loop[(j + 1) % loop.length]
      const seg = along[j + 1] - along[j]
      const t = seg > 0 ? (s - along[j]) / seg : 0
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
    }
    return out
  }
  const series = (pts) => {
    const n = pts.length
    const waves = Math.min(SHAPE_WAVES, Math.floor(n / 2) - 1)
    const re = new Float64Array(2 * waves + 1)
    const im = new Float64Array(2 * waves + 1)
    for (let k = -waves; k <= waves; k++) {
      let sr = 0
      let si = 0
      for (let j = 0; j < n; j++) {
        const a = (-2 * Math.PI * k * j) / n
        const [x, y] = pts[j]
        sr += x * Math.cos(a) - y * Math.sin(a)
        si += x * Math.sin(a) + y * Math.cos(a)
      }
      re[k + waves] = sr / n
      im[k + waves] = si / n
    }
    return { re, im, n, waves }
  }
  const traceMark = (svg, closeK, roundK) => {
    const view = (svg.getAttribute('viewBox') || '')
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    const [vx, vy, vw, vh] = view.length === 4 && view.every((n) => Number.isFinite(n)) ? view : [0, 0, 24, 24]
    const canvas = document.createElement('canvas')
    canvas.width = SHAPE_PX
    canvas.height = SHAPE_PX
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      return null
    }
    const f = (SHAPE_PX * SHAPE_FIT) / Math.max(vw, vh)
    const r = Math.max(0, closeK) * SHAPE_PX * SHAPE_FIT
    const round = Math.max(0, roundK) * SHAPE_PX * SHAPE_FIT
    ctx.setTransform(f, 0, 0, f, SHAPE_PX / 2 - (vx + vw / 2) * f, SHAPE_PX / 2 - (vy + vh / 2) * f)
    ctx.fillStyle = '#000'
    ctx.strokeStyle = '#000'
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    let drew = false
    svg.querySelectorAll('path').forEach((el) => {
      const d = el.getAttribute('d')
      if (!d || el.closest('defs, clipPath, mask')) {
        return
      }
      const path = new Path2D(d)
      const own = (name, fallback) => el.getAttribute(name) ?? svg.getAttribute(name) ?? fallback
      const fill = own('fill', '#000')
      const stroke = own('stroke', 'none')
      const width = Number.parseFloat(own('stroke-width', '1')) || 1
      ctx.save()
      const move = /translate\(\s*([-\d.]+)[\s,]+([-\d.]+)/.exec(el.getAttribute('transform') || '')
      if (move) {
        ctx.translate(Number(move[1]), Number(move[2]))
      }
      if (fill !== 'none') {
        ctx.fill(path, own('fill-rule', 'nonzero') === 'evenodd' ? 'evenodd' : 'nonzero')
        drew = true
      }
      // the stroke is in the mark's units: the closing radius over the
      // scale (a width of nothing is not a width canvas takes)
      const wide = (stroke !== 'none' ? width : 0) + (2 * r) / f
      if (wide > 0) {
        ctx.lineWidth = wide
        ctx.stroke(path)
        drew = true
      }
      ctx.restore()
    })
    if (!drew) {
      return null
    }
    const read = () => {
      const data = ctx.getImageData(0, 0, SHAPE_PX, SHAPE_PX).data
      const mask = new Uint8Array(SHAPE_PX * SHAPE_PX)
      for (let i = 0; i < mask.length; i++) {
        mask[i] = data[i * 4 + 3] > 127 ? 1 : 0
      }
      return mask
    }
    // the outlines drawn again, grown by a stroke round them or shrunk
    // by one taken out of them, and traced again
    const redraw = (loops, grow) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, SHAPE_PX, SHAPE_PX)
      const closed = new Path2D()
      loops.forEach((loop) => {
        loop.forEach(([x, y], i) => (i ? closed.lineTo(x, y) : closed.moveTo(x, y)))
        closed.closePath()
      })
      ctx.fill(closed)
      if (grow) {
        ctx.globalCompositeOperation = grow > 0 ? 'source-over' : 'destination-out'
        ctx.lineWidth = 2 * Math.abs(grow)
        ctx.stroke(closed)
        ctx.globalCompositeOperation = 'source-over'
      }
      return loopsOf(outline(read()))
    }
    const mask = read()
    floodOutside(mask)
    let loops = loopsOf(outline(mask))
    if (loops && r > 0) {
      // the stroke's width off again: what it bridged stays bridged
      loops = redraw(loops, -r)
    }
    if (loops && round > 0) {
      // the tips rounded: anything thinner than the radius goes, and
      // what is left grows back by as much
      loops = redraw(loops, -round)
      if (loops) {
        loops = redraw(loops, round)
      }
    }
    if (!loops) {
      return null
    }
    // the points shared out by length, each piece getting a few at least
    const lengths = loops.map(perimeter)
    const total = lengths.reduce((sum, l) => sum + l, 0)
    return loops.map((loop, i) => series(resample(loop, Math.max(24, Math.round((SHAPE_N * lengths[i]) / total)))))
  }
  /* the shape at a softness: each piece's series summed with every wave
     past the soft one weighted down, all of them centred on their area
     and scaled to the disc's (times size), in radii, and joined into one
     outline: each further piece spliced into the first at the closest
     pair of points, there and back along one line, which adds no area.
     For the morph, each point also keeps where it stands on the disc and
     how far it goes from there */
  const shapeAt = (pieces, soft, size) => {
    const loops = pieces.map((ser) => {
      const pts = []
      for (let j = 0; j < ser.n; j++) {
        let x = 0
        let y = 0
        for (let k = -ser.waves; k <= ser.waves; k++) {
          const w = Math.exp(-((k / Math.max(soft, 0.5)) ** 2))
          if (w < 1e-4) {
            continue
          }
          const a = (2 * Math.PI * k * j) / ser.n
          const cr = ser.re[k + ser.waves]
          const ci = ser.im[k + ser.waves]
          x += w * (cr * Math.cos(a) - ci * Math.sin(a))
          y += w * (cr * Math.sin(a) + ci * Math.cos(a))
        }
        pts.push([x, y])
      }
      return pts
    })
    let total = 0
    let cx = 0
    let cy = 0
    loops.forEach((pts) => {
      total += area(pts)
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i]
        const [x1, y1] = pts[(i + 1) % pts.length]
        const c = x0 * y1 - x1 * y0
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
      }
    })
    if (!total) {
      return null
    }
    cx /= 6 * total
    cy /= 6 * total
    // the disc's area times size, held inside the skin's box with the
    // morph's overshoot (easeBack peaks near 1.045) and a little to spare,
    // so no ray is ever cut flat at the box's edge
    let reach = 0
    loops.forEach((pts) => pts.forEach(([x, y]) => (reach = Math.max(reach, Math.abs(x - cx), Math.abs(y - cy)))))
    const s = Math.min(size * Math.sqrt(Math.PI / Math.abs(total)), (SHAPE_BOX * 0.98) / 1.05 / (reach || 1))
    const scaled = loops.map((pts) => pts.map(([x, y]) => [(x - cx) * s, (y - cy) * s]))
    let seq = scaled[0]
    scaled.slice(1).forEach((loop) => {
      let best = Number.POSITIVE_INFINITY
      let bi = 0
      let bj = 0
      seq.forEach((p, i) => {
        loop.forEach((q, j) => {
          const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
          if (d < best) {
            best = d
            bi = i
            bj = j
          }
        })
      })
      seq = [...seq.slice(0, bi + 1), ...loop.slice(bj), ...loop.slice(0, bj), loop[bj], seq[bi], ...seq.slice(bi + 1)]
    })
    return seq.map(([x, y]) => {
      const r = Math.hypot(x, y) || 1
      return { cx: x / r, cy: y / r, dx: x - x / r, dy: y - y / r }
    })
  }
  const clipAt = (poly, m) => {
    const k = 50 / SHAPE_BOX
    let s = ''
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]
      s += `${i ? ',' : ''}${(50 + k * (p.cx + p.dx * m)).toFixed(2)}% ${(50 + k * (p.cy + p.dy * m)).toFixed(2)}%`
    }
    return `polygon(${s})`
  }

  /* a baked shape: points in thousandths of the radius, the first one
     whole and each after it as a step from the one before ("x,y dx,dy
     ..."), which keeps the string short; read into the morph's points */
  const fromBaked = (text) => {
    let x = 0
    let y = 0
    const out = []
    text
      .trim()
      .split(/\s+/)
      .forEach((pair) => {
        const [a, b] = pair.split(',').map(Number)
        x += a
        y += b
        const px = x / 1000
        const py = y / 1000
        const r = Math.hypot(px, py) || 1
        out.push({ cx: px / r, cy: py / r, dx: px - px / r, dy: py - py / r })
      })
    return out.length > 2 ? out : null
  }
  const toBaked = (poly) => {
    let x = 0
    let y = 0
    return poly
      .map((p) => {
        const px = Math.round((p.cx + p.dx) * 1000)
        const py = Math.round((p.cy + p.dy) * 1000)
        const step = `${px - x},${py - y}`
        x = px
        y = py
        return step
      })
      .join(' ')
  }

  /* a copy of the mark for an eye, its gradient ids made its own */
  const copyMark = (svg) => {
    const suffix = `-e${++copies}`
    const holder = document.createElement('span')
    holder.className = 'lp-eye-mark'
    holder.innerHTML = svg.outerHTML
      .replace(/id="([^"]+)"/g, `id="$1${suffix}"`)
      .replace(/url\(#([^)]+)\)/g, `url(#$1${suffix})`)
    return holder
  }
  /* a feature's place on the sphere: longitude and latitude (radians)
     from where it should appear on the face when the head is straight,
     x to the right and y down, as shares of the radius */
  const onSphere = (x, y) => {
    const lat = Math.asin(clamp(y, -0.96, 0.96))
    const lon = Math.asin(clamp(x / Math.cos(lat), -0.96, 0.96))
    return { lon, lat }
  }
  const place = (lon, lat, roll = 0) =>
    `rotateY(${(lon * RAD).toFixed(3)}deg) rotateX(${(-lat * RAD).toFixed(3)}deg) translateZ(calc(var(--s) / 2))${roll ? ` rotateZ(${(roll * RAD).toFixed(3)}deg)` : ''}`

  const createFace = (orb, ring) => {
    const items = [...ring.querySelectorAll('.lp-orb-item')].map((item) => ({
      el: item,
      glyph: item.firstElementChild,
      a: (Number.parseFloat(item.style.getPropertyValue('--a')) * Math.PI) / 180,
      lon: 0,
      lat: 0,
      roll: 0,
      scale: 1,
    }))
    const mark = items[0]
    const letters = items.slice(1)
    const markSvg = mark?.glyph.querySelector('svg')
    // the ball's skin, when the host has one: the layer the shape clips;
    // and the shape's source, a template of its own or the mark
    const skin = orb.querySelector('.lp-orb-skin')
    const shapeSvg = document.getElementById(`lp-shape-${orb.dataset.icon}`)?.content?.firstElementChild ?? markSvg
    // a planet's own values for the shape, over the settings
    const shapeSetting = (key) => {
      const own = Number.parseFloat(orb.dataset[key] ?? '')
      return Number.isFinite(own) ? own : settings[key]
    }
    // the face box: one box in the ring holding the glyphs (moved in)
    // and the eyes; the look turns it. Each eye is a zero-size box on
    // the sphere, a lid (the blink), a pupil holding a capsule of two
    // round caps and a bar, and a copy of the mark for when the eyes
    // are the mark
    const box = document.createElement('div')
    box.className = 'lp-face'
    items.forEach((item) => box.appendChild(item.el))
    const eyes = [-1, 1].map((side) => {
      const eye = document.createElement('div')
      eye.className = 'lp-eye'
      const lid = document.createElement('div')
      lid.className = 'lp-eye-lid'
      const pupil = document.createElement('div')
      pupil.className = 'lp-eye-pupil'
      const capA = document.createElement('i')
      capA.className = 'lp-eye-cap'
      const bar = document.createElement('i')
      bar.className = 'lp-eye-bar'
      const capB = document.createElement('i')
      capB.className = 'lp-eye-cap'
      pupil.append(capA, bar, capB)
      let markEl = null
      if (markSvg) {
        markEl = copyMark(markSvg)
        pupil.appendChild(markEl)
      }
      lid.appendChild(pupil)
      eye.appendChild(lid)
      box.appendChild(eye)
      return { side, el: eye, lid, pupil, capA, bar, capB, markEl }
    })
    ring.appendChild(box)

    const face = {
      orb,
      ring,
      box,
      eyes,
      rect: null,
      arc: letters,
      nose: { lon: 0, lat: 0 },
      marks: false,
      // the mark's outline as a series, and the shape the ball takes, each
      // with the settings it was made for, and the idle task making them
      series: null,
      seriesClose: null,
      poly: null,
      polyKey: null,
      shapeTask: 0,
      shaped: false,
      expression: settings.expression,
      // the expression's targets, the ones before, and the tween between
      goal: null,
      prior: null,
      x: 1,
      xStart: 0,
      lids: [1, 1],
      tilt: 0,
      e: 0,
      to: 0,
      from: 0,
      start: 0,
      dur: 0,
      rest: true,
      // what the last frame wrote, to skip the writes nothing changed
      written: -1,
      blinkWritten: 1,
      xWritten: -1,
      dirty: true,
      // the look, smoothed, and the head's own wander
      gx: 0,
      gy: 0,
      seed: Math.random() * 1000,
      nextBlink: 0,
      blinkAt: -1e9,
      blinkTimer: 0,
      rectAt: 0,
      visible: true,
      far: false,
      // the compositor's wander, and what the frame last wrote
      wanderAnim: null,
      wanderFrom: null,
      rotateWritten: '',
      tiltWritten: '',
    }

    /* the face's geometry: each glyph's arc position on the equator
       (its angle, which is its arc length over the radius) becomes its
       position on the smile's circle, the word centred at the bottom,
       and that becomes a place on the sphere; a short word is spaced
       out to the least arc, a long one scaled down to the most. The
       eyes and the nose get their places on the sphere too, and the
       eyes their shape, all in terms of the host's --s */
    const layout = () => {
      face.dirty = true
      face.marks = settings.mark === 'eyes' && Boolean(markSvg) && orb.dataset.markEyes !== 'false'
      box.style.setProperty('--lp-eye-d', `calc(var(--s) * ${(settings.eye / 2).toFixed(4)})`)
      box.style.setProperty('--lp-eye-mark', `calc(var(--s) * ${(settings.eyeMark / 2).toFixed(4)})`)
      box.classList.toggle('is-marks', face.marks)
      const tall = settings.eyeShape === 'pill' ? settings.eyeTall : 1
      // the caps sit half the bar apart: the bar is (tall - 1) pupil
      // widths, a pupil width is eye * --s / 2
      const half = (settings.eye * (tall - 1)) / 4
      eyes.forEach((eye) => {
        const { lon, lat } = onSphere(eye.side * settings.eyeX, settings.eyeY)
        eye.el.style.transform = place(lon, lat)
        eye.capA.style.transform = `translateY(calc(var(--s) * ${(-half).toFixed(4)}))`
        eye.capB.style.transform = `translateY(calc(var(--s) * ${half.toFixed(4)}))`
        eye.bar.style.transform = `scaleY(${(tall - 1).toFixed(3)})`
      })
      face.nose = onSphere(0, settings.noseY)
      face.arc = settings.mark === 'smile' && mark ? [mark, ...letters] : letters
      if (!wantsShape()) {
        face.poly = null
        face.polyKey = null
        unshape()
      } else if (face.polyKey !== shapeKey() && settings.shapes) {
        prepareShape()
      } else if (face.polyKey !== shapeKey() && !face.shapeTask) {
        // the shape it has stays until the new one is ready
        face.shapeTask = idle(prepareShape)
      }
      face.goal = aim(face.expression)
      face.prior = face.goal
      face.x = 1
    }

    /* the ball's shape: traced from the mark (or its own template) and
       softened, made in an idle moment after attach or a change of
       settings, or at once when a talk starts before that */
    // back to the plain disc: no clip, no shaped class
    const unshape = () => {
      if (skin) {
        skin.style.clipPath = ''
        skin.parentElement.classList.remove('is-shaped')
      }
      face.shaped = false
    }
    const baked = () => settings.shapes?.[orb.dataset.icon]
    const wantsShape = () =>
      settings.body === 'shape' &&
      Boolean(skin) &&
      orb.dataset.shape !== 'false' &&
      (settings.shapes ? Boolean(baked()) : Boolean(shapeSvg))
    const shapeKey = () =>
      settings.shapes
        ? `baked:${baked()?.length}`
        : ['shapeClose', 'shapeRound', 'shapeSoft', 'shapeSize'].map(shapeSetting).join(':')
    const prepareShape = () => {
      face.shapeTask = 0
      if (!wantsShape() || face.polyKey === shapeKey()) {
        return
      }
      if (settings.shapes) {
        // baked: read, nothing traced
        face.poly = fromBaked(baked())
        face.polyKey = shapeKey()
        face.dirty = true
        if (!face.rest) {
          wake()
        }
        return
      }
      const traced = `${shapeSetting('shapeClose')}:${shapeSetting('shapeRound')}`
      if (!face.series || face.seriesClose !== traced) {
        face.series = traceMark(shapeSvg, shapeSetting('shapeClose'), shapeSetting('shapeRound'))
        face.seriesClose = traced
      }
      face.poly = face.series ? shapeAt(face.series, shapeSetting('shapeSoft'), shapeSetting('shapeSize')) : null
      face.polyKey = shapeKey()
      // a face already on takes the new shape at its next frame
      face.dirty = true
      if (!face.rest) {
        wake()
      }
    }

    /* where the mouth's glyphs, the lids and the tilt go for an
       expression. Each glyph's arc position on the equator (its angle,
       which is its arc length over the radius) becomes its position
       along the mouth, the word centred; on the smile a short word is
       spaced out to the least arc and a long one scaled down to the
       most, on a line a long word is scaled to fit the face */
    const aim = (name) => {
      const expr = EXPRESSIONS[name] ?? EXPRESSIONS.happy
      const arc = face.arc
      const r = settings.mouthR
      const yc = settings.mouthY - r
      const out = { items: [], lids: expr.lids, tilt: expr.tilt }
      if (!arc.length) {
        return out
      }
      const pos = arc.map((l) => l.a)
      const first = pos[0]
      const final = pos[pos.length - 1]
      const centre = (first + final) / 2
      const step = arc.length > 1 ? (final - first) / (arc.length - 1) : 0
      const extent = final - first + step
      let offsets = pos.map((p) => p - centre)
      let scale = 1
      if (expr.mouth === 'smile' || expr.mouth === 'frown') {
        const span = extent / r
        const min = (settings.minSpan * Math.PI) / 180
        const max = (settings.maxSpan * Math.PI) / 180
        if (span < min && extent > 0) {
          offsets = offsets.map((q) => (q * (min * r)) / extent)
        } else if (span > max) {
          scale = max / span
          offsets = offsets.map((q) => q * scale)
        }
        // a frown is the smile's own circle turned over: its centre sits
        // above the mouth instead of below, so the word keeps its middle
        // where it was and bows its ends down. The glyphs follow the
        // tangent either way, so the roll turns over with it
        const down = expr.mouth === 'frown'
        const mid = down ? settings.mouthY + r : yc
        out.items = offsets.map((q) => {
          const psi = q / r
          const y = down ? mid - r * Math.cos(psi) : mid + r * Math.cos(psi)
          return { ...onSphere(r * Math.sin(psi), y), roll: down ? psi : -psi, scale }
        })
        return out
      }
      // a line across the lower face, held short of the rim (shorter
      // still when it sits to one side)
      const width = expr.mouth === 'hmm' ? 0.88 : 0.98
      if (extent > width) {
        scale = width / extent
        offsets = offsets.map((q) => q * scale)
      }
      const flatY = settings.mouthY - 0.1
      if (expr.mouth === 'flat') {
        out.items = offsets.map((q) => ({ ...onSphere(q, flatY), roll: 0, scale }))
        return out
      }
      // 'hmm': the line rises to the right and sits a little that way
      const slope = -0.24
      const shift = 0.07
      const roll = Math.atan(slope)
      out.items = offsets.map((q) => {
        const x = q * Math.cos(roll) + shift
        return { ...onSphere(x, flatY + 0.02 + slope * (x - shift)), roll, scale }
      })
      return out
    }

    /* another expression, tweened from wherever the face is now */
    face.express = (name, animate = true) => {
      if (!EXPRESSIONS[name] || name === face.expression) {
        return
      }
      face.expression = name
      // the lids move with the tween now: the frame finishes any blink
      dropBlinks(face)
      const cur = current()
      face.goal = aim(name)
      if (animate && face.visible && !settings.reduceMotion && settings.expressMs > 0) {
        face.prior = cur
        face.x = 0
        face.xStart = performance.now()
      } else {
        face.prior = face.goal
        face.x = 1
      }
      face.dirty = true
      wake()
    }
    /* the targets as they stand now, between the prior and the goal */
    const current = () => {
      const k = easeInOut(face.x)
      const mix = (a, b) => a + (b - a) * k
      return {
        items: face.goal.items.map((g, i) => {
          const o = face.prior.items[i] ?? g
          return {
            lon: mix(o.lon, g.lon),
            lat: mix(o.lat, g.lat),
            roll: mix(o.roll, g.roll),
            scale: mix(o.scale, g.scale),
          }
        }),
        lids: [mix(face.prior.lids[0], face.goal.lids[0]), mix(face.prior.lids[1], face.goal.lids[1])],
        tilt: mix(face.prior.tilt, face.goal.tilt),
      }
    }

    const restore = () => {
      items.forEach(({ el, glyph }) => {
        el.style.transform = ''
        glyph.style.transform = ''
        glyph.style.opacity = ''
      })
      face.wanderAnim?.cancel()
      face.wanderAnim = null
      face.wanderFrom = null
      dropBlinks(face)
      box.style.transform = ''
      box.style.rotate = ''
      unshape()
      face.rotateWritten = ''
      face.tiltWritten = ''
      box.classList.remove('is-on')
      window.clearTimeout(face.blinkTimer)
      face.rest = true
      // nothing the last talk wrote stands now: the next talk's first
      // frame writes it all again (a talk that forms at once, under
      // reduced motion, would otherwise match the memo and write nothing)
      face.written = -1
      face.xWritten = -1
      face.blinkWritten = -1
    }

    face.set = (on) => {
      const to = on ? 1 : 0
      if (face.to === to) {
        return
      }
      if (face.to === 1 && face.e === 1 && performance.now() - face.start < face.dur) {
        // it formed at once out of view: it turns back from where its
        // morph would be
        face.e = face.from + (1 - face.from) * easeBack(clamp01((performance.now() - face.start) / face.dur))
      }
      if (on && wantsShape() && face.polyKey !== shapeKey()) {
        // a talk before the idle moment came: the shape is made now
        cancelIdle(face.shapeTask)
        prepareShape()
      }
      face.to = to
      face.from = face.e
      face.start = performance.now()
      face.dur = on ? settings.inMs : settings.outMs
      window.clearTimeout(face.blinkTimer)
      if (on) {
        box.classList.add('is-on')
        face.rest = false
        face.nextBlink = face.start + 1800 + Math.random() * 1600
      }
      wake()
    }
    // the radius is the host's --s, so a new size needs no measuring;
    // kept for a host that wants to say so
    face.resize = () => {
      layout()
      wake()
    }
    face.layout = () => {
      layout()
      wake()
    }
    face.detach = () => {
      cancelIdle(face.shapeTask)
      face.shapeTask = 0
      restore()
      items.forEach((item) => ring.appendChild(item.el))
      box.remove()
      faces.delete(face)
      byOrb.delete(orb)
      inView.unobserve(orb)
    }

    face.frame = (now, dt) => {
      // the morph; a face forming far out of view goes straight to where
      // it is going (one unwinding always unwinds: it may be on its way
      // back into view)
      if (face.e !== face.to) {
        if (settings.reduceMotion || face.dur <= 0 || (face.far && face.to === 1)) {
          face.e = face.to
        } else {
          const p = clamp01((now - face.start) / face.dur)
          const k = face.to > face.from ? easeBack(p) : easeInOut(p)
          face.e = p >= 1 ? face.to : face.from + (face.to - face.from) * k
        }
      }
      const e = face.e
      if (e <= 0 && face.to === 0) {
        if (!face.rest) {
          restore()
        }
        return false
      }
      const on = clamp01(e)
      // the expression's tween
      if (face.x < 1) {
        const p = clamp01((now - face.xStart) / settings.expressMs)
        face.x = p >= 1 ? 1 : p
      }
      if (face.x < 1 || face.dirty) {
        const stand = current()
        stand.items.forEach((t, i) => {
          const l = face.arc[i]
          l.lon = t.lon
          l.lat = t.lat
          l.roll = t.roll
          l.scale = t.scale
        })
        face.lids = stand.lids
        face.tilt = stand.tilt
      }

      // where to look: the pointer, from the ball's centre, saturating a
      // few radii out; or, with no pointer, a slow wander; eased so a
      // jump of the pointer is a glance, not a snap. A settled face with
      // no pointer wanders on the compositor instead (startWander)
      const wandering = !pointer && settings.wander && !settings.reduceMotion
      // the compositor takes over once the look has eased onto the wander
      // (half a second, six of its time constants), so a pointer leaving
      // still glides back into it
      if (!wandering) {
        face.wanderFrom = null
      } else if (face.wanderFrom === null) {
        face.wanderFrom = now
      }
      // out of view it hands over at once (nobody sees a glide) and keeps
      // wandering there, which costs the main thread nothing
      const settled = wandering && face.to === 1 && e === 1
      const free = settled && (!face.visible || now - face.wanderFrom >= 500)
      if (face.wanderAnim && (!settled || face.wanderAnim.playState === 'finished')) {
        stopWander(face, now, dt)
      }
      if (free && !face.wanderAnim) {
        startWander(face, now)
      }
      let looking = false
      if (!face.wanderAnim) {
        let tx = 0
        let ty = 0
        if (pointer && face.rect) {
          const R = face.rect.width / 2
          const dx = pointer.x - (face.rect.left + R)
          const dy = pointer.y - (face.rect.top + R)
          const dist = Math.hypot(dx, dy)
          if (dist > 0.5) {
            const k = dist / (dist + 2.5 * R)
            tx = (dx / dist) * k
            ty = (dy / dist) * k
          }
        } else if (settings.wander && !settings.reduceMotion) {
          ;[tx, ty] = wanderAt(face.seed, now)
        }
        // out of view the look snaps to its target on frames that run
        // anyway, and keeps nothing awake
        looking = face.visible && (Math.abs(tx - face.gx) > 0.0005 || Math.abs(ty - face.gy) > 0.0005)
        if (looking) {
          const ease = 1 - Math.exp(-dt / 80)
          face.gx += (tx - face.gx) * ease
          face.gy += (ty - face.gy) * ease
        } else {
          face.gx = tx
          face.gy = ty
        }
        // the head turns towards the look: yaw to the side, pitch up or
        // down (a positive rotateX lifts the front, so the pitch is
        // signed the other way; a look up is held short), both held back
        // while the face is still forming
        const [yaw, pitch] = lookAngles(face.gx, face.gy, on)
        const rotate = lookRotate(yaw, pitch)
        if (rotate !== face.rotateWritten) {
          box.style.rotate = rotate
          face.rotateWritten = rotate
        }
      }
      const tilt = `rotateZ(${(face.tilt * on).toFixed(3)}deg)`
      if (tilt !== face.tiltWritten) {
        box.style.transform = tilt
        face.tiltWritten = tilt
      }

      // a blink now and then, once the face is there: pills on the
      // compositor (blinkLids), a mark-eye by the frame
      let blink = 1
      let midBlink = false
      if (settings.blink && !settings.reduceMotion && face.visible && face.to === 1 && e >= 0.95) {
        if (now >= face.nextBlink) {
          face.blinkAt = now
          face.nextBlink = now + 2600 + Math.random() * 3200
          if (!face.marks && face.x >= 1) {
            blinkLids(face)
          }
        }
        const bp = (now - face.blinkAt) / BLINK_MS
        if ((face.marks || !blinking(face)) && bp >= 0 && bp < 1) {
          blink = 1 - 0.94 * Math.sin(Math.PI * bp)
          midBlink = true
        }
      } else if (blinking(face)) {
        // a blink stops the moment it may not run, as it always did
        dropBlinks(face)
        face.blinkWritten = -1
      }

      // the features move with the morph and the blink only; a frame
      // that changed neither writes nothing here
      const shapeSame = e === face.written && face.x === face.xWritten && !face.dirty
      const eyesSame = shapeSame && blink === face.blinkWritten
      face.written = e
      face.blinkWritten = blink
      face.xWritten = face.x
      face.dirty = false
      if (!shapeSame) {
        // the ball: the disc gives way to the mark's shape as the face
        // forms, on the same curve, and back
        if (face.poly) {
          // shaped only while it is off the disc: the stylesheet gives a
          // shaped ball its filter, the plain disc its own shadows
          if (e > 0 !== face.shaped) {
            skin.parentElement.classList.toggle('is-shaped', e > 0)
            face.shaped = e > 0
          }
          skin.style.clipPath = e > 0 ? clipAt(face.poly, settings.shapeMix * e) : ''
        }
        // the glyphs slide over the sphere from the equator to the arc,
        // rolling into the curve on the way
        face.arc.forEach((l) => {
          const lon = l.a + (l.lon - l.a) * e
          l.el.style.transform = place(lon, l.lat * e, l.roll * e)
          l.glyph.style.opacity = ''
          l.glyph.style.transform =
            l.scale !== 1 ? `translate(-50%, -50%) scale(${(1 + (l.scale - 1) * on).toFixed(3)})` : ''
        })
        // the mark: down the sphere as a nose, or gone by the time the
        // eyes open (as the smile's lead it went round with the glyphs)
        if (mark && settings.mark !== 'smile') {
          if (settings.mark === 'nose') {
            mark.el.style.transform = place(mark.a * (1 - e), face.nose.lat * e)
            mark.glyph.style.transform = `translate(-50%, -50%) scale(${(1 - 0.2 * on).toFixed(3)})`
            mark.glyph.style.opacity = ''
          } else {
            // a fade, at its own size (Cameron: no scaling on the way out)
            const k = clamp01(1 - e / 0.45)
            mark.el.style.transform = ''
            mark.glyph.style.opacity = k.toFixed(3)
            mark.glyph.style.transform = ''
          }
        }
      }
      if (!eyesSame) {
        // the eyes open once the smile is mostly there: a pill as a lid
        // (scaled from a line), a mark by a clip from its middle, so it
        // is never squashed; they stay where they are and look straight
        // ahead, the head does the turning
        const open = clamp01((e - 0.5) / 0.35)
        eyes.forEach((eye, i) => {
          const v = open * blink * face.lids[i]
          if (face.marks && eye.markEl) {
            if (eye.blink) {
              // a pill's blink or hold would scale the mark
              eye.blink.cancel()
              eye.blink = null
            }
            eye.lid.style.transform = ''
            eye.pupil.style.transform = ''
            eye.markEl.style.clipPath = `inset(${(50 * (1 - v)).toFixed(1)}% 0)`
          } else {
            if (eye.markEl) {
              eye.markEl.style.clipPath = ''
            }
            if (eye.blink && eye.blink.currentTime >= BLINK_MS) {
              // the blink is over: its hold would mask this write
              eye.blink.cancel()
              eye.blink = null
            }
            eye.lid.style.transform = `scaleY(${v.toFixed(3)})`
            eye.pupil.style.transform = `scale(${(0.5 + 0.5 * open).toFixed(3)})`
          }
        })
      }

      // still moving? Otherwise the frame sleeps: a pointer move or a
      // change wakes it, and the next blink by its timer
      const moving =
        e !== face.to || looking || (wandering && face.visible && !face.wanderAnim) || midBlink || face.x < 1
      if (!moving && settings.blink && !settings.reduceMotion && face.visible && face.to === 1) {
        window.clearTimeout(face.blinkTimer)
        face.blinkTimer = window.setTimeout(wake, Math.max(0, face.nextBlink - now))
      }
      return moving
    }

    layout()
    return face
  }

  return {
    settings,
    attach: (orb, ring) => {
      const face = createFace(orb, ring)
      faces.add(face)
      byOrb.set(orb, face)
      inView.observe(orb)
      return face
    },
    /* every face's shape as it stands, baked for settings.shapes */
    exportShapes: () => {
      const out = {}
      faces.forEach((face) => {
        if (face.poly) {
          out[face.orb.dataset.icon] = toBaked(face.poly)
        }
      })
      return out
    },
    /* new settings for every face; the geometry follows at once */
    update: (next) => {
      const expression = next.expression
      Object.assign(settings, next)
      faces.forEach((face) => {
        if (face.wanderAnim && ('turn' in next || 'turnUp' in next)) {
          // baked into the running wander: the next frame bakes it again
          stopWander(face, performance.now(), recent.length ? Math.min(...recent) : 16)
        }
        if (expression) {
          face.express(expression)
        }
        face.layout()
      })
    },
    pointer: (x, y) => {
      pointer = x === null ? null : { x, y }
      nudge()
    },
    destroy: () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', nudge)
      ;[...faces].forEach((face) => face.detach())
      inView.disconnect()
      after.port1.close()
      cancelAnimationFrame(frame)
      frame = 0
    },
  }
}
/* The planets' shapes, baked ahead of time so the page traces nothing:
   createPlanetFaces with body: 'shape' and no shapes given traces each
   mark itself, and its exportShapes() writes them out as these, points
   in thousandths of the radius, each a step from the last. T3 Code has
   none, a wordmark makes no planet, so it keeps its disc */
const LANDING_SHAPES = {
  chatgpt:
    '-246,-1018 18,-2 20,-1 21,-1 20,0 21,0 21,0 21,1 20,1 19,2 18,3 17,3 17,5 15,5 15,6 15,6 14,7 15,6 14,7 14,7 13,8 13,8 13,8 13,8 13,8 12,9 12,8 14,8 15,5 17,3 18,0 17,-2 18,-3 17,-4 18,-3 19,-3 19,-1 21,0 20,0 20,1 19,2 18,3 18,3 17,4 17,4 16,5 16,5 15,6 15,7 14,7 14,6 14,7 13,8 14,7 13,8 13,8 13,8 12,8 11,10 10,11 10,11 10,12 10,11 10,10 11,11 10,11 9,11 9,12 9,12 9,12 9,12 8,13 7,14 7,14 7,14 6,15 6,15 5,16 4,16 5,17 3,18 4,17 3,18 2,19 1,20 0,21 0,20 0,21 -1,20 -2,19 -2,18 -1,18 3,16 5,14 8,13 9,12 9,12 10,11 9,12 9,12 8,13 8,13 7,13 9,13 8,13 8,13 7,14 6,15 6,15 5,15 5,16 5,16 5,16 4,17 4,17 3,18 2,19 3,18 2,18 0,19 -1,18 -3,18 -3,18 -2,18 -4,17 -3,18 -4,17 -4,17 -5,15 -6,16 -6,14 -6,15 -7,15 -7,14 -7,14 -8,13 -8,12 -9,13 -8,12 -9,13 -9,11 -10,11 -11,10 -10,11 -11,10 -10,12 -9,11 -10,11 -11,10 -13,8 -13,8 -13,8 -13,8 -13,8 -14,7 -14,7 -14,6 -15,6 -15,6 -16,6 -14,7 -11,10 -8,13 -5,16 -4,16 -4,17 -6,15 -6,15 -7,14 -7,14 -7,14 -8,13 -9,12 -8,13 -9,12 -8,13 -9,12 -8,13 -9,11 -10,11 -11,10 -12,10 -11,10 -11,9 -12,10 -11,9 -12,9 -12,9 -12,9 -13,8 -14,7 -15,6 -15,6 -14,7 -15,6 -14,7 -15,6 -16,4 -17,5 -17,3 -19,3 -19,2 -18,2 -19,3 -18,2 -19,0 -18,-1 -18,-3 -18,-3 -18,-3 -17,-3 -18,-3 -17,-4 -17,-5 -15,-5 -15,-6 -15,-6 -14,-7 -14,-7 -14,-7 -14,-7 -14,-7 -13,-8 -12,-9 -11,-9 -12,-10 -12,-9 -13,-7 -15,-7 -17,-3 -18,-1 -18,2 -17,3 -17,5 -17,3 -19,3 -19,1 -21,0 -21,0 -20,0 -20,-1 -19,-3 -17,-3 -17,-4 -17,-5 -16,-5 -15,-5 -16,-5 -16,-5 -15,-6 -15,-6 -14,-7 -14,-7 -14,-7 -12,-9 -12,-8 -12,-10 -12,-9 -11,-10 -12,-9 -12,-9 -11,-9 -11,-11 -10,-11 -9,-11 -10,-11 -10,-12 -9,-11 -9,-13 -8,-12 -8,-14 -7,-13 -8,-13 -8,-14 -7,-14 -6,-14 -6,-15 -5,-16 -6,-15 -4,-17 -4,-16 -4,-18 -3,-18 -2,-19 -1,-19 -1,-21 0,-21 0,-21 1,-20 1,-20 2,-19 1,-18 0,-16 -3,-16 -7,-13 -8,-13 -8,-13 -9,-12 -10,-11 -9,-12 -9,-11 -9,-12 -10,-12 -8,-12 -8,-13 -7,-14 -7,-14 -7,-14 -7,-15 -6,-15 -5,-15 -5,-16 -5,-17 -4,-16 -4,-17 -3,-18 -3,-18 -2,-18 -2,-19 -1,-18 1,-18 3,-18 2,-19 2,-19 3,-18 4,-17 4,-17 5,-16 4,-17 5,-16 6,-15 6,-14 7,-14 7,-15 7,-14 7,-13 7,-14 8,-14 8,-13 8,-12 9,-12 10,-11 10,-11 10,-11 11,-10 11,-10 11,-10 12,-9 11,-10 11,-10 12,-9 12,-8 13,-8 14,-8 13,-7 14,-8 14,-7 14,-7 15,-6 14,-6 14,-7 12,-9 10,-11 7,-14 6,-15 6,-15 5,-16 6,-15 6,-15 6,-14 8,-14 7,-14 7,-14 8,-13 8,-13 9,-12 9,-11 10,-12 10,-11 9,-11 10,-11 10,-11 11,-11 11,-9 13,-8 12,-9 13,-8 12,-9 13,-8 12,-9 14,-7 14,-7 15,-6 15,-6 15,-6 14,-7 15,-6 15,-6 16,-5 16,-4',
  claude:
    '-688,-1314 47,-11 50,5 43,20 35,30 28,39 23,44 21,46 20,45 21,46 21,46 21,45 22,45 22,45 22,44 22,45 23,44 22,44 22,45 23,43 24,42 28,36 32,23 34,4 29,-20 20,-40 12,-53 8,-58 6,-60 6,-61 5,-62 5,-62 5,-61 8,-59 10,-56 14,-53 19,-47 27,-38 35,-25 40,-8 39,11 31,29 19,43 7,53 -1,57 -7,58 -9,57 -10,56 -11,56 -9,57 -9,57 -7,56 -1,53 10,43 24,25 34,2 35,-17 34,-30 30,-35 30,-37 30,-36 31,-36 31,-36 30,-36 31,-36 31,-35 31,-35 33,-34 35,-31 40,-25 44,-13 45,1 41,17 32,31 21,40 9,47 -3,50 -13,48 -21,44 -27,40 -28,37 -30,38 -29,37 -29,38 -28,38 -29,38 -28,38 -28,39 -28,39 -27,38 -24,40 -15,40 0,38 21,29 37,14 49,0 53,-7 54,-11 56,-10 57,-10 57,-9 56,-11 56,-10 58,-7 59,-1 55,7 43,19 25,32 3,38 -18,37 -34,28 -46,21 -51,16 -53,13 -53,13 -55,12 -56,11 -56,10 -52,14 -43,19 -23,27 2,30 29,24 47,15 58,9 61,5 62,5 60,6 57,10 51,15 45,22 38,27 28,33 14,38 -6,38 -25,32 -40,22 -50,13 -54,2 -56,-5 -55,-10 -54,-12 -54,-13 -54,-13 -53,-13 -54,-13 -54,-11 -52,-7 -47,1 -36,14 -16,27 5,33 22,34 30,34 34,32 34,32 35,32 35,32 35,32 34,31 35,32 35,32 34,32 33,33 30,35 22,37 7,35 -12,27 -29,12 -39,-6 -40,-19 -40,-25 -39,-28 -38,-27 -39,-27 -38,-21 -38,-9 -31,10 -18,27 0,38 14,42 21,42 24,42 21,44 12,47 -1,46 -19,38 -36,22 -44,3 -43,-14 -37,-28 -30,-35 -28,-40 -26,-40 -26,-40 -27,-40 -28,-39 -28,-39 -27,-39 -28,-39 -27,-39 -27,-39 -29,-34 -33,-20 -35,1 -28,25 -18,43 -10,56 -6,60 -6,61 -6,61 -6,60 -6,60 -6,61 -6,61 -9,58 -15,50 -26,39 -36,23 -41,6 -39,-13 -30,-30 -17,-44 -5,-52 5,-55 9,-56 10,-56 10,-56 10,-57 10,-57 12,-55 11,-54 10,-54 2,-52 -9,-44 -23,-26 -33,-4 -35,17 -33,30 -29,37 -29,38 -28,38 -28,39 -28,38 -28,39 -29,38 -29,37 -30,37 -32,35 -32,33 -34,33 -35,32 -37,26 -41,14 -40,-3 -28,-22 -9,-35 9,-41 21,-40 28,-38 29,-37 31,-36 30,-37 30,-37 29,-37 28,-38 29,-38 28,-38 26,-40 19,-40 6,-38 -12,-31 -28,-17 -40,1 -41,15 -41,24 -40,26 -39,28 -39,28 -39,27 -40,26 -42,25 -44,22 -47,19 -49,11 -50,-1 -42,-15 -26,-30 -6,-38 15,-38 28,-35 36,-30 39,-28 40,-26 41,-26 41,-25 42,-24 43,-24 44,-23 43,-23 43,-24 41,-25 42,-26 39,-26 36,-28 25,-32 7,-32 -17,-28 -39,-19 -55,-10 -62,-4 -64,-2 -64,-3 -63,-4 -64,-3 -64,-2 -64,-2 -63,-4 -63,-3 -62,-5 -58,-8 -51,-16 -38,-25 -20,-33 2,-35 25,-28 42,-16 53,-5 60,2 61,3 63,4 63,3 64,3 63,3 63,4 62,5 62,4 60,4 56,1 47,-7 32,-19 11,-29 -11,-34 -27,-32 -36,-29 -40,-27 -40,-26 -41,-26 -40,-26 -40,-27 -39,-27 -39,-28 -39,-28 -39,-28 -38,-27 -39,-28 -39,-28 -38,-29 -37,-29 -34,-33 -26,-38 -15,-46 1,-49 16,-43 32,-31 43,-15 47,2 46,14 42,23 39,27 39,28 38,29 38,28 38,30 37,29 37,29 37,30 38,27 39,22 39,10 34,-9 21,-27 4,-41 -11,-44 -19,-45 -24,-42 -24,-42 -26,-42 -25,-41 -25,-41 -25,-42 -24,-43 -24,-42 -23,-44 -20,-45 -16,-47 -5,-49 6,-47 19,-43 29,-35',
  gemini:
    '-31,-1321 20,-6 22,0 19,5 15,12 11,15 8,19 8,19 7,20 6,20 6,20 7,21 6,20 7,19 8,20 7,19 7,19 7,20 8,19 8,19 9,17 8,18 9,18 9,18 9,18 9,17 9,18 9,18 9,17 10,17 10,16 10,16 10,17 11,16 11,16 11,15 11,16 12,15 11,15 12,15 12,14 12,15 12,15 11,16 11,15 12,15 12,14 13,13 14,14 13,14 13,13 13,13 14,13 13,13 14,13 13,13 14,13 14,14 13,13 14,12 14,13 15,11 16,12 15,11 15,12 15,11 16,11 15,11 16,12 15,11 15,11 16,11 17,10 16,10 17,10 16,10 18,9 17,9 18,9 18,9 18,9 17,9 18,9 18,8 19,9 19,7 19,8 19,7 19,8 19,7 20,7 20,7 20,7 19,6 20,7 20,7 20,7 19,7 19,8 16,10 12,15 6,20 0,21 -6,20 -11,15 -16,11 -18,8 -20,7 -19,7 -20,7 -21,6 -20,6 -21,6 -20,6 -20,7 -19,8 -19,8 -19,7 -18,8 -19,8 -18,9 -18,9 -18,9 -17,9 -18,8 -18,9 -18,9 -17,9 -17,10 -17,10 -16,10 -17,10 -17,10 -16,10 -16,11 -15,12 -15,11 -16,11 -15,11 -15,12 -15,12 -15,11 -16,11 -15,11 -15,12 -14,13 -13,13 -14,13 -13,13 -14,13 -13,13 -14,14 -13,13 -13,14 -13,13 -13,14 -13,14 -13,13 -13,14 -13,14 -12,14 -12,15 -11,15 -12,15 -11,15 -12,16 -10,15 -11,16 -12,15 -10,16 -10,17 -10,17 -11,16 -11,15 -11,16 -10,16 -10,17 -9,18 -9,18 -9,17 -8,18 -9,18 -9,18 -9,18 -8,18 -8,19 -7,19 -8,19 -7,19 -8,19 -7,19 -8,20 -6,20 -6,20 -7,21 -6,20 -7,19 -7,20 -8,19 -11,16 -14,11 -20,6 -22,0 -19,-5 -15,-12 -11,-15 -8,-19 -8,-19 -7,-20 -6,-20 -6,-20 -6,-21 -6,-21 -7,-20 -7,-19 -7,-19 -8,-19 -8,-19 -8,-19 -8,-18 -8,-18 -9,-18 -9,-18 -9,-18 -9,-17 -9,-18 -9,-18 -9,-18 -9,-17 -10,-16 -10,-17 -10,-16 -10,-17 -11,-16 -10,-16 -11,-16 -11,-16 -11,-16 -11,-15 -13,-14 -12,-14 -11,-16 -11,-15 -12,-16 -12,-14 -12,-14 -13,-14 -13,-13 -14,-14 -13,-13 -13,-14 -13,-13 -14,-13 -13,-13 -14,-13 -13,-13 -14,-13 -14,-13 -14,-13 -14,-12 -15,-12 -16,-11 -15,-11 -15,-12 -15,-12 -15,-11 -16,-11 -15,-11 -15,-12 -16,-11 -16,-10 -16,-10 -17,-11 -16,-10 -17,-10 -17,-9 -17,-10 -16,-11 -17,-10 -17,-9 -18,-9 -18,-8 -18,-9 -19,-7 -19,-8 -18,-8 -19,-9 -18,-8 -19,-8 -19,-7 -19,-8 -19,-7 -20,-7 -20,-7 -20,-6 -21,-6 -20,-7 -19,-7 -19,-8 -16,-10 -12,-15 -6,-19 0,-22 6,-20 11,-15 16,-11 18,-8 20,-7 19,-7 20,-7 20,-7 20,-6 20,-7 19,-7 20,-7 20,-7 19,-7 19,-8 19,-7 19,-8 19,-8 18,-9 18,-9 17,-8 18,-9 18,-9 18,-9 17,-9 17,-10 17,-9 16,-11 17,-10 17,-10 16,-10 16,-11 15,-11 15,-12 16,-11 15,-11 15,-12 15,-12 15,-11 16,-11 15,-11 15,-12 14,-13 13,-13 14,-13 13,-13 14,-13 13,-13 14,-14 13,-13 13,-14 13,-13 13,-14 13,-14 13,-13 13,-14 12,-14 11,-16 12,-15 11,-15 13,-14 12,-15 11,-15 11,-16 11,-16 11,-15 12,-15 12,-15 10,-16 10,-16 10,-17 11,-16 10,-17 9,-17 9,-18 9,-18 9,-17 8,-18 9,-18 9,-18 9,-18 8,-18 8,-19 7,-19 8,-19 7,-19 8,-19 7,-19 8,-20 6,-20 6,-20 7,-21 6,-19 7,-20 7,-20 8,-19 11,-16',
  opencode:
    '-775,-984 13,-5 16,-2 18,0 17,0 18,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 18,0 18,0 17,0 18,0 18,0 18,0 18,0 17,0 17,1 15,3 12,6 8,10 5,13 1,16 1,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 0,18 0,17 0,18 0,18 0,18 0,18 -1,17 -3,15 -5,12 -9,9 -13,5 -16,2 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -18,0 -18,0 -17,0 -18,0 -18,0 -18,0 -18,0 -17,0 -17,-1 -15,-3 -12,-6 -8,-10 -5,-13 -1,-16 -1,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 0,-18 0,-17 0,-18 0,-18 0,-18 0,-18 1,-17 3,-15 5,-12',
  grok: '-80,-972 19,-3 19,-1 21,0 21,0 20,0 20,1 19,2 18,3 18,3 19,2 19,2 18,3 17,4 17,4 17,4 17,4 17,4 16,5 16,5 16,5 15,6 16,5 15,6 15,6 15,6 15,6 15,6 15,6 14,7 14,7 14,7 14,7 13,8 12,8 13,9 13,8 13,8 13,8 13,7 14,8 14,6 16,6 17,3 20,2 20,1 21,0 21,-1 20,-1 18,-3 16,-4 15,-6 15,-7 14,-6 14,-7 13,-8 12,-9 11,-11 10,-11 10,-11 10,-11 11,-9 12,-9 13,-8 14,-6 15,-2 15,2 13,8 8,12 4,16 1,17 -3,18 -5,16 -5,15 -6,15 -6,15 -5,16 -4,17 -4,17 -4,17 -4,17 -4,17 -4,17 -3,18 -1,20 0,21 -1,21 0,20 0,21 0,21 0,21 0,21 0,21 0,21 0,21 1,21 0,21 1,19 3,19 4,17 4,17 3,17 4,18 3,18 3,18 3,18 3,18 3,18 3,18 3,18 3,18 3,18 1,19 1,21 0,20 0,21 0,21 0,21 0,21 0,21 -2,19 -2,19 -4,17 -3,18 -3,18 -4,17 -3,18 -4,17 -3,18 -4,17 -4,16 -5,17 -5,16 -5,16 -5,16 -5,16 -5,16 -5,16 -6,15 -6,15 -7,14 -7,14 -7,14 -8,13 -8,12 -9,13 -8,13 -9,12 -8,13 -8,12 -9,13 -8,13 -9,12 -9,12 -10,11 -9,11 -10,12 -8,12 -9,12 -10,12 -9,12 -10,11 -10,10 -12,10 -11,10 -11,10 -10,10 -11,11 -11,9 -12,9 -12,9 -12,10 -12,9 -12,8 -13,9 -13,8 -13,8 -12,8 -13,8 -13,9 -13,8 -12,8 -14,8 -13,7 -14,8 -14,7 -14,7 -14,6 -15,7 -15,5 -16,6 -16,4 -16,5 -16,5 -16,6 -15,5 -16,6 -16,4 -17,4 -18,3 -18,3 -18,4 -18,3 -18,2 -18,3 -18,4 -18,2 -20,2 -20,0 -21,0 -21,0 -21,0 -20,0 -20,-2 -18,-2 -18,-4 -18,-3 -18,-2 -18,-3 -17,-4 -17,-4 -17,-4 -17,-5 -17,-4 -16,-4 -16,-5 -16,-6 -15,-6 -15,-6 -14,-6 -15,-6 -15,-6 -15,-7 -14,-7 -14,-7 -14,-7 -13,-7 -14,-7 -14,-7 -15,-7 -14,-7 -13,-7 -13,-9 -12,-8 -13,-9 -12,-8 -13,-9 -13,-8 -13,-7 -14,-7 -16,-6 -16,-4 -18,-3 -20,-2 -20,0 -21,0 -20,1 -19,2 -17,3 -17,5 -16,5 -15,6 -15,6 -16,4 -16,0 -15,-3 -12,-9 -8,-13 -3,-16 0,-18 2,-18 5,-16 5,-16 6,-15 5,-16 4,-16 4,-18 2,-19 0,-20 1,-21 0,-21 0,-21 -1,-20 -1,-20 -3,-18 -4,-17 -4,-17 -5,-17 -5,-16 -5,-15 -6,-15 -6,-15 -6,-15 -6,-15 -6,-15 -5,-16 -5,-17 -3,-17 -4,-18 -3,-17 -4,-17 -3,-18 -4,-17 -3,-18 -3,-18 -2,-19 -1,-20 0,-21 0,-21 0,-21 0,-21 0,-21 0,-21 0,-20 2,-20 2,-19 3,-17 3,-18 3,-19 3,-18 3,-17 3,-18 3,-18 4,-17 5,-17 5,-15 6,-16 5,-15 5,-17 5,-16 5,-16 5,-15 6,-15 7,-15 6,-15 7,-14 7,-14 7,-13 8,-13 9,-13 8,-13 7,-13 8,-13 9,-13 8,-12 9,-13 9,-12 10,-11 9,-11 9,-12 9,-12 9,-12 10,-12 9,-12 10,-11 10,-10 12,-10 11,-10 11,-10 10,-11 10,-11 10,-10 12,-10 12,-9 12,-9 11,-9 12,-9 13,-9 12,-9 11,-9 13,-9 12,-8 12,-9 13,-8 14,-8 14,-7 14,-6 14,-7 14,-7 14,-7 14,-8 14,-6 14,-7 16,-5 16,-5 16,-5 16,-5 17,-4 16,-5 17,-4 17,-4 16,-5 17,-4 17,-4 17,-4 17,-4 17,-4 19,-2 18,-3 18,-3',
}
let landingFaces = null
/* The Saturn ring's paint turns only while its band shows (the CSS keys
   it to the talk and the stages); a reveal whose wipe angles are still in
   transition is marked too, so the band keeps turning while it is wiped
   away. One listener for every ring on the page */
const landingWipes = new WeakMap()
const trackLandingWipe = (event) => {
  const reveal = event.target
  if (!(reveal instanceof Element) || !reveal.classList.contains('lp-sun-halo-reveal')) {
    return
  }
  const running = landingWipes.get(reveal) ?? new Set()
  landingWipes.set(reveal, running)
  if (event.type === 'transitionrun') {
    running.add(event.propertyName)
  } else {
    running.delete(event.propertyName)
  }
  reveal.classList.toggle('is-wiping', running.size > 0)
}
for (const type of ['transitionrun', 'transitionend', 'transitioncancel']) {
  document.addEventListener(type, trackLandingWipe)
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

const initLandingOrbs = debounce(() => {
  const fields = [...document.querySelectorAll('.lp-orbs')].filter((field) => field.dataset.lpOrbsBound !== 'true')
  if (!fields.length) {
    return
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  fields.forEach((field) => {
    field.dataset.lpOrbsBound = 'true'
    /* Everything this page's orbs bind beyond their own markup, kept so
       that the page taking them away can take these with it. The cards
       further down bind against elements of their own, and hand their
       undo in here rather than keeping one each, because the app swaps
       a whole page at once: a field that has gone means the Docs, SDK
       and MCP cards have gone with it. They are let go together on that
       reading, and each card's own guard then binds the page that
       replaced them. */
    const undo = []
    holdLanding(field, () => undo.forEach((release) => release()))
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
          face: null,
        }
      })
      .filter(Boolean)
    if (!orbs.length) {
      return
    }
    // the faces: while a planet talks its name bends into a mouth, two
    // eyes open and the head turns to the pointer (createPlanetFaces)
    // and the ball takes the shape of its mark (an experiment: the mark
    // leaves the ring and the face stands on the shape instead)
    landingFaces ??= createPlanetFaces({
      settings: { reduceMotion, body: 'shape', mark: 'hide', shapes: LANDING_SHAPES },
    })
    orbs.forEach((o) => {
      o.face = landingFaces.attach(o.orb, o.ring)
    })
    /* The faces live in a controller that is made once and kept for the
       life of the page, so a planet leaving the page has to hand its own
       back: otherwise the controller goes on watching an orb that is no
       longer in the document, one more of them per page view. */
    undo.push(() => orbs.forEach((o) => o.face?.detach()))
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
        // a planet that has taken a new size turns its grain at a new
        // pace: the surface still covers its circumference in one turn
        landingGrainTurn(o.orb, o.size)
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
    const owners = new Map(orbs.map((o) => [o.bubble, o]))
    // a bubble shows the dots, or one of its lines; a planet's face
    // follows its turn: thinking over the dots, happy as it speaks
    const say = (bubble, lines, what) => {
      bubble.classList.toggle('is-typing', what === 'typing')
      if (what !== 'typing') {
        lines.forEach((line, i) => line.classList.toggle('is-on', i === what))
      }
      owners.get(bubble)?.face?.express(what === 'typing' ? 'thinking' : 'happy')
    }
    /* a planet talks: its bubble shows and its face forms; the stages
       and the SDK card go through this too, so a face follows every
       talk */
    const setTalking = (o, on) => {
      o.orb.classList.toggle('is-talking', on)
      o.face?.set(on)
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
      setTalking(o, false)
      o.bubble?.classList.remove('is-typing')
      sunBubble.classList.remove('is-on')
      sunBubble.classList.remove('is-typing')
      // the planet moves on first: nothing below may keep it held
      o.hover = false
      o.angle = ((o.angle % 360) + 360) % 360
      // the ring holds where it stands until the face has unwound (the
      // loop lets it go), so the face does not slide off round the rim
      if (o.target !== null) {
        o.target = o.angle
      }
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
      setTalking(o, true)
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
            // the planet listens
            o.face?.express('straight')
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
    const onEscape = (event) => {
      if (event.key === 'Escape' && talk) {
        stopTalk()
      }
    }
    const onTapAway = (event) => {
      if (
        talk &&
        event.pointerType === 'touch' &&
        !talk.o.orb.contains(event.target) &&
        !button?.contains(event.target)
      ) {
        stopTalk()
      }
    }
    document.addEventListener('keydown', onEscape)
    document.addEventListener('pointerdown', onTapAway)
    undo.push(() => {
      document.removeEventListener('keydown', onEscape)
      document.removeEventListener('pointerdown', onTapAway)
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
    const sizes = new ResizeObserver(apply)
    sizes.observe(field)
    undo.push(() => sizes.disconnect())
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
         and its answers come up round it, the last three to stay */
      const stageSun = stage.querySelector('.lp-stage-sun .lp-sun')
      const stageRing = stageSun?.querySelector('.lp-orb-ring')
      const stageSunSize = stageSun ? Number.parseFloat(getComputedStyle(stageSun).getPropertyValue('--s')) : 0
      const hasStageSun = Boolean(stageRing && stageSunSize && dressLandingGlobe(stageSun, stageRing, stageSunSize))
      const stageHalos = [...stage.querySelectorAll('.lp-stage-halo .lp-sun-halo-reveal')]
      const says = [...stage.querySelectorAll('.lp-stage-say')]
      let orbitFrame = 0
      let orbitLast = null
      let stageSeen = true
      let saying = 0
      let sayGen = 0
      // the SDK card below borrows the globe and a planet: whether it has
      // them, and how to take them back at once (bound further down)
      const lent = { on: false, reset: () => () => {}, check: () => {} }
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
        // the orbit's left/top stay until the planet has been measured
        // for whatever flight comes next (its settle drops them):
        // dropped here, a planet was measured where it was not drawn and
        // jumped before it flew
        extras.forEach((o) => {
          o.orbit = null
        })
      }
      const orbitTick = (now) => {
        orbitFrame = 0
        if (!onStage) {
          return
        }
        // asleep while the card is off screen or the page hidden; the
        // observer below wakes it where it left off
        if (!stageSeen || document.hidden) {
          orbitLast = null
          return
        }
        const dt = orbitLast === null ? 0 : Math.min(now - orbitLast, 100)
        orbitLast = now
        const w = stage.clientWidth
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
          setTalking(o, false)
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
      // a chain of answers: one short round, and the last three (one for
      // each planet's action) stay on, so the talk settles rather than
      // going on for ever. A newer chain (the globe back from the SDK
      // card) retires the old one by its number and carries on from where
      // the round had got to, or puts the settled three back up
      const SAY_KEEP = 3
      const nextSay = (gen) => {
        if (!onStage || !says.length || gen !== sayGen) {
          return
        }
        if (saying >= says.length) {
          says.slice(-SAY_KEEP).forEach((say) => say.classList.add('is-on'))
          return
        }
        const say = says[saying]
        saying++
        say.classList.add('is-on')
        if (saying <= says.length - SAY_KEEP) {
          timers.push(window.setTimeout(() => say.classList.remove('is-on'), SAY_FOR))
        }
        if (saying < says.length) {
          timers.push(window.setTimeout(() => nextSay(gen), SAY_EVERY))
        }
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
        // the round from its start: the planets have just arrived again
        saying = 0
        const gen = ++sayGen
        timers.push(window.setTimeout(() => nextSay(gen), 1400))
      }
      // settle() puts the planet in its new place; then() runs once that
      // has taken (a layout is forced), the only time a transition on
      // the moved planet or its ring has a value to start from
      // Several planets move as one batch, every read before the writes
      // that follow it, so the batch lays out three times rather than
      // three times a planet (the planets stand absolutely, so moving one
      // never shifts another and the numbers are the same)
      const moveAll = (list) => {
        list.forEach((m) => {
          m.first = m.o.orb.getBoundingClientRect()
        })
        list.forEach(({ o, to, settle }) => {
          window.clearTimeout(o.moving)
          o.orb.classList.remove('is-moving')
          o.orb.style.transform = ''
          o.orb.style.transitionDelay = ''
          to.appendChild(o.orb)
          settle()
        })
        list.forEach((m) => {
          m.last = m.o.orb.getBoundingClientRect()
        })
        if (reduceMotion) {
          list.forEach((m) => m.then())
          return
        }
        list.forEach(({ o, first, last }) => {
          const dx = first.left + first.width / 2 - (last.left + last.width / 2)
          const dy = first.top + first.height / 2 - (last.top + last.height / 2)
          const k = last.width ? first.width / last.width : 1
          o.orb.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${k.toFixed(4)})`
        })
        // the starts take before the transitions are switched on
        list[0].o.box = list[0].o.orb.getBoundingClientRect()
        list.forEach(({ o, index, then }) => {
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
        })
      }
      const move = (o, to, index, settle, then) => moveAll([{ o, to, index, settle, then }])
      // a planet's ring finishes its turn to the front, on at the pace
      // it had, from wherever it is as rendered (a turn still settling
      // back from the last visit just carries on from where it got to):
      // pinned now, turned by the function returned once the planet is
      // in its new place
      const faceFront = (o, turned = ringAngle(o.ring)) => {
        window.clearTimeout(o.settle)
        o.settling = false
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
        setTalking(o, false)
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
            setTalking(o, true)
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
        extras.forEach((o) => {
          o.away = true
        })
        // every ring's angle before any ring is pinned, then the three
        // flights as one batch
        const turned = extras.map((o) => ringAngle(o.ring))
        const fronts = extras.map((o, index) => faceFront(o, turned[index]))
        moveAll(extras.map((o, index) => ({ o, to: stage, index, settle: () => standOnStage(o), then: fronts[index] })))
        extras.forEach((o, index) => {
          askOnStage(o, (reduceMotion ? 200 : 1150) + index * 120)
        })
      }
      const toOrbit = () => {
        if (!onStage) {
          return
        }
        onStage = false
        // whatever the SDK and MCP cards have comes along from where it
        // is; the MCP thread is put away once the planets have been
        // measured for the flight (a hidden row has no box to fly from)
        const putAway = lent.reset()
        timers.forEach((t) => window.clearTimeout(t))
        timers = []
        stopOrbit()
        extras.forEach((o) => {
          setTalking(o, false)
          o.bubble?.classList.remove('is-typing')
        })
        // the rings turn on from where they are (the card's orbit left
        // them anywhere) by an amount of their own, all three over the
        // same time, and the loop carries them on from there, a quarter
        // turn apart; at most two thirds of a turn, so no ring spins up.
        // Every angle is read and pinned before the planets move (moving
        // a planet cancels a turn in progress, which would snap its ring
        // to the turn's end), and the turns start once they have landed
        const ms = reduceMotion ? 0 : 1800
        const from = extras.map((o) => ringAngle(o.ring))
        extras.forEach((o, index) => {
          o.phase = (from[index] + 60 + index * 90) % 360
          window.clearTimeout(o.settle)
          o.ring.style.transition = ''
          o.ring.style.transform = `rotateY(${from[index].toFixed(1)}deg)`
        })
        moveAll(
          extras.map((o, index) => ({
            o,
            to: field,
            index,
            settle: () => {
              o.away = false
              o.orb.style.removeProperty('left')
              o.orb.style.removeProperty('top')
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
            then: () => {},
          })),
        )
        putAway()
        // (the flights' last read has already taken the pins)
        extras.forEach((o, index) => {
          if (ms) {
            o.settling = true
            o.ring.style.transition = `transform ${ms}ms linear`
            o.ring.style.transform = `rotateY(${from[index] + 60 + index * 90}deg)`
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
        })
      }
      // the planets come once the card has risen into the top part of
      // the viewport (its top above the 45% line), and go back once it
      // has dropped below that line; past the top they stay
      const stageWatch = new IntersectionObserver(
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
      )
      stageWatch.observe(stage)
      undo.push(() => stageWatch.disconnect())
      const wakeOrbit = () => {
        if (stageSeen && !document.hidden && onStage && stage.classList.contains('is-orbit') && !orbitFrame) {
          orbitLast = null
          orbitTick(performance.now())
        }
      }
      const seenWatch = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            stageSeen = entry.isIntersecting
          })
          wakeOrbit()
        },
        { threshold: 0 },
      )
      seenWatch.observe(stage)
      document.addEventListener('visibilitychange', wakeOrbit)
      /* A page swapped out while the tab is hidden leaves this one worse
         than merely leaking: nothing paints, so the watcher above never
         reports the stage gone, and on the way back a listener still on
         the document would start a loop writing styles into a stage that
         is no longer on the page. */
      undo.push(() => {
        seenWatch.disconnect()
        document.removeEventListener('visibilitychange', wakeOrbit)
        if (orbitFrame) {
          cancelAnimationFrame(orbitFrame)
          orbitFrame = 0
        }
      })

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
        // Moving the group cancels every transition and animation in it,
        // so what is in flight is carried across: its size, the rise or a
        // wipe part way (the face's fade and scale, the ring's wipe angles)
        // and the ring paint's turn. The values as they stand are set
        // inline for the landing and let go once it has taken, to carry on
        // from there to the new stage's values (with no delay, as they are
        // under way already)
        const globeSun = globe.querySelector('.lp-stage-sun')
        const globeFace = globeSun?.querySelector('.lp-sun')
        const globePaints = [...globe.querySelectorAll('.lp-sun-halo-paint')]
        const inFlight = [
          [globeSun, ['opacity', 'scale']],
          [globeFace, ['opacity']],
          ...stageHalos.map((reveal) => [reveal, ['--lp-head', '--lp-tail']]),
        ].filter(([el]) => el)
        const paintTurn = (paint) => paint.getAnimations().find((a) => a.animationName === 'lp-halo-turn')
        const moveGlobe = (to, settle) => {
          const from = getComputedStyle(globe).getPropertyValue('--s')
          const carried = inFlight.map(([el, props]) => {
            const cs = getComputedStyle(el)
            return { el, values: props.map((prop) => [prop, cs.getPropertyValue(prop)]) }
          })
          const turns = globePaints.map((paint) => paintTurn(paint)?.currentTime ?? null)
          move(
            globeO,
            to,
            0,
            () => {
              globe.style.setProperty('--s', from)
              carried.forEach(({ el, values }) => {
                el.style.transition = 'none'
                values.forEach(([prop, value]) => el.style.setProperty(prop, value))
              })
              settle()
            },
            () => {
              globe.style.removeProperty('--s')
              carried.forEach(({ el, values }) => {
                el.style.transition = ''
                el.style.transitionDelay = '0s'
                values.forEach(([prop]) => el.style.removeProperty(prop))
              })
              // the carried values start their transitions with no delay;
              // the delay is the stylesheet's again for the next change
              globeO.box = globe.getBoundingClientRect()
              carried.forEach(({ el }) => el.style.removeProperty('transition-delay'))
              globePaints.forEach((paint, i) => {
                const turn = paintTurn(paint)
                if (turn && turns[i] !== null) {
                  turn.currentTime = turns[i]
                }
              })
            },
          )
        }
        // whether the stage the globe stands on shows it, ring out
        const globeShown = () => Boolean(globe.closest('.lp-stage')?.classList.contains('is-sun'))
        let guest = null
        let lastGuest = null
        let sdkTimers = []
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
          setTalking(o, false)
          o.orb.classList.remove('lp-orb--left')
          o.bubble?.classList.remove('is-typing')
          o.bubble?.style.removeProperty('--bubble-shift')
          o.shift = undefined
          o.z = null
        }
        // the globe and the planet to this card's rows, from wherever they
        // are, and the talk once the planet has landed
        const takeToSdk = (o) => {
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
                // the planet listens
                o.face?.express('straight')
              } else if (o.bubble && (what === 'typing' || o.lines[what])) {
                say(o.bubble, o.lines, what)
                setTalking(o, true)
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
          talkOff()
          const o = guest
          guest = null
          setTalking(o, false)
          o.bubble?.classList.remove('is-typing')
          if (stage.classList.contains('is-orbit')) {
            // the globe flies back to the centre, and the answers go on
            moveGlobe(stage, () => {
              sdk.classList.remove('is-sun')
              next.left()
            })
          } else {
            // the Docs card's second act had not reached its orbit when the
            // globe came down (not begun, or risen but not yet going
            // round): on the way back up the card goes straight to how
            // that act ends, the globe flying home with its ring out and
            // the planets standing there easing onto the orbit round it
            // (the guest is still marked lent, so the orbit leaves it to
            // the flight below, which takes it onto the ring). Any
            // question, rise or orbit still pending there is dropped
            timers.forEach((t) => window.clearTimeout(t))
            timers = []
            moveGlobe(stage, () => {
              sdk.classList.remove('is-sun')
              next.left()
              stage.classList.add('is-sun')
            })
            startOrbit()
          }
          o.sdk = false
          const gen = ++sayGen
          timers.push(window.setTimeout(() => nextSay(gen), 1200))
          if (stage.classList.contains('is-orbit')) {
            // onto the ring, where its lap has got to, its ring spinning on
            // from where it is: read and pinned before the move, which
            // would cancel a turn still in progress
            const spin = ringAngle(o.ring)
            window.clearTimeout(o.settle)
            o.settling = false
            o.ring.style.transition = ''
            o.ring.style.transform = `rotateY(${spin.toFixed(1)}deg)`
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
                // where the loop would have it: on the ring, or, with
                // reduced motion (the loop never moves), where it stands,
                // like the other two
                k.t = reduceMotion ? 0 : 1
                k.spin = spin
                o.orbit = k
                o.orb.style.left = '50%'
                o.orb.style.top = '50%'
                const tx = reduceMotion ? k.x0 : rx * Math.cos(k.angle)
                const ty = reduceMotion ? k.y0 : ry * Math.sin(k.angle)
                o.orb.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`
                o.orb.style.zIndex = Math.sin(k.angle) >= 0 ? '5' : '1'
                o.orb.classList.remove('lp-orb--left')
              },
              () => {},
            )
          } else {
            move(o, stage, 1, () => standOnStage(o), faceFront(o))
            askOnStage(o, (reduceMotion ? 200 : 1150) + 120)
          }
          // the thread goes last: until the flights have measured them,
          // the globe and the planet may still sit in its rows
          next.off()
        }
        // the Docs card taking its planets home takes these too, as they
        // are: no flight back to it first
        lent.reset = () => {
          if (!lent.on) {
            return () => {}
          }
          lent.on = false
          talkOff()
          sdk.classList.remove('is-sun')
          next.left()
          stage.appendChild(globe)
          if (guest) {
            guest.sdk = false
            setTalking(guest, false)
            guest.bubble?.classList.remove('is-typing')
            guest = null
          }
          // the thread goes once the caller has measured the planets
          return () => next.off()
        }
        const sdkWatch = new IntersectionObserver(
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
        )
        sdkWatch.observe(sdk)
        undo.push(() => sdkWatch.disconnect())
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

        /* The MCP card, below again: a chat transcript, after Claude's.
           The rows come on one by one, each up from below while the
           earlier ones glide up (a FLIP on their transforms), the agent's
           lines streaming in by the word: the user's bubble, the agent's
           opening line as plain text, then a thinking block: a head
           line and a bordered box where the SDK card's guest (it comes on
           from there, or straight from the Docs card on a jump) and the
           globe sit at either side and trade a few bubbles of calls and
           results; the box then folds away under the head, the globe
           with it, as the planet moves down to the answer, plain text
           again. When the card drops below the viewport's middle both go
           back to the SDK card and its talk plays again. */
        const mcp = document.querySelector('[data-lp-stage-mcp]')
        const slot = (name) => mcp?.querySelector(`[data-lp-thread-slot="${name}"]`)
        const row = (name) => mcp?.querySelector(`[data-lp-thread="${name}"]`)
        const seats = { a: slot('a'), b: slot('b'), c: slot('c') }
        const rows = { user: row('user'), agent1: row('agent1'), think: row('think'), agent2: row('agent2') }
        const lines = [1, 2, 3, 4].map((n) => mcp?.querySelector(`[data-lp-think="${n}"]`))
        // the composer's model label, per guest: the model, then the mode
        const MODELS = {
          claude: ['Fable 5.1', 'Ultracode'],
          chatgpt: ['GPT-6', 'Sol'],
          grok: ['Grok 4.7', 'Heavy'],
        }
        const modelName = mcp?.querySelector('.lp-chat-model-name')
        const modelMode = mcp?.querySelector('.lp-chat-model-mode')
        if (
          mcp &&
          Object.values(seats).every(Boolean) &&
          Object.values(rows).every(Boolean) &&
          lines.every(Boolean) &&
          mcp.dataset.lpStageBound !== 'true'
        ) {
          mcp.dataset.lpStageBound = 'true'
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
          const order = [rows.user, rows.agent1, rows.think, rows.agent2]
          const head = rows.think.querySelector('.lp-think-head')
          let mcpTimers = []
          const quiet = () => {
            mcpTimers.forEach((t) => window.clearTimeout(t))
            mcpTimers = []
            order.forEach((r) => {
              r.classList.remove('is-shown', 'is-done', 'is-open')
              r.style.transition = ''
              r.style.transform = ''
              r.style.opacity = ''
            })
            lines.forEach((line) => line.classList.remove('is-shown'))
            head?.setAttribute('aria-expanded', 'false')
          }
          // once the exchange is done its head opens and closes the box
          head?.addEventListener('click', () => {
            if (!rows.think.classList.contains('is-done')) {
              return
            }
            const open = rows.think.classList.toggle('is-open')
            head.setAttribute('aria-expanded', String(open))
          })
          // a row comes on: up from below, the others to their new places
          // from their old ones. A row a planet is flying into comes on in
          // place (rise false): faded, it would fade the planet with it,
          // and its words stream in anyway
          const reveal = (r, rise = true) => {
            const shown = order.filter((other) => other.classList.contains('is-shown'))
            const before = new Map(shown.map((other) => [other, other.getBoundingClientRect().top]))
            r.classList.add('is-shown')
            if (!reduceMotion) {
              r.style.transition = 'none'
              if (rise) {
                r.style.opacity = '0'
                r.style.transform = 'translateY(14px)'
              }
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
          }
          next.off = () => {
            next.on = false
            quiet()
          }
          next.left = () => mcp.classList.remove('is-sun')
          // a planet into a seat of the transcript, centred, ring to the front
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
            const [name, mode] = MODELS[o.orb.dataset.icon] ?? []
            if (modelName && modelMode && name) {
              modelName.textContent = name
              modelMode.textContent = mode
            }
            const at = (ms, fn) => mcpTimers.push(window.setTimeout(fn, ms))
            at(300, () => reveal(rows.user))
            at(1500, () => reveal(rows.agent1))
            // the block opens and both come to their seats in it
            at(2600, () => {
              reveal(rows.think)
              seat(o, seats.a)
              moveGlobe(seats.b, () => {
                sdk.classList.remove('is-sun')
                mcp.classList.add('is-sun')
              })
            })
            // the exchange, once both have landed: the planet's face forms
            // for it (its own bubble stays shut: the bubbles are the box's)
            at(3900, () => {
              lines[0].classList.add('is-shown')
              o.face?.set(true)
            })
            at(4900, () => lines[1].classList.add('is-shown'))
            at(5900, () => lines[2].classList.add('is-shown'))
            at(6900, () => lines[3].classList.add('is-shown'))
            // done: the box folds away (the globe stays in it, clipped)
            // and the answer comes up with the planet under it. The
            // planet's flight is measured before the fold has moved
            // anything and takes the fold's own time and curve (the
            // stylesheet), so as the seat rises with the fold the flight's
            // offset shrinks with it and the planet goes straight there
            at(8300, () => {
              rows.think.classList.add('is-done')
              reveal(rows.agent2, false)
              seat(o, seats.c)
            })
          }
          const fromMcp = () => {
            if (!next.on) {
              return
            }
            // the flights measure the globe and the planet in their seats
            // first; the transcript is put away after
            if (lent.on && guest) {
              takeToSdk(guest)
            }
            next.off()
          }
          const mcpWatch = new IntersectionObserver(
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
          )
          mcpWatch.observe(mcp)
          undo.push(() => mcpWatch.disconnect())
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
          mcp.lpMcp = () => ({
            on: next.on,
            shown: order.filter((r) => r.classList.contains('is-shown')).length,
            done: rows.think.classList.contains('is-done'),
            lines: lines.filter((line) => line.classList.contains('is-shown')).length,
          })
        }
      }
      // a jump of the page (an anchor, a scroll to the top) can take a
      // card from one side of the viewport to the other with no moment
      // in between for its observer to see: after a scroll, a card
      // below the middle of the viewport gives up what it holds, and one
      // above it takes what it is owed. The page can also be scrolled
      // before any of this is bound (a link to a card, a reload, the way
      // back) with no scroll after it, so the same check runs once now
      let scrolled = 0
      const onJump = () => {
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
      }
      window.addEventListener('scroll', onJump, { passive: true })
      undo.push(() => {
        window.removeEventListener('scroll', onJump)
        if (scrolled) {
          cancelAnimationFrame(scrolled)
          scrolled = 0
        }
      })
      onJump()
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
        // the ring holds the front until the face has unwound, then
        // turns on (a planet taken away lets go at once)
        if (o.target !== null && !o.hover && (o.away || (o.face?.rest ?? true))) {
          o.target = null
        }
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
      } else {
        if (frame) {
          cancelAnimationFrame(frame)
          frame = 0
        }
        // a talk does not go on unseen: its face would keep a frame running
        if (!inView && talk) {
          stopTalk()
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
      { threshold: 0.1 },
    )
    observer.observe(field)
    document.addEventListener('visibilitychange', sync)
    undo.push(() => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    })
  })
})

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

/* The hosting scene: a globe at the centre of the orbit box, there
   from the start, and three products — planets of their own — rising
   and going round it with their rings turning while the scene is on
   screen. It used to live inside the home page's hero setup, which
   meant it only ran on a page that had that hero; it looks the scene
   up by itself, so it is an init of its own and any page that has the
   markup gets it. */
const initLandingHostStage = debounce(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  /* The hosting band's scene: a globe of its own at the centre of the
       orbit box, there from the start, and the three products, planets
       of their own, rising and going round it with their rings turning
       while the scene is on screen (the loop sleeps off screen and
       wakes where it left off); the flow's lines run from Your API into
       the box and out to the agents. */
  const host = document.querySelector('[data-lp-stage-host]')
  /* Dressing a globe adds a few thousand elements, and adding them
       is itself a mutation, which brings this init straight back round
       — so the guard has to be here, before any dressing, and not
       beside the work it protects. Without it the scene dresses itself
       again on every pass and the page ends up with several times the
       elements it needs. */
  if (!host || host.dataset.lpStageBound === 'true') {
    return
  }
  const hostSun = host?.querySelector('.lp-stage-sun .lp-sun')
  const hostRing = hostSun?.querySelector('.lp-orb-ring')
  const hostSunSize = hostSun ? Number.parseFloat(getComputedStyle(hostSun).getPropertyValue('--s')) : 0
  const hasHostSun = Boolean(hostRing && hostSunSize && dressLandingGlobe(hostSun, hostRing, hostSunSize))
  /* the rings here turn at half the hero's pace, a calmer scene; the
     grain is painted at that pace too, so a planet's surface travels
     with its name rather than twice round it */
  const HOST_ORB_TURN = LANDING_ORB_TURN * 2
  const wares = host
    ? [...host.querySelectorAll('.lp-orb--product')]
        .map((orb) => {
          const ring = orb.querySelector('.lp-orb-ring')
          const size = Number.parseFloat(getComputedStyle(orb).getPropertyValue('--s'))
          if (!ring || !size || !dressLandingGlobe(orb, ring, size, HOST_ORB_TURN)) {
            return null
          }
          // the name a second time on the far side, so it reads
          // whichever way the ring is turned
          ;[...ring.querySelectorAll('.lp-orb-item')].forEach((item) => {
            const twin = item.cloneNode(true)
            twin.style.setProperty('--a', `${Number.parseFloat(item.style.getPropertyValue('--a')) + 180}deg`)
            ring.appendChild(twin)
          })
          return { orb, ring, spin: 0, angle: 0 }
        })
        .filter(Boolean)
    : []
  if (hasHostSun && wares.length) {
    host.dataset.lpStageBound = 'true'
    hostRing.style.transform = 'rotateY(0deg)'
    // a slow lap round the globe
    const HOST_LAP = 36
    let hostOn = false
    let hostSeen = false
    let hostFrame = 0
    let hostLast = null
    const hostTick = (now) => {
      hostFrame = 0
      if (!hostOn || !hostSeen || document.hidden) {
        hostLast = null
        return
      }
      const dt = hostLast === null ? 0 : Math.min(now - hostLast, 100)
      hostLast = now
      const rx = host.clientWidth * 0.4
      const ry = host.clientHeight * 0.34
      wares.forEach((w) => {
        w.angle += (2 * Math.PI * dt) / 1000 / HOST_LAP
        w.orb.style.translate = `${(rx * Math.cos(w.angle)).toFixed(1)}px ${(ry * Math.sin(w.angle)).toFixed(1)}px`
        const z = Math.sin(w.angle) >= 0 ? '5' : '1'
        if (w.orb.style.zIndex !== z) {
          w.orb.style.zIndex = z
        }
        w.spin = (w.spin + (360 * dt) / HOST_ORB_TURN) % 360
        w.ring.style.transform = `rotateY(${w.spin}deg)`
      })
      if (!reduceMotion) {
        hostFrame = requestAnimationFrame(hostTick)
      }
    }
    const wakeHost = () => {
      if (hostOn && hostSeen && !document.hidden && !hostFrame) {
        hostLast = null
        hostTick(performance.now())
      }
    }
    // the planets rise the first time the scene shows, and go round
    // whenever it is on screen
    const hostWatch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          hostSeen = entry.isIntersecting
          host.classList.toggle('is-off', !hostSeen)
        })
        if (hostSeen && !hostOn) {
          hostOn = true
          wares.forEach((w, i) => {
            w.angle = (i * 2 * Math.PI) / wares.length + Math.PI / 2
          })
          host.classList.add('is-orbit')
        }
        wakeHost()
      },
      { threshold: 0 },
    )
    hostWatch.observe(host)
    document.addEventListener('visibilitychange', wakeHost)
    // the planets take their size from the scene's width, so a planet
    // that has taken a new size turns its grain at a new pace: the
    // surface still covers its circumference in one turn
    const hostSizes = new ResizeObserver(() => {
      wares.forEach((w) => {
        const size = Number.parseFloat(getComputedStyle(w.orb).getPropertyValue('--s'))
        landingGrainTurn(w.orb, size, HOST_ORB_TURN)
      })
    })
    hostSizes.observe(host)
    holdLanding(host, () => {
      hostWatch.disconnect()
      hostSizes.disconnect()
      document.removeEventListener('visibilitychange', wakeHost)
      if (hostFrame) {
        cancelAnimationFrame(hostFrame)
        hostFrame = 0
      }
    })
    // the band's state, for the page's tests
    host.lpHost = () => ({
      on: hostOn,
      seen: hostSeen,
      orbit: host.classList.contains('is-orbit'),
      running: Boolean(hostFrame),
    })
  }
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
  // globe, inside its orbit's box): a line runs a little way in under
  // it, so a packet goes in under the globe and comes out from under it
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
    const atLabel = from.dataset.lpNode === 'hub' ? [x1, y1] : [x0, y0]
    edges.push({ key, from, d, cx: f(atLabel[0]), cy: f(atLabel[1]) })
  })
  if (svg.getAttribute('viewBox') !== viewBox) {
    svg.setAttribute('viewBox', viewBox)
  }
  edges.forEach(({ key, from, d, cx, cy, hidden }) => {
    let path = svg.querySelector(`[data-lp-edge="${key}"]`)
    // hidden rather than removed, so it is there again (revealed) when
    // the layout shows its end
    const shown = hidden ? 'none' : ''
    const dotNow = svg.querySelector(`[data-lp-dot="${key}"]`)
    for (const el of [path, dotNow]) {
      if (el && el.style.display !== shown) {
        el.style.display = shown
      }
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
    if (dot.getAttribute('cx') !== cx) {
      dot.setAttribute('cx', cx)
    }
    if (dot.getAttribute('cy') !== cy) {
      dot.setAttribute('cy', cy)
    }
  })
}

const createLandingFlowPlayer = (flow) => {
  const layers = [...flow.querySelectorAll(':scope > .lp-flow-lines')]
  // a lone layer is the one: asking which is laid out would wait on a layout every packet
  const layer = () => (layers.length === 1 ? layers[0] : layers.find((svg) => svg.getClientRects().length) || layers[0])
  const nodes = new Map()
  flow.querySelectorAll('[data-lp-node]').forEach((node) => nodes.set(node.dataset.lpNode, node))
  const products = [...nodes.values()].filter((node) => node.dataset.lpTarget).map((node) => node.dataset.lpNode)
  // the ends a packet can go to: the ones the layout shows
  const leaves = (product) =>
    [...nodes.values()]
      .filter((node) => node.dataset.lpParent === product && node.getClientRects().length)
      .map((node) => node.dataset.lpNode)
  if (!layers.length || !nodes.has('api') || !nodes.has('hub')) {
    return null
  }
  /* The hosting scene's hub is Scalar's globe. A packet going in under it
     sets its ring's sheen turning, and once the turn is done packets
     go out from under it to everything on the right at once; the round
     is longer for it. The paint there has no loop of its own (the sheet
     turns it off), so the ring lies still between packets */
  const hubPaints = [...(nodes.get('hub')?.querySelectorAll('[data-lp-stage-host] .lp-sun-halo-paint') ?? [])]
  const beats = hubPaints.length > 0
  /* A hub with no globe can hold packets too (data-lp-hold: the window on
     the home page). Its own script shows what happens to a packet
     there: it answers an lp-flow-hold event with what to wait for, and
     once that is done packets go out to everything on the right at once,
     as from the globe. */
  const holds = !beats && nodes.get('hub').dataset.lpHold !== undefined
  let beatGen = 0

  const SPEED = 640 // scene units per second
  const PERIOD = beats || holds ? 5200 : 3600
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

  /* the sheen's turn from the top: the ring paint's keyframes (the
     turn of lp-halo-turn, the first 18% of its 9s, with its easing), run
     once here. A turn still going when a packet lands is left to finish
     rather than started again, so the sheen never jumps. Settles when
     the turn ends, on the turn's own clock: after a stalled frame the
     packets still wait for the ring, not for a timer */
  const TURN_MS = 1620
  const TURN_EASE = 'cubic-bezier(0.45, 0, 0.2, 1)'
  const turns = new Map()
  const beat = () =>
    Promise.all(
      hubPaints.map((paint) => {
        const going = turns.get(paint)
        if (going && going.playState === 'running') {
          return going.finished
        }
        const turn = paint.animate(
          [{ transform: 'rotate(0deg)', easing: TURN_EASE }, { transform: 'rotate(360deg)' }],
          { duration: TURN_MS },
        )
        turns.set(paint, turn)
        return turn.finished
      }),
    ).then(
      () => true,
      () => false,
    )

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
      if (beats) {
        const gen = ++beatGen
        beat().then(() => {
          // stopped since (the flow out of view, the page hidden), or a
          // later round's packet already in: no burst from this one
          if (!running || gen !== beatGen) {
            return
          }
          leaves('hub').forEach((leaf) => {
            send(`hub>${leaf}`, () => {
              flip(leaf)
            })
          })
        })
        return
      }
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
      if (!products.length) {
        fanOut('hub')
        return
      }
      products.forEach((product, i) => {
        after(i * 90, () => {
          send(`hub>${product}`, () => {
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
    /* A turn still going would carry a burst of its own across the pause:
       it settles while nothing is playing, and by the time anyone reads
       it the flow may be playing again, so its generation has to move on
       without it. The turn itself goes too — a sheen turning behind a
       hidden tab is work nobody sees. */
    beatGen += 1
    turns.forEach((turn) => turn.cancel())
    turns.clear()
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
      // the anchors too: the hosting scene's disc eases its size after the
      // hub box has already changed, and the lines follow it
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
    // the turn runs only while the funnel is on screen
    const watch = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => track.classList.toggle('is-paused', !entry.isIntersecting))
      },
      { threshold: 0 },
    )
    watch.observe(track)
    holdLanding(track, () => watch.disconnect())
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
    // what this box binds beyond its own markup, to go with the page
    const undo = []
    holdLanding(box, () => undo.forEach((release) => release()))
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
        const sizes = new ResizeObserver(atEnd)
        sizes.observe(body)
        undo.push(() => sizes.disconnect())
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
        const sizes = new ResizeObserver(fitBody)
        sizes.observe(short)
        undo.push(() => sizes.disconnect())
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
    const skipOnScroll = () => transition?.skipTransition()
    window.addEventListener('scroll', skipOnScroll, { passive: true })
    undo.push(() => window.removeEventListener('scroll', skipOnScroll))
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
    const onTapOut = (event) => {
      if (pinned && !box.contains(event.target)) {
        pinned = false
        update(document.activeElement)
      }
    }
    document.addEventListener('pointerdown', onTapOut)
    undo.push(() => document.removeEventListener('pointerdown', onTapOut))
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
/* The customers page's hero: every customer as a ball of its own.

   The marks from the grids below, each on a glass ball like the home
   page's planets, tipped in over the fold one after another and left to
   heap up on a hairline floor.

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

/* What the onboard button copies on a page that does not carry the
   prompt itself. The home page's prompt is the one with the fields in
   it, so it stays the source there and this is its plain form: keep
   the two in step when the prompt in introduction.md changes. */
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
      const text = document.querySelector('#lp-prompts .lp-prompt-text')
      const prompt = text ? landingPromptText(text) : LANDING_ONBOARD_PROMPT
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

initDraggableElements()
initGallery()
initHeroSdkTabs()
initHeroScenes()
initHeroCards()
initLandingBoxLinks()
initLandingOrbs()
initFooterMeadow()
initCustomerBalls()
initLandingOnboard()
initLandingChat()
initLandingFlow()
initLandingPrompt()
initLandingFunnel()
initLandingWinTabs()
initLandingDocsWindows()
initTrustedWalls()
initLandingHostStage()
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
  initDraggableElements()
  initGallery()
  initHeroSdkTabs()
  initHeroScenes()
  initHeroCards()
  initLandingBoxLinks()
  initLandingOrbs()
  initFooterMeadow()
  initCustomerBalls()
  initLandingOnboard()
  initLandingChat()
  initLandingFlow()
  initLandingPrompt()
  initLandingFunnel()
  initLandingWinTabs()
  initLandingDocsWindows()
  initTrustedWalls()
  initLandingHostStage()
  initEnterpriseSky()
  docsHeroSyncs.forEach((sync) => sync())
  measureDocsHero()
  /* the same late column as on a resize: under reduced motion, a hero arriving from a page laid out
     differently is still on its way to its box here */
  requestAnimationFrame(() => requestAnimationFrame(measureDocsHero))
  initDocsHero()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

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
  console.log(`Initialized ${draggables.length} draggable elements`)
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

  console.log(`Initialized ${items.length} footer animation elements`)
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
  console.log(`Initialized ${slides.length} gallery elements`)
})

/* Hero SDK language tabs (per glass card, so every scene's card works) */
const initHeroSdkTabs = debounce(() => {
  const cards = document.querySelectorAll('.hero-glass')
  if (!cards.length) {
    return
  }

  let bound = 0
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
      bound += 1
    })
  })

  if (bound) {
    console.log(`Initialized ${bound} SDK tab elements`)
  }
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

  console.log(`Initialized ${buttons.length} hero scene tabs`)
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

  let bound = 0
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
    bound += 1
  })

  if (bound) {
    console.log(`Initialized ${bound} hero cards`)
  }
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

  console.log(`Initialized ${boxes.length} landing section links`)
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

  console.log(`Initialized ${chats.length} landing chats`)
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

  console.log(`Initialized ${flows.length} landing flows`)
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

  console.log(`Initialized ${wins.length} landing code windows`)
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

  console.log(`Initialized ${pairs.length} landing docs window pairs`)
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

  console.log(`Initialized ${tracks.length} landing funnels`)
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
      { part: 'step-3', parts: ['docs', 'docs-end'] },
      { part: 'step-4' },
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

  console.log(`Initialized ${boxes.length} landing prompt boxes`)
})
/* lp-funnel:end */

initDraggableElements()
initFooterAnimation()
initGallery()
initHeroSdkTabs()
initHeroScenes()
initHeroCards()
initLandingBoxLinks()
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
  initLandingChat()
  initLandingFlow()
  initLandingPrompt()
  initLandingFunnel()
  initLandingWinTabs()
  initLandingDocsWindows()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

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
  if (!draggables.length) return

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
    if (!item) return

    setFooterAnimationActive(item)
  },
  { passive: true },
)

const initFooterAnimation = debounce(() => {
  const items = document.querySelectorAll('.footer-animation .fa i')
  if (!items.length) return

  items.forEach((item) => {
    if (item.dataset.footerAnimationBound === 'true') return

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

  if (!buttons.length || !slides.length || !gallery) return

  buttons.forEach((button) => {
    button.addEventListener('click', function () {
      const target = document.querySelector(this.getAttribute('data-target'))

      observerPaused = true
      buttons.forEach((button) => button.classList.remove('active'))
      this.classList.add('active')

      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
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
  if (!cards.length) return

  let bound = 0
  cards.forEach((card) => {
    const buttons = card.querySelectorAll('.hero-glass-tabs button[data-sdk-lang]')
    const panels = card.querySelectorAll('.hero-glass-codewrap[data-sdk-lang]')
    if (!buttons.length || !panels.length) return

    buttons.forEach((button) => {
      if (button.dataset.sdkTabsBound === 'true') return

      button.dataset.sdkTabsBound = 'true'
      button.addEventListener('click', () => {
        buttons.forEach((other) => other.classList.toggle('active', other === button))

        const current = card.querySelector('.hero-glass-codewrap:not(.is-hidden)')
        const target = [...panels].find((panel) => panel.dataset.sdkLang === button.dataset.sdkLang)
        if (!target || target === current) return

        // The code area is a fixed-height scroller now: no height animation,
        // just land the new language scrolled to the top
        panels.forEach((panel) => panel.classList.toggle('is-hidden', panel !== target))
        target.scrollTop = 0
      })
      bound += 1
    })
  })

  if (bound) console.log(`Initialized ${bound} SDK tab elements`)
})

/* Hero scene switcher (Profound SDK / Zoom API). Inactive scene panels are
   detached from the DOM entirely, so only one background is rendered at a time. */
const initHeroScenes = debounce(() => {
  const strip = document.querySelector('.hero-tabs')
  const visual = document.querySelector('.hero-visual')
  if (!strip || !visual) return

  const buttons = strip.querySelectorAll('button[data-hero-scene]')
  const panels = [...visual.querySelectorAll('[data-hero-scene-panel]')]
  if (!buttons.length || !panels.length) return

  const registry = (window.__heroScenePanels = window.__heroScenePanels || new Map())

  panels.forEach((panel) => {
    if (panel.dataset.heroSceneAnchored === 'true') return

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
          if (!panel.isConnected) anchor.after(panel)
        } else if (panel.isConnected) {
          panel.remove()
        }
      })
    })
  }

  buttons.forEach((button) => {
    if (button.dataset.heroScenesBound === 'true') return

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
  if (!grid) return

  const cells = grid.querySelectorAll('.hero-cell')
  if (!cells.length) return

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
    const hush = () => {}
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
      .catch(() => {})
      .finally(() => {
        busy = false
      })
  }

  /* Scale the opened card with zoom rather than transform: zoom re-lays the
     card out at the larger size, so the vector art and code stay crisp. */
  const fit = (cell) => {
    if (!natural) return
    const factor = Math.min((window.innerWidth * 0.92) / natural.w, (window.innerHeight * 0.86) / natural.h, 2.6)
    cell.style.zoom = Math.max(1, factor)
  }

  const openCard = (cell) => {
    if (open || busy) return

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

    settle(
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
      if (close && open) close.focus({ preventScroll: true })
    })
  }

  /* Put the card back in the document, whatever happened while it was open.
     Re-queries the grid every time: the captured element can be detached by a
     re-render, and appending to a detached node makes the card disappear. */
  const restore = (cell) => {
    const liveGrid = document.querySelector('.hero-grid') || grid
    if (anchor && anchor.isConnected) {
      anchor.replaceWith(cell)
    } else if (liveGrid) {
      const at = liveGrid.children[cellIndex]
      if (at) liveGrid.insertBefore(cell, at)
      else liveGrid.appendChild(cell)
    }
  }

  const closeCard = () => {
    // recover if a previous run desynced: the stage still holds a card
    if (!open) open = stage.querySelector('.hero-cell')
    if (!open || busy) return
    const cell = open
    open = null

    settle(
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
      if (event.key === 'Escape') closeCard()
    })
    window.addEventListener('resize', () => {
      if (open) fit(open)
    })
  }

  let bound = 0
  cells.forEach((cell) => {
    if (cell.dataset.heroCardBound === 'true') return
    cell.dataset.heroCardBound = 'true'
    cell.setAttribute('role', 'button')
    cell.setAttribute('tabindex', '0')

    cell.addEventListener('click', (event) => {
      // an opened card is just content; its language tabs keep working
      if (cell.dataset.heroCellOpen === 'true') return
      // and in the grid, a language tab is a tab, not a card click
      if (event.target.closest('.hero-glass-tabs')) return
      openCard(cell)
    })

    cell.addEventListener('keydown', (event) => {
      if (cell.dataset.heroCellOpen === 'true') return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openCard(cell)
      }
    })
    bound += 1
  })

  if (bound) console.log(`Initialized ${bound} hero cards`)
})

/* Landing scroller: the sticky panel beside the copy shows the hero scene
   or one product card depending on which section is in the middle of the
   viewport. Sections carry data-lp-scene and the wrapper takes the active
   one; the layouts themselves live in CSS. */
const initLandingScenes = debounce(() => {
  const root = document.querySelector('.lp[data-lp-scene]')
  if (!root || root.dataset.lpScenesBound === 'true') {
    return
  }

  const sections = [...root.querySelectorAll('.lp-section[data-lp-scene]')]
  if (!sections.length) {
    return
  }

  root.dataset.lpScenesBound = 'true'

  // Single-column layout keeps the hero scene as a still
  const narrow = window.matchMedia('(max-width: 1100px)')

  const observer = new IntersectionObserver(
    (entries) => {
      if (narrow.matches) {
        return
      }
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          root.dataset.lpScene = entry.target.dataset.lpScene
        }
      })
    },
    // a thin band across the middle of the viewport: a section becomes the
    // scene the moment it crosses it
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  )

  sections.forEach((section) => observer.observe(section))

  narrow.addEventListener('change', () => {
    if (narrow.matches) {
      root.dataset.lpScene = 'hero'
    }
  })

  console.log(`Initialized ${sections.length} landing scenes`)
})

/* Landing boxes: a click on a product box, or on its folded band in the
   stack, scrolls to that product's section. The open card is the current
   section already, so it does nothing. */
const initLandingBoxLinks = debounce(() => {
  const root = document.querySelector('.lp[data-lp-scene]')
  if (!root || root.dataset.lpBoxLinksBound === 'true') {
    return
  }

  const boxes = [...root.querySelectorAll('.lp-box[data-lp-target]')]
  if (!boxes.length) {
    return
  }

  root.dataset.lpBoxLinksBound = 'true'

  const narrow = window.matchMedia('(max-width: 1100px)')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  boxes.forEach((box) => {
    box.addEventListener('click', (event) => {
      const target = box.dataset.lpTarget
      const section = root.querySelector(`.lp-section[data-lp-scene="${target}"]`)
      if (!section) {
        return
      }

      event.preventDefault()

      if (root.dataset.lpScene === target && !narrow.matches) {
        return
      }

      const header = Number.parseFloat(getComputedStyle(root).getPropertyValue('--scalar-header-height')) || 48
      const top = section.getBoundingClientRect().top + window.scrollY - header
      window.scrollTo({ top, behavior: reduceMotion.matches ? 'auto' : 'smooth' })
    })
  })

  console.log(`Initialized ${boxes.length} landing box links`)
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
        return 700 + 22 * text.length + 250
      })
      steps.push(() => {
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

/* The chat in the panel plays every time the MCP card becomes the scene;
   the one under the MCP section's copy (single column) every time it
   scrolls into view. */
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

    const root = chat.closest('.lp[data-lp-scene]')
    if (root && chat.closest('.lp-visual')) {
      let current = root.dataset.lpScene
      const sync = () => {
        const scene = root.dataset.lpScene
        if (scene === current) {
          return
        }
        current = scene
        if (scene === 'mcp') {
          player.play()
        } else {
          player.stop()
        }
      }
      new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-lp-scene'] })
      if (current === 'mcp') {
        player.play()
      }
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

initDraggableElements()
initFooterAnimation()
initGallery()
initHeroSdkTabs()
initHeroScenes()
initHeroCards()
initLandingScenes()
initLandingBoxLinks()
initLandingChat()
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
  initLandingScenes()
  initLandingBoxLinks()
  initLandingChat()
  initLandingDocsWindows()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

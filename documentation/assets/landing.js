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

initDraggableElements()
initFooterAnimation()
initGallery()
initHeroSdkTabs()
initHeroScenes()
initHeroCards()

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
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

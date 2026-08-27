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

        const startHeight = current ? current.offsetHeight : 0
        panels.forEach((panel) => panel.classList.toggle('is-hidden', panel !== target))
        const endHeight = target.offsetHeight

        // Animate the height change so switching languages does not jump
        if (startHeight && startHeight !== endHeight) {
          target.style.height = `${startHeight}px`
          target.style.overflow = 'hidden'
          void target.offsetHeight
          target.style.transition = 'height 260ms cubic-bezier(0.33, 1, 0.68, 1)'
          target.style.height = `${endHeight}px`
          const cleanup = () => {
            target.style.height = ''
            target.style.overflow = ''
            target.style.transition = ''
            target.removeEventListener('transitionend', cleanup)
          }
          target.addEventListener('transitionend', cleanup)
          setTimeout(cleanup, 420)
        }
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

initDraggableElements()
initFooterAnimation()
initGallery()
initHeroSdkTabs()
initHeroScenes()

const observer = new MutationObserver((records) => {
  if (!records.some((r) => r.addedNodes.length)) {
    return
  }

  initDraggableElements()
  initFooterAnimation()
  initGallery()
  initHeroSdkTabs()
  initHeroScenes()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

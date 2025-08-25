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
  const i = document.querySelectorAll('.fa i')
  let a = null
  i.forEach((e) => {
    e.addEventListener('mouseenter', function () {
      i.forEach((t) => t.classList.remove('active'))
      this.classList.add('active')
      a = this
    })
  })
  console.log(`Initialized ${draggables.length} draggable elements`)
})

/* Slide Gallery */
const initGallery = debounce(() => {
  const buttons = document.querySelectorAll('button[data-target^="#slide-"]')
  const slides = document.querySelectorAll('[id^="slide-"]')
  const gallery = document.querySelector('#gallery')
  if (!buttons.length || !slides.length || !gallery) return

  buttons.forEach((button) => {
    button.addEventListener('click', function () {
      const target = document.querySelector(this.getAttribute('data-target'))
      if (target && gallery) {
        gallery.scrollTo({
          left: target.offsetLeft - 16,
          behavior: 'smooth',
        })
      }
    })
  })
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const slideId = entry.target.id
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
      threshold: 0.5,
    },
  )
  slides.forEach((slide) => observer.observe(slide))
  console.log(`Initialized ${slides.length} gallery elements`)
})

initDraggableElements()
initGallery()

const observer = new MutationObserver((records) => {
  if (!records.some((r) => r.addedNodes.length)) return

  initDraggableElements()
  initGallery()
})

observer.observe(document.documentElement || document.body, { childList: true, subtree: true })

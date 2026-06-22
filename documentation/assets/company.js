;(() => {
  const stickerSelector = '[data-company-sticker]'
  const interactiveStickerSelector = `${stickerSelector} .company-team-sticker-interactive`
  const stickerClassPattern = /^sticker-\d+$/
  const stickerFilterLimit = 9
  const stickerRootSelector = '.company-team-section, .company-investors-layout'
  const isInteractiveDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent)
  const shouldUseStaticStickers = !isInteractiveDevice || isSafari
  let currentSticker = null
  let dragOffsetX = 0
  let dragOffsetY = 0
  let highestZIndex = 1000
  let prepareTimeout = null
  const svgReferenceAttributes = ['clip-path', 'filter', 'fill', 'href', 'mask', 'stroke', 'style', 'xlink:href']

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const replaceSvgReference = (value, oldId, newId) => {
    if (value === `#${oldId}`) {
      return `#${newId}`
    }

    return value.replace(new RegExp(`url\\(#${escapeRegExp(oldId)}\\)`, 'g'), `url(#${newId})`)
  }

  const getStickerNumber = (sticker, index) => {
    const className = Array.from(sticker.classList).find((name) => stickerClassPattern.test(name))
    const number = className ? Number(className.replace('sticker-', '')) : index + 1

    return number > stickerFilterLimit ? ((number - 1) % stickerFilterLimit) + 1 : number
  }

  const getContainingBlockOffset = (element) => {
    const containingBlock = element.offsetParent || document.documentElement
    const rect = containingBlock.getBoundingClientRect()

    return { left: rect.left, top: rect.top }
  }

  const getSvgAspectRatio = (svg) => {
    const viewBox = svg.viewBox?.baseVal

    if (viewBox?.width && viewBox?.height) {
      return viewBox.width / viewBox.height
    }

    const width = Number.parseFloat(svg.getAttribute('width') || '')
    const height = Number.parseFloat(svg.getAttribute('height') || '')

    return width && height ? width / height : 1
  }

  const getStickerViewportSize = (sticker, svg) => {
    const stickerStyles = window.getComputedStyle(sticker)
    let width = Number.parseFloat(stickerStyles.width)
    let height = Number.parseFloat(stickerStyles.height)

    if (sticker.classList.contains('company-investor-sticker')) {
      const logo = sticker.closest('.company-investor-logo')
      const logoWidth = logo?.getBoundingClientRect().width || width
      const aspectRatio = getSvgAspectRatio(svg)

      width = Math.min(logoWidth * 0.98, 360)
      height = width / aspectRatio
    }

    if (!width || !height) {
      const rect = sticker.getBoundingClientRect()

      width ||= rect.width || 190
      height ||= rect.height || width
    }

    return {
      height: Math.round(height),
      width: Math.round(width),
    }
  }

  const normalizeStickerSvgViewport = (sticker, svg) => {
    const { height, width } = getStickerViewportSize(sticker, svg)

    sticker.style.width = `${width}px`
    sticker.style.height = `${height}px`
    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.display = 'block'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.maxWidth = '100%'
    svg.style.maxHeight = '100%'
  }

  const namespaceStickerSvgIds = (sticker) => {
    const prefix = sticker.dataset.companyStickerIdPrefix
    const svg = sticker.querySelector('svg')

    if (!svg) {
      return
    }

    normalizeStickerSvgViewport(sticker, svg)

    if (!prefix || svg.dataset.companyStickerIdsNamespaced === prefix) {
      return
    }

    const idMap = new Map()

    svg.querySelectorAll('[id]').forEach((element) => {
      if (!element.id.startsWith(`${prefix}-`)) {
        idMap.set(element.id, `${prefix}-${element.id}`)
      }
    })

    if (!idMap.size) {
      svg.dataset.companyStickerIdsNamespaced = prefix
      return
    }

    svg.querySelectorAll('*').forEach((element) => {
      svgReferenceAttributes.forEach((attribute) => {
        const value = element.getAttribute(attribute)

        if (!value) {
          return
        }

        let nextValue = value

        idMap.forEach((newId, oldId) => {
          nextValue = replaceSvgReference(nextValue, oldId, newId)
        })

        if (nextValue !== value) {
          element.setAttribute(attribute, nextValue)
        }
      })

      if (idMap.has(element.id)) {
        element.id = idMap.get(element.id)
      }
    })

    svg.dataset.companyStickerIdsNamespaced = prefix
  }

  const removeStickerFilterEffects = () => {
    document.querySelector('.company-sticker-filter-effect')?.remove()
  }

  const blockInteractiveStickerLoads = () => {
    if (!shouldUseStaticStickers) {
      return
    }

    document.querySelectorAll(interactiveStickerSelector).forEach((icon) => {
      icon.removeAttribute('src')
    })
  }

  const prepareCompanyStickers = () => {
    if (shouldUseStaticStickers) {
      blockInteractiveStickerLoads()
      return
    }

    document.querySelectorAll(stickerSelector).forEach((sticker, index) => {
      namespaceStickerSvgIds(sticker)

      if (!Array.from(sticker.classList).some((name) => stickerClassPattern.test(name))) {
        sticker.classList.add(`sticker-${getStickerNumber(sticker, index)}`)
      }

      if (sticker.dataset.companyStickerBound === 'true') {
        return
      }

      sticker.addEventListener('mouseenter', () => {
        highestZIndex += 1
        sticker.style.zIndex = highestZIndex
      })

      sticker.dataset.companyStickerBound = 'true'
      sticker.addEventListener('mousedown', (event) => {
        currentSticker = sticker
        const rect = sticker.getBoundingClientRect()
        const offset = getContainingBlockOffset(sticker)

        event.preventDefault()
        dragOffsetX = event.clientX - rect.left
        dragOffsetY = event.clientY - rect.top
        sticker.style.width = `${rect.width}px`
        sticker.style.height = `${rect.height}px`
        sticker.style.left = `${rect.left - offset.left}px`
        sticker.style.top = `${rect.top - offset.top}px`
        sticker.style.right = 'auto'
        sticker.style.bottom = 'auto'
        sticker.style.transform = 'none'
      })
    })
  }

  const schedulePrepareCompanyStickers = () => {
    clearTimeout(prepareTimeout)
    prepareTimeout = setTimeout(prepareCompanyStickers, 50)
  }

  const observeStickerRoots = () => {
    const roots = document.querySelectorAll(stickerRootSelector)

    if (!roots.length) {
      return
    }

    const observer = new MutationObserver((records) => {
      const hasElementAdded = records.some((record) =>
        [...record.addedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE),
      )

      if (!hasElementAdded) {
        return
      }

      schedulePrepareCompanyStickers()
    })

    roots.forEach((root) => {
      observer.observe(root, { childList: true, subtree: true })
    })
  }

  const init = () => {
    if (shouldUseStaticStickers) {
      document.documentElement.classList.add('company-stickers-static')
      removeStickerFilterEffects()
      blockInteractiveStickerLoads()
      return
    }

    prepareCompanyStickers()
    observeStickerRoots()
  }

  if (shouldUseStaticStickers) {
    document.documentElement.classList.add('company-stickers-static')
    removeStickerFilterEffects()
    blockInteractiveStickerLoads()
  }

  if (!shouldUseStaticStickers) {
    document.addEventListener('mousemove', (event) => {
      if (!currentSticker) {
        return
      }

      const offset = getContainingBlockOffset(currentSticker)

      currentSticker.style.left = `${event.clientX - dragOffsetX - offset.left}px`
      currentSticker.style.top = `${event.clientY - dragOffsetY - offset.top}px`
    })

    document.addEventListener('mouseup', () => {
      currentSticker = null
    })

    window.addEventListener('resize', schedulePrepareCompanyStickers)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()

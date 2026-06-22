;(() => {
  const stickerSelector = '[data-company-sticker]'
  const interactiveStickerSelector = `${stickerSelector} .company-team-sticker-interactive`
  const stickerClassPattern = /^sticker-\d+$/
  const stickerFilterLimit = 9
  const stickerRootSelector = '.company-team-section, .company-investors-layout'
  const isInteractiveDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches
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

  const namespaceStickerSvgIds = (sticker) => {
    const prefix = sticker.dataset.companyStickerIdPrefix
    const svg = sticker.querySelector('svg')

    if (!prefix || !svg || svg.dataset.companyStickerIdsNamespaced === prefix) {
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
    if (isInteractiveDevice) {
      return
    }

    document.querySelectorAll(interactiveStickerSelector).forEach((icon) => {
      icon.removeAttribute('src')
    })
  }

  const prepareCompanyStickers = () => {
    if (!isInteractiveDevice) {
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
    if (!isInteractiveDevice) {
      removeStickerFilterEffects()
      blockInteractiveStickerLoads()
      return
    }

    prepareCompanyStickers()
    observeStickerRoots()
  }

  if (!isInteractiveDevice) {
    removeStickerFilterEffects()
    blockInteractiveStickerLoads()
  }

  if (isInteractiveDevice) {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true })
  } else {
    init()
  }
})()

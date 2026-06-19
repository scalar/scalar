;(() => {
  const stickerSelector = '[data-company-sticker]'
  const stickerClassPattern = /^sticker-\d+$/
  const stickerFilterLimit = 9
  let currentSticker = null
  let dragOffsetX = 0
  let dragOffsetY = 0
  let highestZIndex = 1000
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

  // Temporarily disabled while profiling sticker drag performance.
  // const updateLightPosition = (clientX, clientY) => {
  //   document.querySelectorAll(stickerSelector).forEach((sticker, index) => {
  //     const rect = sticker.getBoundingClientRect()
  //     const isInside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  //
  //     if (!isInside) {
  //       return
  //     }
  //
  //     const stickerNumber = getStickerNumber(sticker, index)
  //     const x = clientX - rect.left
  //     const y = clientY - rect.top
  //     const light = document.getElementById(`light${stickerNumber}`)
  //     const flippedLight = document.getElementById(`lightFlipped${stickerNumber}`)
  //
  //     sticker.style.setProperty('--company-sticker-light-x', `${(x / rect.width) * 100}%`)
  //     sticker.style.setProperty('--company-sticker-light-y', `${(y / rect.height) * 100}%`)
  //     light?.setAttribute('x', x)
  //     light?.setAttribute('y', y)
  //     flippedLight?.setAttribute('x', x)
  //     flippedLight?.setAttribute('y', rect.height - y)
  //   })
  // }

  const prepareCompanyStickers = () => {
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

  document.addEventListener('mousemove', (event) => {
    // updateLightPosition(event.clientX, event.clientY)

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

  prepareCompanyStickers()

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length)) {
      prepareCompanyStickers()
    }
  })

  observer.observe(document.documentElement || document.body, { childList: true, subtree: true })
})()

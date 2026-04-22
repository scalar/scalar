/* Brand color swatch click-to-copy */
const initBrandColorSwatches = () => {
  const swatches = document.querySelectorAll('[data-brand-copy]')
  if (!swatches.length) {
    return
  }

  const copyToClipboard = async (value) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value)
        return true
      } catch (error) {
        // Fall through to legacy path
      }
    }

    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch (error) {
      document.body.removeChild(textarea)
      return false
    }
  }

  swatches.forEach((swatch) => {
    if (swatch.dataset.brandCopyBound === 'true') {
      return
    }
    swatch.dataset.brandCopyBound = 'true'
    swatch.addEventListener('click', async () => {
      const value = swatch.getAttribute('data-brand-copy')
      if (!value) {
        return
      }
      const copied = await copyToClipboard(value)
      if (!copied) {
        return
      }
      swatch.setAttribute('data-copied', 'true')
      const hint = swatch.querySelector('.brand-color-copy-hint')
      const previous = hint ? hint.textContent : null
      if (hint) {
        hint.textContent = '✓ Copied'
      }
      window.clearTimeout(swatch._brandCopyTimeout)
      swatch._brandCopyTimeout = window.setTimeout(() => {
        swatch.removeAttribute('data-copied')
        if (hint && previous !== null) {
          hint.textContent = previous
        }
      }, 3500)
    })
  })
}

initBrandColorSwatches()

const brandObserver = new MutationObserver((records) => {
  if (!records.some((record) => record.addedNodes.length)) {
    return
  }
  initBrandColorSwatches()
})

brandObserver.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
})

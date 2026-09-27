/*
 * Small DOM helpers shared by the free OpenAPI tools. No framework, no build
 * step: each tool script imports this module when its widget is on the page.
 *
 * Everything user-provided is written with textContent or value, never as
 * HTML, so a pasted document cannot inject markup into the page.
 */

import { MAX_SHARE_URL_LENGTH, SHARE_HASH_KEY, decodeState, encodeState, readShareHash } from './tools-shared.js'

/** Create an element. `attrs` supports class, text, dataset-free attributes and on* listeners. */
export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) {
      continue
    }
    if (key === 'class') {
      node.className = value
    } else if (key === 'text') {
      node.textContent = value
    } else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value)
    } else {
      node.setAttribute(key, value === true ? '' : value)
    }
  }
  for (const child of [].concat(children)) {
    if (child !== undefined && child !== null && child !== false) {
      node.append(child)
    }
  }
  return node
}

export const debounce = (fn, wait = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

/** Copy text, falling back to a hidden textarea where the async clipboard is unavailable. */
export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = el('textarea', { class: 'scalar-tool-offscreen', 'aria-hidden': 'true' })
    area.value = text
    document.body.append(area)
    area.select()
    const ok = document.execCommand?.('copy') ?? false
    area.remove()
    return ok
  }
}

export const downloadText = (text, filename, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = el('a', { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Briefly swap a button label to confirm an action. */
export const flash = (button, label, duration = 1600) => {
  const original = button.dataset.label ?? button.textContent
  button.dataset.label = original
  button.textContent = label
  clearTimeout(button._flashTimer)
  button._flashTimer = setTimeout(() => {
    button.textContent = original
  }, duration)
}

export const button = (label, onClick, variant = 'secondary') =>
  el('button', { type: 'button', class: `scalar-tool-button scalar-tool-button-${variant}`, text: label, onClick })

/** Files over this size are refused: the tools run in the page and would freeze it. */
const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * A plain textarea editor with upload, drag and drop, and a line selector for
 * jumping to errors.
 */
export const createEditor = ({ label, value = '', onChange, sample, id }) => {
  const textarea = el('textarea', {
    class: 'scalar-tool-textarea',
    id,
    spellcheck: 'false',
    autocapitalize: 'off',
    autocomplete: 'off',
    'aria-label': label,
    placeholder: 'Paste JSON or YAML, or drop a file here',
  })
  textarea.value = value

  const notify = () => onChange?.(textarea.value)

  textarea.addEventListener('input', notify)

  // Tab indents instead of leaving the field; Escape then Tab still moves focus.
  let escaped = false
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      escaped = true
      return
    }
    if (event.key === 'Tab' && !event.shiftKey && !escaped) {
      event.preventDefault()
      textarea.setRangeText('  ', textarea.selectionStart, textarea.selectionEnd, 'end')
      notify()
    }
    escaped = false
  })

  const status = el('span', { class: 'scalar-tool-editor-status', role: 'status' })

  const readFile = async (file) => {
    if (!file) {
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      status.textContent = `${file.name} is larger than 10 MB, which is too big to process in the browser.`
      return
    }
    textarea.value = await file.text()
    status.textContent = `Loaded ${file.name}`
    notify()
  }

  const input = el('input', {
    type: 'file',
    accept: '.json,.yaml,.yml,application/json,application/yaml,text/yaml,text/plain',
    class: 'scalar-tool-offscreen',
    tabindex: '-1',
    'aria-hidden': 'true',
    onChange: () =>
      readFile(input.files?.[0]).catch(() => {
        status.textContent = 'Could not read that file.'
      }),
  })

  textarea.addEventListener('dragover', (event) => {
    event.preventDefault()
    textarea.dataset.dragging = 'true'
  })
  textarea.addEventListener('dragleave', () => delete textarea.dataset.dragging)
  textarea.addEventListener('drop', (event) => {
    event.preventDefault()
    delete textarea.dataset.dragging
    readFile(event.dataTransfer?.files?.[0]).catch(() => {
      status.textContent = 'Could not read that file.'
    })
  })

  const actions = [button('Upload file', () => input.click())]
  if (sample !== undefined) {
    actions.push(
      button('Load sample', () => {
        textarea.value = sample
        status.textContent = 'Sample loaded'
        notify()
      }),
    )
  }
  actions.push(
    button('Clear', () => {
      textarea.value = ''
      status.textContent = ''
      notify()
      textarea.focus()
    }),
  )

  const node = el('div', { class: 'scalar-tool-editor' }, [
    el('div', { class: 'scalar-tool-panel-header' }, [
      el('label', { class: 'scalar-tool-panel-title', for: id, text: label }),
      el('div', { class: 'scalar-tool-actions' }, actions),
    ]),
    textarea,
    el('div', { class: 'scalar-tool-editor-footer' }, [status, input]),
  ])

  /** Select a 1-based line and scroll it into view. */
  const selectLine = (line) => {
    const lines = textarea.value.split('\n')
    if (!line || line > lines.length) {
      return
    }
    const start = lines.slice(0, line - 1).reduce((total, text) => total + text.length + 1, 0)
    textarea.focus()
    textarea.setSelectionRange(start, start + lines[line - 1].length)
    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 18
    textarea.scrollTop = Math.max(0, (line - 4) * lineHeight)
  }

  return {
    node,
    textarea,
    getValue: () => textarea.value,
    setValue: (text) => {
      textarea.value = text
    },
    selectLine,
  }
}

/** A read-only code block with copy and download buttons. */
export const createOutput = ({ label, filename = () => 'openapi.yaml' }) => {
  const code = el('pre', { class: 'scalar-tool-code', tabindex: '0' })
  const copy = button('Copy', async () => flash(copy, (await copyText(code.textContent)) ? 'Copied' : 'Copy failed'))
  const download = button('Download', () => downloadText(code.textContent, filename()))
  const title = el('span', { class: 'scalar-tool-panel-title', text: label })
  const node = el('div', { class: 'scalar-tool-output' }, [
    el('div', { class: 'scalar-tool-panel-header' }, [
      title,
      el('div', { class: 'scalar-tool-actions' }, [copy, download]),
    ]),
    code,
  ])
  return {
    node,
    setText: (text) => {
      code.textContent = text
      copy.disabled = !text
      download.disabled = !text
    },
    setTitle: (text) => {
      title.textContent = text
    },
  }
}

/** The state encoded in the current URL, if any. */
export const readSharedState = () => decodeState(readShareHash(window.location.hash))

/**
 * A "Copy share link" button. The state goes into the URL hash, which browsers
 * never send to a server, so the link carries the document without Scalar
 * seeing it.
 */
export const createShareButton = (getState, onMessage) => {
  const shareButton = button('Copy share link', async () => {
    const payload = await encodeState(getState())
    const url = `${window.location.origin}${window.location.pathname}#${SHARE_HASH_KEY}=${payload}`
    if (url.length > MAX_SHARE_URL_LENGTH) {
      onMessage?.('This document is too large for a share link. Download it and share the file instead.')
      flash(shareButton, 'Too large')
      return
    }
    try {
      window.history.replaceState(window.history.state, '', url)
    } catch {
      // Some embedded contexts block history changes; copying still works.
    }
    const ok = await copyText(url)
    flash(shareButton, ok ? 'Link copied' : 'Copy failed')
    onMessage?.(
      ok
        ? 'Share link copied. Anyone with the link sees this exact input.'
        : 'Could not copy. Copy the address bar instead.',
    )
  })
  return shareButton
}

/** A consistent message for when the CDN libraries fail to load. */
export const libraryErrorMessage = () =>
  'Could not load the OpenAPI parser from cdn.jsdelivr.net. Check your connection or content blocker and reload the page.'

/*
 * Swagger 2.0 to OpenAPI 3.x converter widget for /tools/openapi-converter.
 *
 * Progressive enhancement over the static fallback in
 * [data-scalar-tool="openapi-converter"]. Classic script, modules via import().
 */
;(() => {
  const TOOL = 'openapi-converter'
  const registry = (window.__scalarTools = window.__scalarTools || {})
  if (registry[TOOL]) {
    registry[TOOL].scan()
    return
  }

  const scriptSrc = document.currentScript?.src
  // The platform serves head scripts from the site root, while the modules
  // stay under /free-tools/, so try that path first and only fall back to a
  // path relative to this script (useful when testing the folder standalone).
  const load = async (file) => {
    try {
      return await import(`/free-tools/${file}`)
    } catch (error) {
      if (!scriptSrc) {
        throw error
      }
      return import(new URL(file, scriptSrc).href)
    }
  }

  const mount = async (root) => {
    const fallback = root.querySelector('[data-scalar-tool-fallback]')
    const [ui, shared, core] = await Promise.all([
      load('tools-ui.js'),
      load('tools-shared.js'),
      load('openapi-converter-core.js'),
    ])
    const { el, createEditor, createOutput, createShareButton, debounce, readSharedState, libraryErrorMessage } = ui

    const sharedState = await readSharedState()
    const state = {
      target: sharedState?.t === '3.0' ? '3.0' : '3.1',
      format: ['yaml', 'json', 'same'].includes(sharedState?.f) ? sharedState.f : 'yaml',
    }

    let libraries
    let lastResult

    const message = el('p', { class: 'scalar-tool-hint' })
    const summary = el('div', { class: 'scalar-tool-summary', role: 'status', 'aria-live': 'polite' })
    const notes = el('ul', { class: 'scalar-tool-notes' })

    const output = createOutput({
      label: 'OpenAPI output',
      filename: () => `openapi.${lastResult?.format === 'json' ? 'json' : 'yaml'}`,
    })

    const editor = createEditor({
      id: `${TOOL}-input`,
      label: 'Swagger 2.0 or OpenAPI 3.0 input',
      value: typeof sharedState?.d === 'string' ? sharedState.d : core.SAMPLE_DOCUMENT,
      sample: core.SAMPLE_DOCUMENT,
      onChange: debounce(() => run(), 250),
    })

    /** A labelled group of radio-style toggle buttons. */
    const segmented = (label, options, key) => {
      const group = el('div', { class: 'scalar-tool-segmented', role: 'radiogroup', 'aria-label': label })
      const buttons = options.map(([value, text]) => {
        const option = el('button', {
          type: 'button',
          role: 'radio',
          class: 'scalar-tool-segment',
          text,
          onClick: () => {
            state[key] = value
            sync()
            run()
          },
        })
        option.dataset.value = value
        return option
      })
      const sync = () =>
        buttons.forEach((option) => option.setAttribute('aria-checked', String(option.dataset.value === state[key])))
      sync()
      group.append(el('span', { class: 'scalar-tool-segmented-label', text: label }), ...buttons)
      return group
    }

    const run = () => {
      if (!libraries) {
        return
      }
      const text = editor.getValue()
      notes.replaceChildren()
      if (!text.trim()) {
        summary.dataset.state = 'empty'
        summary.textContent = 'Paste or upload a Swagger 2.0 or OpenAPI 3.0 document.'
        output.setText('')
        lastResult = undefined
        return
      }
      const result = core.convertText(text, { target: state.target, format: state.format }, libraries)
      lastResult = result.ok ? result : undefined
      if (!result.ok) {
        summary.dataset.state = 'invalid'
        summary.textContent = result.error
        output.setText('')
        return
      }
      const from = result.from === '2.0' ? 'Swagger 2.0' : `OpenAPI ${result.from}`
      summary.dataset.state = 'valid'
      summary.textContent = `Converted ${from} to OpenAPI ${result.to} (${result.format.toUpperCase()}).`
      notes.append(...result.notes.map((note) => el('li', { text: note })))
      output.setTitle(`OpenAPI ${result.to} output`)
      output.setText(result.output)
    }

    const toolbar = el('div', { class: 'scalar-tool-toolbar' }, [
      el('div', { class: 'scalar-tool-controls' }, [
        segmented(
          'Convert to',
          [
            ['3.1', 'OpenAPI 3.1'],
            ['3.0', 'OpenAPI 3.0'],
          ],
          'target',
        ),
        segmented(
          'Output',
          [
            ['yaml', 'YAML'],
            ['json', 'JSON'],
          ],
          'format',
        ),
      ]),
      el('div', { class: 'scalar-tool-actions' }, [
        createShareButton(
          () => ({ d: editor.getValue(), t: state.target, f: state.format }),
          (text) => (message.textContent = text),
        ),
      ]),
    ])

    const app = el('div', { class: 'scalar-tool-app' }, [
      toolbar,
      el('div', { class: 'scalar-tool-grid' }, [
        editor.node,
        el('div', { class: 'scalar-tool-panel' }, [summary, notes, output.node]),
      ]),
      el('p', { class: 'scalar-tool-privacy', text: 'Runs in your browser. Your document never leaves your browser.' }),
      message,
    ])

    summary.textContent = 'Loading the OpenAPI parser…'
    fallback?.setAttribute('hidden', '')
    root.prepend(app)

    try {
      libraries = await shared.loadLibraries()
    } catch {
      summary.dataset.state = 'invalid'
      summary.textContent = libraryErrorMessage()
      return
    }
    run()
  }

  const scan = () => {
    document.querySelectorAll(`[data-scalar-tool="${TOOL}"]`).forEach((root) => {
      if (root.dataset.scalarToolReady === 'true' || !root.querySelector('[data-scalar-tool-end]')) {
        return
      }
      root.dataset.scalarToolReady = 'true'
      mount(root).catch((error) => {
        console.error(`[${TOOL}]`, error)
        root.dataset.scalarToolReady = 'failed'
      })
    })
  }

  registry[TOOL] = { scan }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true })
  } else {
    scan()
  }

  /* Docs pages swap their content client side, so re-run when the widget lands. */
  new MutationObserver((records) => {
    if (records.some((record) => record.addedNodes.length)) {
      scan()
    }
  }).observe(document.documentElement || document.body, { childList: true, subtree: true })
})()

/*
 * OpenAPI validator widget for /tools/openapi-validator.
 *
 * The page ships a static fallback inside [data-scalar-tool="openapi-validator"].
 * This script replaces it with the live tool. It is a classic script (loaded
 * from <head>), so the modules it needs are pulled in with dynamic import().
 */
;(() => {
  const TOOL = 'openapi-validator'
  const registry = (window.__scalarTools = window.__scalarTools || {})
  if (registry[TOOL]) {
    registry[TOOL].scan()
    return
  }

  /* Resolve sibling modules next to this script, falling back to the assets root. */
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
      load('openapi-validator-core.js'),
    ])
    const { el, button, createEditor, createShareButton, debounce, readSharedState, libraryErrorMessage } = ui

    const sharedState = await readSharedState()
    const initial = typeof sharedState?.d === 'string' ? sharedState.d : core.SAMPLE_DOCUMENT

    const summary = el('div', { class: 'scalar-tool-summary', role: 'status', 'aria-live': 'polite' })
    const results = el('div', { class: 'scalar-tool-results' })
    const message = el('p', { class: 'scalar-tool-hint' })

    let libraries
    let runId = 0

    const editor = createEditor({
      id: `${TOOL}-input`,
      label: 'Your OpenAPI document',
      value: initial,
      sample: core.SAMPLE_DOCUMENT,
      onChange: debounce(() => run(), 250),
    })

    const renderIssue = (issue, severity, text) => {
      const line = issue.line ?? core.locatePointer(text, issue.path, libraries.YAML)
      const item = el('li', { class: `scalar-tool-issue scalar-tool-issue-${severity}` })
      const body = el('button', {
        type: 'button',
        class: 'scalar-tool-issue-body',
        disabled: line ? undefined : true,
        title: line ? `Jump to line ${line}` : undefined,
        onClick: () => editor.selectLine(line),
      })
      body.append(
        el('span', { class: 'scalar-tool-issue-meta' }, [
          el('span', {
            class: `scalar-tool-badge scalar-tool-badge-${severity}`,
            text: severity === 'error' ? 'Error' : 'Warning',
          }),
          el('code', { class: 'scalar-tool-pointer', text: issue.path || '(document root)' }),
          line ? el('span', { class: 'scalar-tool-line', text: `line ${line}` }) : null,
        ]),
        el('span', { class: 'scalar-tool-issue-message', text: issue.message }),
      )
      if (issue.rule) {
        body.append(el('span', { class: 'scalar-tool-rule', text: issue.rule }))
      }
      item.append(body)
      return item
    }

    const run = async () => {
      const current = ++runId
      const text = editor.getValue()
      const result = await core.validateText(text, libraries)
      if (current !== runId) {
        return
      }
      results.replaceChildren()
      summary.dataset.state = result.status

      if (result.status === 'empty') {
        summary.textContent = 'Paste or upload an OpenAPI document to validate it.'
        return
      }
      if (result.status === 'parse-error') {
        summary.textContent = `This is not valid ${result.format === 'json' ? 'JSON' : 'YAML'} yet.`
      } else if (result.status === 'invalid') {
        const count = result.errors.length
        summary.textContent = `${count} error${count === 1 ? '' : 's'}${result.version ? ` in this OpenAPI ${result.version === '2.0' ? 'Swagger 2.0' : result.version} document` : ''}.`
      } else {
        const name = result.version === '2.0' ? 'Swagger 2.0' : `OpenAPI ${result.version}`
        const warnings = result.warnings.length
        summary.textContent = `Valid ${name} document${warnings ? `, with ${warnings} lint warning${warnings === 1 ? '' : 's'}` : ''}.`
      }

      if (result.errors.length) {
        results.append(
          el('h3', { class: 'scalar-tool-section-title', text: 'Errors' }),
          el(
            'ul',
            { class: 'scalar-tool-issues' },
            result.errors.map((issue) => renderIssue(issue, 'error', text)),
          ),
        )
      }
      if (result.warnings.length) {
        results.append(
          el('h3', { class: 'scalar-tool-section-title', text: 'Lint warnings' }),
          el(
            'ul',
            { class: 'scalar-tool-issues' },
            result.warnings.map((issue) => renderIssue(issue, 'warning', text)),
          ),
        )
      }
      if (result.status === 'valid' && !result.warnings.length) {
        results.append(el('p', { class: 'scalar-tool-empty', text: 'No errors and no lint warnings. Nice.' }))
      }
    }

    const toolbar = el('div', { class: 'scalar-tool-toolbar' }, [
      el('span', {
        class: 'scalar-tool-privacy',
        text: 'Runs in your browser. Your document never leaves your browser.',
      }),
      el('div', { class: 'scalar-tool-actions' }, [
        createShareButton(
          () => ({ d: editor.getValue() }),
          (text) => (message.textContent = text),
        ),
        button('Validate', () => run(), 'primary'),
      ]),
    ])

    const app = el('div', { class: 'scalar-tool-app' }, [
      toolbar,
      el('div', { class: 'scalar-tool-grid' }, [
        editor.node,
        el('div', { class: 'scalar-tool-panel' }, [
          el('div', { class: 'scalar-tool-panel-header' }, [
            el('span', { class: 'scalar-tool-panel-title', text: 'Result' }),
          ]),
          summary,
          results,
        ]),
      ]),
      message,
    ])

    summary.textContent = 'Loading the OpenAPI parser…'
    fallback?.setAttribute('hidden', '')
    root.prepend(app)

    try {
      libraries = await shared.loadLibraries()
    } catch {
      summary.dataset.state = 'parse-error'
      summary.textContent = libraryErrorMessage()
      return
    }
    await run()
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

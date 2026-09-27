/*
 * OpenAPI diff widget for /tools/openapi-diff.
 *
 * Two editors (before and after) and a report of what changed, with breaking
 * changes first. Progressive enhancement over the static fallback in
 * [data-scalar-tool="openapi-diff"]. Classic script, modules via import().
 */
;(() => {
  const TOOL = 'openapi-diff'
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

  const SEVERITY_LABEL = { breaking: 'Breaking', warning: 'Warning', info: 'Change' }
  const SEVERITY_ORDER = { breaking: 0, warning: 1, info: 2 }

  const mount = async (root) => {
    const fallback = root.querySelector('[data-scalar-tool-fallback]')
    const [ui, shared, core] = await Promise.all([
      load('tools-ui.js'),
      load('tools-shared.js'),
      load('openapi-diff-core.js'),
    ])
    const {
      el,
      button,
      copyText,
      flash,
      createEditor,
      createShareButton,
      debounce,
      readSharedState,
      libraryErrorMessage,
    } = ui

    const sharedState = await readSharedState()
    let libraries
    let lastDiff

    const message = el('p', { class: 'scalar-tool-hint' })
    const summary = el('div', { class: 'scalar-tool-summary', role: 'status', 'aria-live': 'polite' })
    const report = el('div', { class: 'scalar-tool-results' })

    const onChange = debounce(() => run(), 300)
    const before = createEditor({
      id: `${TOOL}-before`,
      label: 'Before (old version)',
      value: typeof sharedState?.a === 'string' ? sharedState.a : core.SAMPLE_BEFORE,
      sample: core.SAMPLE_BEFORE,
      onChange,
    })
    const after = createEditor({
      id: `${TOOL}-after`,
      label: 'After (new version)',
      value: typeof sharedState?.b === 'string' ? sharedState.b : core.SAMPLE_AFTER,
      sample: core.SAMPLE_AFTER,
      onChange,
    })

    const copyReport = button('Copy report', async () => {
      if (lastDiff) {
        flash(copyReport, (await copyText(core.formatReport(lastDiff))) ? 'Copied' : 'Copy failed')
      }
    })

    const badge = (severity) =>
      el('span', { class: `scalar-tool-badge scalar-tool-badge-${severity}`, text: SEVERITY_LABEL[severity] })

    const route = (entry) => [
      el('span', { class: `scalar-tool-method scalar-tool-method-${entry.method}`, text: entry.method.toUpperCase() }),
      el('code', { class: 'scalar-tool-mcp-path', text: entry.path }),
    ]

    const prepare = (editor, label) => {
      const parsed = shared.parseText(editor.getValue(), libraries.YAML)
      if (!parsed.ok) {
        return {
          ok: false,
          error: `${label}: ${parsed.error.message}${parsed.error.line ? ` (line ${parsed.error.line})` : ''}`,
        }
      }
      const prepared = core.prepareDocument(parsed.value, libraries)
      return prepared.ok ? prepared : { ok: false, error: `${label}: ${prepared.error}` }
    }

    const run = () => {
      if (!libraries) {
        return
      }
      report.replaceChildren()
      const left = prepare(before, 'Before')
      const right = prepare(after, 'After')
      if (!left.ok || !right.ok) {
        lastDiff = undefined
        summary.dataset.state = 'invalid'
        summary.textContent = [left.error, right.error].filter(Boolean).join(' · ')
        return
      }

      const diff = core.diffDocuments(left.document, right.document)
      lastDiff = diff
      const { breaking, warning, info } = diff.summary
      summary.dataset.state = breaking ? 'invalid' : 'valid'
      if (!breaking && warning) {
        summary.dataset.state = 'warning'
      }
      summary.textContent =
        breaking + warning + info === 0
          ? 'No differences in operations, parameters, request bodies or responses.'
          : `${breaking} breaking change${breaking === 1 ? '' : 's'}, ${warning} warning${warning === 1 ? '' : 's'}, ${info} other change${info === 1 ? '' : 's'}.`

      if (diff.removed.length) {
        report.append(
          el('h3', { class: 'scalar-tool-section-title', text: 'Removed operations' }),
          el(
            'ul',
            { class: 'scalar-tool-issues' },
            diff.removed.map((entry) =>
              el('li', { class: 'scalar-tool-diff-op' }, [
                el('div', { class: 'scalar-tool-mcp-head' }, [badge('breaking'), ...route(entry)]),
              ]),
            ),
          ),
        )
      }
      if (diff.changed.length) {
        report.append(
          el('h3', { class: 'scalar-tool-section-title', text: 'Changed operations' }),
          el(
            'ul',
            { class: 'scalar-tool-issues' },
            [...diff.changed]
              .sort(
                (a, b) =>
                  Math.min(...a.changes.map((c) => SEVERITY_ORDER[c.severity])) -
                  Math.min(...b.changes.map((c) => SEVERITY_ORDER[c.severity])),
              )
              .map((entry) =>
                el('li', { class: 'scalar-tool-diff-op' }, [
                  el('div', { class: 'scalar-tool-mcp-head' }, route(entry)),
                  el(
                    'ul',
                    { class: 'scalar-tool-diff-changes' },
                    [...entry.changes]
                      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
                      .map((change) => el('li', {}, [badge(change.severity), el('span', { text: change.message })])),
                  ),
                ]),
              ),
          ),
        )
      }
      if (diff.added.length) {
        report.append(
          el('h3', { class: 'scalar-tool-section-title', text: 'Added operations' }),
          el(
            'ul',
            { class: 'scalar-tool-issues' },
            diff.added.map((entry) =>
              el('li', { class: 'scalar-tool-diff-op' }, [
                el('div', { class: 'scalar-tool-mcp-head' }, [badge('info'), ...route(entry)]),
              ]),
            ),
          ),
        )
      }
      const schemaNotes = [
        ...diff.schemas.added.map((name) => `Schema ${name} added`),
        ...diff.schemas.removed.map((name) => `Schema ${name} removed`),
      ]
      if (schemaNotes.length) {
        report.append(
          el('h3', { class: 'scalar-tool-section-title', text: 'Component schemas' }),
          el(
            'ul',
            { class: 'scalar-tool-notes' },
            schemaNotes.map((text) => el('li', { text })),
          ),
        )
      }
    }

    const app = el('div', { class: 'scalar-tool-app' }, [
      el('div', { class: 'scalar-tool-toolbar' }, [
        el('span', {
          class: 'scalar-tool-privacy',
          text: 'Runs in your browser. Your documents never leave your browser.',
        }),
        el('div', { class: 'scalar-tool-actions' }, [
          createShareButton(
            () => ({ a: before.getValue(), b: after.getValue() }),
            (text) => (message.textContent = text),
          ),
          copyReport,
        ]),
      ]),
      el('div', { class: 'scalar-tool-grid' }, [before.node, after.node]),
      message,
      el('div', { class: 'scalar-tool-panel scalar-tool-panel-wide' }, [
        el('div', { class: 'scalar-tool-panel-header' }, [
          el('span', { class: 'scalar-tool-panel-title', text: 'Changes' }),
        ]),
        summary,
        report,
      ]),
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

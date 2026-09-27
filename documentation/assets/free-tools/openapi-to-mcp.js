/*
 * OpenAPI to MCP preview widget for /tools/openapi-to-mcp.
 *
 * Shows the MCP tools an OpenAPI document maps to and install snippets for a
 * hosted server. Progressive enhancement over the static fallback in
 * [data-scalar-tool="openapi-to-mcp"]. Classic script, modules via import().
 */
;(() => {
  const TOOL = 'openapi-to-mcp'
  const REGISTER_URL = 'https://dashboard.scalar.com/register'
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
      load('openapi-to-mcp-core.js'),
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

    const SAMPLE = core.SAMPLE_DOCUMENT

    const sharedState = await readSharedState()
    let libraries
    let lastPreview

    const message = el('p', { class: 'scalar-tool-hint' })
    const summary = el('div', { class: 'scalar-tool-summary', role: 'status', 'aria-live': 'polite' })
    const toolList = el('ul', { class: 'scalar-tool-mcp-list' })
    const skipped = el('p', { class: 'scalar-tool-hint' })

    const editor = createEditor({
      id: `${TOOL}-input`,
      label: 'Your OpenAPI document',
      value: typeof sharedState?.d === 'string' ? sharedState.d : SAMPLE,
      sample: SAMPLE,
      onChange: debounce(() => run(), 300),
    })

    const copyJson = button('Copy tools/list JSON', async () => {
      if (lastPreview) {
        const json = JSON.stringify(core.toToolsListResult(lastPreview.tools), null, 2)
        flash(copyJson, (await copyText(json)) ? 'Copied' : 'Copy failed')
      }
    })

    /* Install snippets, one tab per client. */
    const snippetCode = el('pre', { class: 'scalar-tool-code scalar-tool-code-short', tabindex: '0' })
    const snippetHint = el('p', { class: 'scalar-tool-hint' })
    const clients = [
      ['claudeCode', 'Claude Code', 'Run in your terminal.'],
      ['claudeApp', 'Claude app', 'Customize → Connectors → “+” → Add custom connector, then paste the URL.'],
      ['cursor', 'Cursor', 'Add to .cursor/mcp.json in your project, or ~/.cursor/mcp.json for every project.'],
      ['vscode', 'VS Code', 'Add to .vscode/mcp.json in your workspace.'],
    ]
    let activeClient = 'claudeCode'
    const tabs = clients.map(([key, label]) => {
      const tab = el('button', {
        type: 'button',
        role: 'tab',
        class: 'scalar-tool-tab',
        text: label,
        onClick: () => {
          activeClient = key
          renderSnippet()
        },
      })
      tab.dataset.key = key
      return tab
    })
    const copySnippet = button('Copy', async () =>
      flash(copySnippet, (await copyText(snippetCode.textContent)) ? 'Copied' : 'Copy failed'),
    )

    const renderSnippet = () => {
      const snippets = lastPreview?.snippets ?? core.installSnippets('my-api')
      const value = activeClient === 'claudeApp' ? core.PLACEHOLDER_URL : snippets[activeClient]
      snippetCode.textContent = value
      snippetHint.textContent = clients.find(([key]) => key === activeClient)[2]
      tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.key === activeClient)))
    }

    const renderTool = (tool) => {
      const [method, ...rest] = tool._operation.split(' ')
      const properties = Object.keys(tool.inputSchema.properties)
      const required = new Set(tool.inputSchema.required ?? [])
      return el('li', { class: 'scalar-tool-mcp-tool' }, [
        el('div', { class: 'scalar-tool-mcp-head' }, [
          el('code', { class: 'scalar-tool-mcp-name', text: tool.name }),
          el('span', { class: `scalar-tool-method scalar-tool-method-${method.toLowerCase()}`, text: method }),
          el('code', { class: 'scalar-tool-mcp-path', text: rest.join(' ') }),
        ]),
        el('p', { class: 'scalar-tool-mcp-description', text: tool.description }),
        el(
          'p',
          { class: 'scalar-tool-mcp-args' },
          properties.length
            ? [
                'Arguments: ',
                ...properties.flatMap((name, index) => [
                  index ? ', ' : '',
                  el('code', { text: required.has(name) ? `${name}*` : name }),
                ]),
              ]
            : ['No arguments'],
        ),
        el('details', { class: 'scalar-tool-details' }, [
          el('summary', { text: 'Input schema' }),
          el('pre', {
            class: 'scalar-tool-code scalar-tool-code-short',
            text: JSON.stringify(tool.inputSchema, null, 2),
          }),
        ]),
      ])
    }

    const run = () => {
      if (!libraries) {
        return
      }
      toolList.replaceChildren()
      skipped.textContent = ''
      const parsed = shared.parseText(editor.getValue(), libraries.YAML)
      if (!parsed.ok) {
        lastPreview = undefined
        summary.dataset.state = editor.getValue().trim() ? 'invalid' : 'empty'
        summary.textContent = parsed.error.line
          ? `${parsed.error.message} (line ${parsed.error.line})`
          : parsed.error.message
        renderSnippet()
        return
      }
      const preview = core.previewMcpServer(parsed.value, libraries)
      if (!preview.ok) {
        lastPreview = undefined
        summary.dataset.state = 'invalid'
        summary.textContent = preview.error
        renderSnippet()
        return
      }
      lastPreview = preview
      const count = preview.tools.length
      summary.dataset.state = count ? 'valid' : 'empty'
      summary.textContent = count
        ? `${preview.title}: ${count} tool${count === 1 ? '' : 's'} from ${count} operation${count === 1 ? '' : 's'}.`
        : `${preview.title} has no operations yet, so there are no tools to show.`
      toolList.append(...preview.tools.map(renderTool))
      if (preview.skipped.length) {
        skipped.textContent = `Skipped: ${preview.skipped.join(', ')}.`
      }
      renderSnippet()
    }

    const app = el('div', { class: 'scalar-tool-app' }, [
      el('div', { class: 'scalar-tool-toolbar' }, [
        el('span', {
          class: 'scalar-tool-privacy',
          text: 'Runs in your browser. Your document never leaves your browser.',
        }),
        el('div', { class: 'scalar-tool-actions' }, [
          createShareButton(
            () => ({ d: editor.getValue() }),
            (text) => (message.textContent = text),
          ),
          copyJson,
        ]),
      ]),
      el('div', { class: 'scalar-tool-grid' }, [
        editor.node,
        el('div', { class: 'scalar-tool-panel' }, [
          el('div', { class: 'scalar-tool-panel-header' }, [
            el('span', { class: 'scalar-tool-panel-title', text: 'MCP tools preview' }),
          ]),
          summary,
          toolList,
          skipped,
        ]),
      ]),
      message,
      el('div', { class: 'scalar-tool-install' }, [
        el('div', { class: 'scalar-tool-panel-header' }, [
          el('span', { class: 'scalar-tool-panel-title', text: 'Install snippets (placeholder URL)' }),
          el('div', { class: 'scalar-tool-actions' }, [copySnippet]),
        ]),
        el('div', { class: 'scalar-tool-tabs', role: 'tablist', 'aria-label': 'MCP client' }, tabs),
        snippetCode,
        snippetHint,
        el('p', { class: 'scalar-tool-hint' }, [
          'YOUR_INSTALL_ID is a placeholder. Scalar gives you the real URL when you create an installation in the dashboard. ',
          'Private servers ask you to sign in with OAuth, or accept a Scalar personal access token (see the ',
          el('a', { href: '/products/agent/mcp', text: 'MCP docs' }),
          ').',
        ]),
        el('div', { class: 'scalar-tool-cta' }, [
          el('a', {
            class: 't-editor__button button__primary',
            href: REGISTER_URL,
            text: 'Host this MCP server on Scalar',
          }),
        ]),
      ]),
    ])

    summary.textContent = 'Loading the OpenAPI parser…'
    renderSnippet()
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

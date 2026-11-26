/**
 * Renders the mdast-shaped tree to HTML. Every element goes through the
 * `Writer`, so the tag allowlist applies to Markdown output as well as raw HTML.
 */
import type { Block, ListItem, NodeData, Root } from './blocks'
import {
  type Highlighter,
  Writer,
  escapeAttr,
  escapeText,
  highlightSafely,
  isExternal,
  isSafeUrl,
  sanitizeAttributes,
} from './html'
import { type Inline, normalizeUri } from './inline'

export type RenderOptions = {
  tags: Set<string>
  /** Without a highlighter, code blocks keep only their `language-*` class. */
  highlight?: Highlighter
  /** Extra class for highlighted `<code>` elements, such as `custom-scroll`. */
  codeClassName?: string
  /** Parses text found inside raw HTML tags such as `<p>`, or returns `null` to keep it as text. */
  inlineInHtml: (text: string) => Inline[] | null
  unsafe?: boolean
}

const ALERTS = new Set(['note', 'tip', 'important', 'warning', 'caution', 'success'])

type Ctx = {
  w: Writer
  o: RenderOptions
  /** Footnote id → [number, reference count], in order of first reference. */
  fn: Map<string, [number, number]>
  root: Root
}

const attr = (name: string, value: string | null | undefined): string =>
  value === null || value === undefined ? '' : ` ${name}="${escapeAttr(value)}"`

/** hast property names that differ from their attribute, beyond the `aria-*` and `data-*` camel case. */
const PROPERTY_NAMES: Record<string, string> = { className: 'class', htmlFor: 'for' }

/**
 * The element a node renders as, after the `data.hName` and `data.hProperties`
 * a `transform` callback set on it, the way `mdast-util-to-hast` reads them.
 * The properties go through the same allowlist as raw HTML, as they went
 * through `rehype-sanitize` before.
 */
const element = (node: { data?: NodeData }, tag: string): [tag: string, attrs: string] => {
  const data = node.data
  if (!data) return [tag, '']
  const name = typeof data.hName === 'string' ? data.hName.toLowerCase() : tag
  const attrs: [string, string | null][] = []
  for (const [key, value] of Object.entries(data.hProperties ?? {})) {
    if (value === undefined || value === null || value === false) continue
    const attr =
      PROPERTY_NAMES[key] ?? (/^(aria|data)[A-Z]/.test(key) ? key.replace(/[A-Z]/g, (c) => `-${c}`) : key).toLowerCase()
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    // Property values are text, so `&` is literal. Raw HTML keeps its references, which is all the writer escapes for.
    attrs.push([attr, value === true ? null : text.replace(/&/g, '&amp;')])
  }
  return [name, sanitizeAttributes(name, attrs)]
}

const inlines = (nodes: Inline[], c: Ctx): void => {
  const { w } = c
  for (const n of nodes) {
    switch (n.type) {
      case 'text':
        w.text(escapeText(n.value))
        break
      case 'emphasis':
      case 'strong':
      case 'delete': {
        const id = w.open(n.type === 'emphasis' ? 'em' : n.type === 'strong' ? 'strong' : 'del')
        inlines(n.children, c)
        w.close(id)
        break
      }
      case 'inlineCode': {
        const id = w.open('code')
        w.text(escapeText(n.value))
        w.close(id)
        break
      }
      case 'break':
        w.open('br')
        w.newline()
        break
      case 'html':
        w.raw(n.value)
        break
      case 'link': {
        const safe = c.o.unsafe || isSafeUrl(n.url, 'href', true)
        const external = safe && !c.o.unsafe && isExternal(n.url, true) ? ' rel="nofollow" target="_blank"' : ''
        const id = w.open('a', (safe ? attr('href', n.url) : '') + attr('title', n.title) + external)
        inlines(n.children, c)
        w.close(id)
        break
      }
      case 'image': {
        const src = isSafeUrl(n.url, 'src', true) ? attr('src', n.url) : ''
        w.open('img', src + attr('alt', n.alt) + attr('title', n.title))
        break
      }
      case 'footnoteReference': {
        const entry = c.fn.get(n.identifier) ?? [c.fn.size + 1, 0]
        entry[1]++
        c.fn.set(n.identifier, entry)
        const safe = escapeAttr(normalizeUri(n.identifier.toLowerCase()))
        const suffix = entry[1] > 1 ? `-${entry[1]}` : ''
        const sup = w.open('sup')
        const a = w.open(
          'a',
          ` href="#user-content-fn-${safe}" id="user-content-fnref-${safe}${suffix}" data-footnote-ref="" aria-describedby="footnote-label"`,
        )
        w.text(String(entry[0]))
        w.close(a)
        w.close(sup)
        break
      }
    }
  }
}

/** GitHub alerts, matching the `rehypeAlert` plugin: a root-level `> [!NOTE]` blockquote. */
const renderAlert = (node: Block & { type: 'blockquote' }, c: Ctx): boolean => {
  const head = node.children[0]
  if (head?.type !== 'paragraph') return false
  const text = head.children[0]
  if (text?.type !== 'text' || !text.value.startsWith('[!')) return false
  const end = text.value.indexOf(']')
  if (end === -1) return false
  const kind = text.value.slice(2, end).toLowerCase()
  if (!ALERTS.has(kind)) return false

  let rest: (Block | Inline)[]
  if (end + 1 === text.value.length) {
    const next = head.children[1]
    if (next) {
      if (next.type !== 'break' || !head.children[2]) return false
      const after = head.children.slice(2)
      const first = after[0]
      if (first?.type === 'text' && first.value.startsWith('\n')) after[0] = { ...first, value: first.value.slice(1) }
      rest = [...after, ...node.children.slice(1)]
    } else {
      if (node.children.length < 2) return false
      rest = node.children.slice(1)
    }
  } else {
    const value =
      text.value[end + 1] === '\n' && (end + 2 === text.value.length || /\S/.test(text.value.slice(end + 2)))
        ? text.value.slice(end + 2)
        : text.value.replace(/^\s*\[!.*?\]\s*/, '')
    rest = [{ ...text, value }, ...head.children.slice(1), ...node.children.slice(1)]
  }

  const { w } = c
  const outer = w.open('div', ` class="markdown-alert markdown-alert-${kind}"`)
  w.close(w.open('div', ' class="markdown-alert-icon"'))
  const content = w.open('div', ' class="markdown-alert-content"')
  w.text(' ')
  // Paragraphs are unwrapped into the content, as the current plugin does. The hast tree keeps a
  // newline after each block, which renders as the space between unwrapped paragraphs.
  let afterInline = false
  for (const n of rest) {
    if (!('position' in n)) {
      inlines([n as Inline], c)
      afterInline = true
      continue
    }
    if (afterInline) w.text('\n')
    if (n.type === 'paragraph') inlines(n.children, c)
    else block(n as Block, c, false)
    w.text('\n')
    afterInline = false
  }
  if (afterInline) w.text('\n')
  w.close(content)
  w.close(outer)
  w.newline()
  return true
}

const listItem = (item: ListItem, c: Ctx, tight: boolean): void => {
  const { w } = c
  const li = w.open('li', item.checked === null ? '' : ' class="task-list-item"')
  let first = true
  if (!tight) w.newline()
  for (const child of item.children) {
    const task = first && item.checked !== null && child.type === 'paragraph'
    if (child.type === 'paragraph' && tight) {
      if (!first) w.newline()
      if (task) {
        w.open('input', item.checked ? ' type="checkbox" checked disabled' : ' type="checkbox" disabled')
        w.text(' ')
      }
      inlines(child.children, c)
    } else if (task) {
      const p = w.open('p')
      w.open('input', item.checked ? ' type="checkbox" checked disabled' : ' type="checkbox" disabled')
      w.text(' ')
      inlines(child.children, c)
      w.close(p)
      w.newline()
    } else {
      if (tight && !first) w.newline()
      block(child, c, false)
    }
    first = false
  }
  w.close(li)
  w.newline()
}

const block = (node: Block, c: Ctx, atRoot: boolean): void => {
  const { w } = c
  switch (node.type) {
    case 'paragraph': {
      const p = w.open(...element(node, 'p'))
      inlines(node.children, c)
      w.close(p)
      w.newline()
      return
    }
    case 'heading': {
      const h = w.open(...element(node, `h${node.depth}`))
      inlines(node.children, c)
      w.close(h)
      w.newline()
      return
    }
    case 'thematicBreak':
      w.open('hr')
      w.newline()
      return
    case 'blockquote': {
      if (atRoot && renderAlert(node, c)) return
      const q = w.open(...element(node, 'blockquote'))
      w.newline()
      for (const child of node.children) block(child, c, false)
      w.close(q)
      w.newline()
      return
    }
    case 'list': {
      const task = node.children.some((i) => i.checked !== null)
      const start = node.ordered && node.start !== 1 ? ` start="${node.start}"` : ''
      const l = w.open(node.ordered ? 'ol' : 'ul', start + (task ? ' class="contains-task-list"' : ''))
      w.newline()
      for (const item of node.children) listItem(item, c, !node.spread)
      w.close(l)
      w.newline()
      return
    }
    case 'code': {
      // The class takes the first word only, as today: a decoded `&#x0C;` or tab ends it.
      const lang = node.lang?.split(/[\t\n\f\r ]/)[0] || null
      const text = node.value ? node.value + '\n' : ''
      const pre = w.open('pre')
      // `no-highlight` opts a block out entirely, the way highlight.js reads it.
      if (!c.o.highlight || lang === 'no-highlight') {
        const code = w.open('code', lang ? ` class="language-${escapeAttr(lang)}"` : '')
        w.text(escapeText(text))
        w.close(code)
      } else {
        // Unlabelled blocks still get the classes, so they share the look of every
        // other code block and only lose the colours. There is no language detection.
        const classes = ['hljs', lang ? `language-${escapeAttr(lang)}` : '', c.o.codeClassName ?? '']
        const code = w.open('code', ` class="${classes.filter(Boolean).join(' ')}"`)
        w.text((lang && highlightSafely(c.o.highlight, text, lang)) || escapeText(text))
        w.close(code)
      }
      w.close(pre)
      w.newline()
      return
    }
    case 'html':
      w.raw(node.value)
      w.newline()
      return
    case 'table': {
      const [head, ...body] = node.children
      const t = w.open(...element(node, 'table'))
      w.newline()
      const thead = w.open('thead')
      w.newline()
      tableRow(head!, 'th', node.align, c)
      w.close(thead)
      w.newline()
      if (body.length) {
        const tbody = w.open('tbody')
        w.newline()
        for (const row of body) tableRow(row, 'td', node.align, c)
        w.close(tbody)
        w.newline()
      }
      w.close(t)
      w.newline()
      return
    }
    case 'footnoteDefinition':
      return
  }
}

const tableRow = (
  row: { children: { children: Inline[] }[] },
  cell: 'th' | 'td',
  align: (string | null)[],
  c: Ctx,
): void => {
  const { w } = c
  const tr = w.open('tr')
  w.newline()
  row.children.forEach((col, i) => {
    const id = w.open(cell, attr('align', align[i]))
    inlines(col.children, c)
    w.close(id)
    w.newline()
  })
  w.close(tr)
  w.newline()
}

const footnoteSection = (c: Ctx): void => {
  if (c.fn.size === 0) return
  const { w } = c
  const section = w.open('section', ' data-footnotes="" class="footnotes"')
  const h2 = w.open('h2', ' class="sr-only" id="footnote-label"')
  w.text('Footnotes')
  w.close(h2)
  w.newline()
  const ol = w.open('ol')
  w.newline()
  // Entries added while rendering a definition (a call inside it) are visited too, like `footnoteOrder`.
  for (const [identifier, [number]] of c.fn) {
    const def = c.root.footnotes.get(identifier)
    if (!def) continue
    const safe = escapeAttr(normalizeUri(identifier.toLowerCase()))
    const li = w.open('li', ` id="user-content-fn-${safe}"`)
    w.newline()
    const backrefs = (): void => {
      // Read after the content: a call inside the definition itself counts too.
      const count = c.fn.get(identifier)![1]
      for (let k = 1; k <= count; k++) {
        w.text(' ')
        const a = w.open(
          'a',
          ` href="#user-content-fnref-${safe}${k > 1 ? `-${k}` : ''}" data-footnote-backref="" aria-label="Back to reference ${number}${k > 1 ? `-${k}` : ''}" class="data-footnote-backref"`,
        )
        w.text('↩')
        if (k > 1) {
          const sup = w.open('sup')
          w.text(String(k))
          w.close(sup)
        }
        w.close(a)
      }
    }
    const last = def.children.at(-1)
    def.children.forEach((child) => {
      if (child === last && child.type === 'paragraph') {
        const p = w.open('p')
        inlines(child.children, c)
        backrefs()
        w.close(p)
        w.newline()
      } else block(child, c, false)
    })
    if (last?.type !== 'paragraph') backrefs()
    w.close(li)
    w.newline()
  }
  w.close(ol)
  w.newline()
  w.close(section)
  w.newline()
}

export const render = (root: Root, o: RenderOptions): string => {
  const c: Ctx = { w: null as unknown as Writer, o, fn: new Map(), root }
  c.w = new Writer({
    tags: o.tags,
    highlight: o.highlight,
    codeClassName: o.codeClassName,
    unsafe: o.unsafe,
    inline: (text, w) => {
      const nodes = o.inlineInHtml(text)
      if (!nodes) return false
      const prev = c.w
      c.w = w
      inlines(nodes, c)
      c.w = prev
      return true
    },
  })
  for (const node of root.children) block(node, c, true)
  footnoteSection(c)
  return c.w.finish()
}

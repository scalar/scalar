/**
 * Renders the mdast-shaped tree to HTML. Every element goes through the
 * `Writer`, so the tag allowlist applies to Markdown output as well as raw HTML.
 */
import type { Block, ListItem, Root } from './blocks'
import { Writer, escapeAttr, escapeText, isSafeUrl } from './html'
import type { Inline, InlineParser } from './inline'

export type Highlighter = (code: string, lang: string | null) => { html: string; lang?: string } | null | undefined

export type RenderOptions = {
  tags: Set<string>
  highlight?: Highlighter
  /** Parses text found inside raw HTML tags such as `<p>`. */
  inlineInHtml: InlineParser
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
        w.text('\n')
        break
      case 'html':
        w.raw(n.value)
        break
      case 'link': {
        const href = c.o.unsafe || isSafeUrl(n.url, 'href') ? attr('href', n.url) : ''
        const id = w.open('a', href + attr('title', n.title))
        inlines(n.children, c)
        w.close(id)
        break
      }
      case 'image': {
        const src = isSafeUrl(n.url, 'src') ? attr('src', n.url) : ''
        w.open('img', src + attr('alt', n.alt) + attr('title', n.title))
        break
      }
      case 'footnoteReference': {
        const entry = c.fn.get(n.identifier) ?? [c.fn.size + 1, 0]
        entry[1]++
        c.fn.set(n.identifier, entry)
        const safe = encodeURIComponent(n.identifier.toLowerCase())
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
  // Paragraphs are unwrapped into the content, as the current plugin does.
  for (const n of rest) {
    if (n.type === 'paragraph') inlines(n.children, c)
    else if ('position' in n) block(n as Block, c, false, false)
    else inlines([n as Inline], c)
  }
  w.close(content)
  w.close(outer)
  w.text('\n')
  return true
}

const listItem = (item: ListItem, c: Ctx, tight: boolean): void => {
  const { w } = c
  const li = w.open('li', item.checked === null ? '' : ' class="task-list-item"')
  let first = true
  if (!tight) w.text('\n')
  for (const child of item.children) {
    const task = first && item.checked !== null && child.type === 'paragraph'
    if (child.type === 'paragraph' && tight) {
      if (!first) w.text('\n')
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
      w.text('\n')
    } else {
      if (tight && !first) w.text('\n')
      block(child, c, false, tight)
    }
    first = false
  }
  w.close(li)
  w.text('\n')
}

const block = (node: Block, c: Ctx, atRoot: boolean, tight: boolean): void => {
  const { w } = c
  switch (node.type) {
    case 'paragraph': {
      const p = w.open('p')
      inlines(node.children, c)
      w.close(p)
      w.text('\n')
      return
    }
    case 'heading': {
      const id = node.data?.hProperties?.id
      const h = w.open(`h${node.depth}`, typeof id === 'string' ? attr('id', id) : '')
      inlines(node.children, c)
      w.close(h)
      w.text('\n')
      return
    }
    case 'thematicBreak':
      w.open('hr')
      w.text('\n')
      return
    case 'blockquote': {
      if (atRoot && renderAlert(node, c)) return
      const q = w.open('blockquote')
      w.text('\n')
      for (const child of node.children) block(child, c, false, false)
      w.close(q)
      w.text('\n')
      return
    }
    case 'list': {
      const task = node.children.some((i) => i.checked !== null)
      const start = node.ordered && node.start !== 1 ? ` start="${node.start}"` : ''
      const l = w.open(node.ordered ? 'ol' : 'ul', start + (task ? ' class="contains-task-list"' : ''))
      w.text('\n')
      for (const item of node.children) listItem(item, c, !node.spread)
      w.close(l)
      w.text('\n')
      return
    }
    case 'code': {
      const lang = node.lang
      const highlighted = c.o.highlight?.(node.value, lang)
      const pre = w.open('pre')
      if (highlighted) {
        const name = highlighted.lang ?? lang
        const code = w.open('code', ` class="hljs${name ? ` language-${escapeAttr(name)}` : ''} custom-scroll"`)
        w.text(highlighted.html)
        w.close(code)
      } else {
        const code = w.open('code', lang ? ` class="language-${escapeAttr(lang)}"` : '')
        w.text(escapeText(node.value ? node.value + '\n' : ''))
        w.close(code)
      }
      w.close(pre)
      w.text('\n')
      return
    }
    case 'html':
      w.raw(node.value)
      w.text('\n')
      return
    case 'table': {
      const [head, ...body] = node.children
      const t = w.open('table')
      w.text('\n')
      const thead = w.open('thead')
      w.text('\n')
      tableRow(head!, 'th', node.align, c)
      w.close(thead)
      w.text('\n')
      if (body.length) {
        const tbody = w.open('tbody')
        w.text('\n')
        for (const row of body) tableRow(row, 'td', node.align, c)
        w.close(tbody)
        w.text('\n')
      }
      w.close(t)
      w.text('\n')
      return
    }
    case 'footnoteDefinition':
      return
  }
  void tight
}

const tableRow = (
  row: { children: { children: Inline[] }[] },
  cell: 'th' | 'td',
  align: (string | null)[],
  c: Ctx,
): void => {
  const { w } = c
  const tr = w.open('tr')
  w.text('\n')
  row.children.forEach((col, i) => {
    const id = w.open(cell, attr('align', align[i]))
    inlines(col.children, c)
    w.close(id)
    w.text('\n')
  })
  w.close(tr)
  w.text('\n')
}

const footnoteSection = (c: Ctx): void => {
  if (c.fn.size === 0) return
  const { w } = c
  const section = w.open('section', ' data-footnotes="" class="footnotes"')
  const h2 = w.open('h2', ' class="sr-only" id="footnote-label"')
  w.text('Footnotes')
  w.close(h2)
  w.text('\n')
  const ol = w.open('ol')
  w.text('\n')
  for (const [identifier, [, count]] of c.fn) {
    const def = c.root.footnotes.get(identifier)
    if (!def) continue
    const safe = encodeURIComponent(identifier.toLowerCase())
    const li = w.open('li', ` id="user-content-fn-${safe}"`)
    w.text('\n')
    const backrefs = (): void => {
      for (let k = 1; k <= count; k++) {
        w.text(' ')
        const a = w.open(
          'a',
          ` href="#user-content-fnref-${safe}${k > 1 ? `-${k}` : ''}" data-footnote-backref="" aria-label="Back to reference ${k}" class="data-footnote-backref"`,
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
        w.text('\n')
      } else block(child, c, false, false)
    })
    if (last?.type !== 'paragraph') backrefs()
    w.close(li)
    w.text('\n')
  }
  w.close(ol)
  w.text('\n')
  w.close(section)
  w.text('\n')
}

export const render = (root: Root, o: RenderOptions): string => {
  const c: Ctx = { w: null as unknown as Writer, o, fn: new Map(), root }
  c.w = new Writer({
    tags: o.tags,
    unsafe: o.unsafe,
    inline: (text, w) => {
      const prev = c.w
      c.w = w
      inlines(o.inlineInHtml.parse(text), c)
      c.w = prev
    },
  })
  for (const node of root.children) block(node, c, true, false)
  footnoteSection(c)
  return c.w.finish()
}

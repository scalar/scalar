/**
 * HTML to mdast, ported from `hast-util-to-mdast` (what `rehype-remark` runs, with its `document`
 * option on) for the elements the sanitizer allows. Other elements cannot reach it: `parseHtml`
 * removes them, as `rehype-sanitize` did.
 */
import type {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Nodes,
  Paragraph,
  Parents,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
} from 'mdast'

import { trimEnd, trimStart } from '../pipeline/text'
import {
  type HastElement,
  type HastNode,
  type HastParent,
  isPhrasingElement,
  isWhitespace,
  minifyWhitespace,
  parseHtml,
  toText,
} from './hast'

type State = { inTable: boolean; qNesting: number }
type Result = Nodes | Nodes[] | undefined
type Handler = (state: State, node: HastElement) => Result

/** `mdast-util-phrasing`. */
const PHRASING = new Set([
  'break',
  'delete',
  'emphasis',
  'footnote',
  'footnoteReference',
  'image',
  'imageReference',
  'inlineCode',
  'inlineMath',
  'link',
  'linkReference',
  'strong',
  'text',
])
const isPhrasing = (node: Nodes): boolean => PHRASING.has(node.type)

const all = (state: State, parent: HastParent): Nodes[] => {
  const results: Nodes[] = []
  for (const child of parent.children) {
    const result = one(state, child)
    if (Array.isArray(result)) {
      for (const node of result) results.push(node)
    } else if (result) results.push(result)
  }
  return results
}

const one = (state: State, node: HastNode): Result => {
  if (node.type === 'text') return { type: 'text', value: node.value }
  const handler = Object.hasOwn(HANDLERS, node.tagName) ? HANDLERS[node.tagName] : undefined
  return handler ? handler(state, node) || undefined : all(state, node)
}

/** Without the hard breaks at either end, which would serialize as stray backslashes. */
const dropSurroundingBreaks = <T extends Nodes>(nodes: T[]): T[] => {
  let start = 0
  let end = nodes.length
  while (start < end && nodes[start]!.type === 'break') start++
  while (end > start && nodes[end - 1]!.type === 'break') end--
  return start === 0 && end === nodes.length ? nodes : nodes.slice(start, end)
}

const wrapNeeded = (nodes: Nodes[]): boolean =>
  nodes.some((node) => !isPhrasing(node) || ('children' in node && wrapNeeded(node.children)))

/** Splits a link or deletion around the blocks inside it, so each block gets its own copy of it. */
const split = (node: Link | Delete): Nodes[] =>
  runs(
    node.children,
    (nodes) => [{ ...node, children: nodes as PhrasingContent[] }],
    (child) => {
      if ('children' in child) {
        const inner = { ...node, children: child.children as PhrasingContent[] }
        return { ...child, children: [inner] } as Nodes
      }
      return { ...child }
    },
  )

const flatten = (nodes: Nodes[]): Nodes[] => {
  const flattened: Nodes[] = []
  for (const node of nodes) {
    if ((node.type === 'delete' || node.type === 'link') && wrapNeeded(node.children)) {
      for (const part of split(node)) flattened.push(part)
    } else flattened.push(node)
  }
  return flattened
}

const runs = (
  nodes: Nodes[],
  onPhrasing: (nodes: Nodes[]) => Nodes[],
  onNonPhrasing: (node: Nodes) => Nodes,
): Nodes[] => {
  const result: Nodes[] = []
  let queue: Nodes[] = []
  for (const node of flatten(nodes)) {
    if (isPhrasing(node)) queue.push(node)
    else {
      if (queue.length > 0) {
        for (const part of onPhrasing(queue)) result.push(part)
        queue = []
      }
      result.push(onNonPhrasing(node))
    }
  }
  if (queue.length > 0) for (const part of onPhrasing(queue)) result.push(part)
  return result
}

/** Wraps runs of inline content in paragraphs, so the result is flow content. */
const wrap = (nodes: Nodes[]): RootContent[] =>
  runs(
    nodes,
    (phrasing) =>
      phrasing.every((node) => node.type === 'text' && isWhitespace(node.value))
        ? []
        : [{ type: 'paragraph', children: dropSurroundingBreaks(phrasing) as PhrasingContent[] }],
    (node) => node,
  ) as RootContent[]

/** Puts every node that is not of the built type into one of that type, as tables and lists need. */
const toSpecificContent = <T extends ListItem | TableRow | TableCell>(nodes: Nodes[], build: () => T): T[] => {
  const type = build().type
  const results: T[] = []
  let queue: Nodes[] = []
  for (const node of nodes) {
    if (node.type === type) {
      const expected = node as T
      if (queue.length > 0) {
        ;(expected.children as Nodes[]).unshift(...queue)
        queue = []
      }
      results.push(expected)
    } else queue.push(node)
  }
  if (queue.length > 0) {
    let node = results.at(-1)
    if (!node) {
      node = build()
      results.push(node)
    }
    for (const child of queue) (node.children as Nodes[]).push(child)
  }
  return results
}

const listItemsSpread = (children: ListItem[]): boolean => children.length > 1 && children.some((child) => child.spread)

const createListItem = (): ListItem => ({ type: 'listItem', spread: false, checked: null, children: [] })
const createRow = (): TableRow => ({ type: 'tableRow', children: [] })
const createCell = (): TableCell => ({ type: 'tableCell', children: [] })

/** A property as `hast-util-from-parse5` types it: numeric attributes become numbers when they are numbers. */
const numberProperty = (value: string | undefined): number | string | undefined =>
  value && !Number.isNaN(Number(value)) ? Number(value) : value

const flow: Handler = (state, node) => wrap(all(state, node))
const ignore: Handler = () => undefined
const children: Handler = (state, node) => all(state, node)

const a: Handler = (state, node): Link => ({
  type: 'link',
  url: node.properties.href || '',
  title: node.properties.title ? node.properties.title : null,
  children: all(state, node) as PhrasingContent[],
})

const blockquote: Handler = (state, node): Blockquote => ({
  type: 'blockquote',
  children: wrap(all(state, node)) as Blockquote['children'],
})

const code: Handler = (_, node): Code => {
  let lang: string | undefined
  if (node.tagName === 'pre') {
    const inner = node.children.find(
      (child): child is HastElement =>
        child.type === 'element' && child.tagName === 'code' && 'class' in child.properties,
    )
    lang = inner?.properties.class
      ?.split(/[ \t\n\f\r]+/)
      .find((name) => name.startsWith('language-'))
      ?.slice('language-'.length)
  }
  return { type: 'code', lang: lang || null, meta: null, value: trimEnd(toText(node), '\r\n') }
}

const inlineCode: Handler = (_, node): InlineCode => ({ type: 'inlineCode', value: toText(node) })

const del: Handler = (state, node): Delete => ({ type: 'delete', children: all(state, node) as PhrasingContent[] })
const em: Handler = (state, node): Emphasis => ({ type: 'emphasis', children: all(state, node) as PhrasingContent[] })
const strong: Handler = (state, node): Strong => ({ type: 'strong', children: all(state, node) as PhrasingContent[] })

const heading: Handler = (state, node): Heading => ({
  type: 'heading',
  depth: (Number(node.tagName.charAt(1)) || 1) as Heading['depth'],
  children: dropSurroundingBreaks(all(state, node)) as PhrasingContent[],
})

const img: Handler = (_, node): Image => ({
  type: 'image',
  url: node.properties.src || '',
  title: node.properties.title ? node.properties.title : null,
  alt: node.properties.alt ? node.properties.alt : '',
})

/** The sanitizer only lets disabled checkboxes through, which say nothing outside a task list item. */
const input: Handler = (_, node): Text | undefined => {
  const { properties } = node
  if ('disabled' in properties || properties.type === 'hidden' || properties.type === 'file') return undefined
  if (properties.type === 'checkbox' || properties.type === 'radio') {
    return { type: 'text', value: 'checked' in properties ? '[x]' : '[ ]' }
  }
  return undefined
}

/** A checkbox at the start of an item, or of its first paragraph, makes it a task list item. */
const extractLeadingCheckbox = (node: HastElement): { checkbox: HastElement | undefined; rest: HastElement } => {
  const head = node.children[0]
  if (
    head?.type === 'element' &&
    head.tagName === 'input' &&
    (head.properties.type === 'checkbox' || head.properties.type === 'radio')
  ) {
    return { checkbox: head, rest: { ...node, children: node.children.slice(1) } }
  }
  if (head?.type === 'element' && head.tagName === 'p') {
    const { checkbox, rest } = extractLeadingCheckbox(head)
    if (checkbox) return { checkbox, rest: { ...node, children: [rest, ...node.children.slice(1)] } }
  }
  return { checkbox: undefined, rest: node }
}

/** An item is spread when it holds a paragraph, or two blocks. */
const spreadout = (node: HastElement): boolean => {
  let seenFlow = false
  for (const child of node.children) {
    if (child.type !== 'element' || isPhrasingElement(child)) continue
    if (child.tagName === 'p' || seenFlow || spreadout(child)) return true
    seenFlow = true
  }
  return false
}

const li: Handler = (state, node): ListItem => {
  const { rest, checkbox } = extractLeadingCheckbox(node)
  return {
    type: 'listItem',
    spread: spreadout(rest),
    checked: checkbox ? 'checked' in checkbox.properties : null,
    children: wrap(all(state, rest)) as ListItem['children'],
  }
}

const list: Handler = (state, node): List => {
  const ordered = node.tagName === 'ol'
  const items = toSpecificContent(all(state, node), createListItem)
  const start = numberProperty(node.properties.start)
  return {
    type: 'list',
    ordered,
    start: ordered ? (start ? Number.parseInt(String(start), 10) : 1) : null,
    spread: listItemsSpread(items),
    children: items,
  }
}

/** Groups of terms and their descriptions become one list item each. */
const dl: Handler = (state, node): List | undefined => {
  const clean: HastNode[] = []
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'div') clean.push(...child.children)
    else clean.push(child)
  }
  const groups: { titles: HastNode[]; definitions: HastNode[] }[] = []
  let group: { titles: HastNode[]; definitions: HastNode[] } = { titles: [], definitions: [] }
  clean.forEach((child, index) => {
    if (child.type === 'element' && child.tagName === 'dt') {
      const previous = clean[index - 1]
      if (previous?.type === 'element' && previous.tagName === 'dd') {
        groups.push(group)
        group = { titles: [], definitions: [] }
      }
      group.titles.push(child)
    } else group.definitions.push(child)
  })
  groups.push(group)
  const handle = (nodes: HastNode[]): Nodes[] => {
    const items = toSpecificContent(all(state, { type: 'root', children: nodes }), createListItem)
    if (items.length === 0) return []
    if (items.length === 1) return items[0]!.children
    return [{ type: 'list', ordered: false, start: null, spread: listItemsSpread(items), children: items }]
  }
  const content: ListItem[] = []
  for (const { titles, definitions } of groups) {
    const result = [...handle(titles), ...handle(definitions)]
    if (result.length > 0) {
      content.push({
        type: 'listItem',
        spread: result.length > 1,
        checked: null,
        children: result as ListItem['children'],
      })
    }
  }
  if (content.length === 0) return undefined
  return { type: 'list', ordered: false, start: null, spread: listItemsSpread(content), children: content }
}

const p: Handler = (state, node): Paragraph | undefined => {
  const nodes = dropSurroundingBreaks(all(state, node))
  return nodes.length > 0 ? { type: 'paragraph', children: nodes as PhrasingContent[] } : undefined
}

/** Quotation marks around the content, as the browser draws them. */
const q: Handler = (state, node): Nodes[] => {
  state.qNesting++
  const contents = all(state, node)
  state.qNesting--
  const head = contents[0]
  const tail = contents.at(-1)
  if (head?.type === 'text') head.value = `"${head.value}`
  else contents.unshift({ type: 'text', value: '"' })
  if (tail?.type === 'text') tail.value += '"'
  else contents.push({ type: 'text', value: '"' })
  return contents
}

const tableCell: Handler = (state, node): TableCell => {
  const result: TableCell = { type: 'tableCell', children: all(state, node) as PhrasingContent[] }
  const rowSpan = numberProperty(node.properties.rowspan)
  const colSpan = numberProperty(node.properties.colspan)
  if (rowSpan || colSpan) result.data = { rowSpan, colSpan } as TableCell['data']
  return result
}

const tableRow: Handler = (state, node): TableRow => ({
  type: 'tableRow',
  children: toSpecificContent(all(state, node), createCell),
})

/** The alignment of each column, from its first cell that has one, and whether there is a header row. */
const inspect = (node: HastElement): { align: Table['align'] & unknown[]; headless: boolean } => {
  const info = { align: [null] as Table['align'] & unknown[], headless: true }
  let rowIndex = 0
  let cellIndex = 0
  const visit = (parent: HastElement): void => {
    for (const child of parent.children) {
      if (child.type !== 'element') continue
      // A nested table is not part of this one.
      if (child.tagName === 'table') continue
      if (child.tagName === 'th' || child.tagName === 'td') {
        if (!info.align[cellIndex]) {
          const value = child.properties.align || null
          if (value === 'center' || value === 'left' || value === 'right' || value === null)
            info.align[cellIndex] = value
        }
        if (info.headless && rowIndex < 2 && child.tagName === 'th') info.headless = false
        cellIndex++
      } else if (child.tagName === 'thead') {
        info.headless = false
      } else if (child.tagName === 'tr') {
        rowIndex++
        cellIndex = 0
      }
      visit(child)
    }
  }
  visit(node)
  return info
}

const table: Handler = (state, node): Table | Text => {
  // GFM tables do not nest, so an inner table becomes its text.
  if (state.inTable) return { type: 'text', value: toText(node) }
  state.inTable = true
  const { align, headless } = inspect(node)
  const rows = toSpecificContent(all(state, node), createRow)
  if (headless) rows.unshift(createRow())
  for (const row of rows) row.children = toSpecificContent(row.children, createCell)
  let columns = 1
  rows.forEach((row, rowIndex) => {
    const cells = row.children
    // A plain loop: spans insert cells into this row while it runs, and those are visited too.
    for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
      const cell = cells[cellIndex]!
      if (!cell.data) continue
      const data = cell.data as { rowSpan?: unknown; colSpan?: unknown }
      const colSpan = Number.parseInt(String(data.colSpan), 10) || 1
      const rowSpan = Number.parseInt(String(data.rowSpan), 10) || 1
      // Spanned cells become empty cells, so the columns still line up.
      if (colSpan > 1 || rowSpan > 1) {
        for (let otherRow = rowIndex; otherRow < rowIndex + rowSpan && rows[otherRow]; otherRow++) {
          for (let column = cellIndex; column < cellIndex + colSpan; column++) {
            if (otherRow !== rowIndex || column !== cellIndex) {
              rows[otherRow]!.children.splice(column, 0, { type: 'tableCell', children: [] })
            }
          }
        }
      }
      delete cell.data
    }
    if (cells.length > columns) columns = cells.length
  })
  for (const row of rows) {
    while (row.children.length < columns) row.children.push({ type: 'tableCell', children: [] })
  }
  while (align.length < columns) align.push(null)
  state.inTable = false
  return { type: 'table', align, children: rows }
}

const HANDLERS: Record<string, Handler> = {
  a,
  b: strong,
  blockquote,
  br: () => ({ type: 'break' }),
  code: inlineCode,
  dd: li,
  del,
  details: children,
  div: flow,
  dl,
  dt: li,
  em,
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  h5: heading,
  h6: heading,
  hr: () => ({ type: 'thematicBreak' }),
  i: em,
  img,
  input,
  ins: children,
  kbd: inlineCode,
  li,
  ol: list,
  p,
  picture: flow,
  pre: code,
  q,
  rp: children,
  rt: children,
  ruby: children,
  s: del,
  samp: inlineCode,
  section: flow,
  source: ignore,
  span: children,
  strike: del,
  strong,
  sub: children,
  summary: p,
  sup: children,
  table,
  tbody: children,
  td: tableCell,
  tfoot: children,
  th: tableCell,
  thead: children,
  tr: tableRow,
  tt: inlineCode,
  ul: list,
  var: inlineCode,
}

/** The first line ending, with the spaces and tabs around it, becomes a bare line ending. */
const tidyLineEnding = (value: string): string => {
  const match = /\r?\n|\r/.exec(value)
  if (!match) return value
  const start = trimEnd(value.slice(0, match.index), '\t ').length
  const after = match.index + match[0].length
  const end = value.length - trimStart(value.slice(after), '\t ').length
  return value.slice(0, start) + match[0] + value.slice(end)
}

/** Merges adjacent text and trims it at the edges of paragraphs and headings, as `toMdast` does last. */
const tidy = (parent: Parents): void => {
  const nodes = parent.children as Nodes[]
  let index = 0
  while (index >= 0 && index < nodes.length) {
    const node = nodes[index]!
    if (node.type !== 'text') {
      if ('children' in node) tidy(node)
      index++
      continue
    }
    const previous = nodes[index - 1]
    if (previous?.type === 'text') {
      previous.value += node.value
      nodes.splice(index, 1)
      index--
      continue
    }
    node.value = tidyLineEnding(node.value)
    if (parent.type === 'heading' || parent.type === 'paragraph' || parent.type === 'root') {
      if (!index) node.value = trimStart(node.value, '\t ')
      if (index === nodes.length - 1) node.value = trimEnd(node.value, '\t ')
    }
    if (!node.value) {
      nodes.splice(index, 1)
      continue
    }
    index++
  }
}

/**
 * Converts an HTML fragment into a sanitized mdast tree.
 *
 * Meant for `htmlFromMarkdown` output: the HTML is sanitized with the same allowlist first, so
 * other HTML is safe too, but it is only parsed as well as a stack of open elements can.
 */
export const mdastFromHtml = (html: string): Root => {
  const tree = parseHtml(html)
  minifyWhitespace(tree)
  const root: Root = { type: 'root', children: wrap(all({ inTable: false, qNesting: 0 }, tree)) }
  tidy(root)
  return root
}

/**
 * mdast to GitHub Flavored Markdown, ported from `mdast-util-to-markdown` 2.1.2 and the GFM
 * extensions `remark-gfm` registers (`mdast-util-gfm-*`, `markdown-table`), with the defaults
 * `remark-stringify` uses. It handles the nodes the Copy as Markdown packages build or parse, and
 * the options they pass; anything else throws, as the original does for nodes it does not know.
 *
 * The escaping (`./unsafe`) is the security-relevant part: text must parse back to the same text,
 * never to emphasis, links or raw HTML. The output is byte for byte upstream's, except where
 * upstream's does not parse back, and can leave raw HTML behind: blocks inside inline content
 * (`inlineContent`), inline content in flow containers (`flowContent`), empty and adjacent code
 * spans (`codeSpans`), line endings in code spans,
 * URLs that start with `<`, line endings in titles, blank lines in text and upper case `HTTPS://`
 * (`./unsafe`), and tables and lists in tight lists (`joinDefaults`).
 */
import type {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  FootnoteDefinition,
  FootnoteReference,
  Heading,
  Html,
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

import { unescapeString } from '../pipeline/inline'
import { type ConstructName, UNSAFE, encodeCharacterReference, patternInScope, safe as safeFor } from './unsafe'

/** What the serializer exposes to `join` handlers. */
type SerializerState = {
  readonly options: Readonly<Required<Pick<MarkdownSerializerOptions, 'bullet'>>>
  /** The constructs the serializer is inside, innermost last. */
  readonly stack: ConstructName[]
}

/**
 * Decides how two adjacent flow nodes are separated, as in `mdast-util-to-markdown`: a number is
 * how many blank lines go between them, `true` or `1` keeps the default (one blank line), and
 * `undefined` lets the next handler decide. Later handlers are asked first.
 */
type Join = (
  left: RootContent,
  right: RootContent,
  parent: Parents,
  state: SerializerState,
) => boolean | number | null | undefined | void

/**
 * Options for {@link createMarkdownSerializer}: the `remark-stringify` options the Copy as
 * Markdown packages use. The rest are fixed at `remark-stringify`'s defaults: `*` for emphasis,
 * strong and thematic breaks, fenced code with backticks, ATX headings, `.` for ordered lists,
 * incrementing list numbers and one space after a list marker.
 */
export type MarkdownSerializerOptions = {
  /** Marker for unordered list items (default: `*`). */
  bullet?: '*' | '+' | '-'
  /** Extra handlers for the space between flow nodes. */
  join?: Join[]
}

type Info = { before: string; after: string }

type State = SerializerState & {
  stack: ConstructName[]
  indexStack: number[]
  join: Join[]
  bulletCurrent: string | undefined
  bulletLastUsed: string | undefined
  /** Set by emphasis and strong: the characters next to them that must be encoded for them to form. */
  attentionEncodeSurroundingInfo: { before: boolean; after: boolean } | undefined
}

type Handler<T extends Nodes = Nodes> = ((node: T, parent: Parents | undefined, state: State, info: Info) => string) & {
  /** The first character the handler would output, without the side effects of serializing. */
  peek?: (node: T, parent: Parents | undefined, state: State) => string
}

const enter = (state: State, name: ConstructName): (() => void) => {
  state.stack.push(name)
  return () => {
    state.stack.pop()
  }
}

const safe = (state: State, value: string, info: Info & { encode?: string[] }): string =>
  safeFor(state.stack, value, info)

/** `mdast-util-to-string`, with image alts and raw HTML included, as the serializer uses it. */
const toString = (node: Nodes): string => {
  if ('value' in node) return node.value
  if ('alt' in node && node.alt) return node.alt
  if ('children' in node) return node.children.map(toString).join('')
  return ''
}

/** `mdast-util-phrasing`: the types `root` treats as inline content. */
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

/** Prefixes every line, as `indentLines` does; `map` gets the line, its index and whether it is empty. */
const indentLines = (value: string, map: (line: string, index: number, blank: boolean) => string): string => {
  const eol = /\r?\n|\r/g
  const result: string[] = []
  let start = 0
  let line = 0
  let match: RegExpExecArray | null
  while ((match = eol.exec(value))) {
    const part = value.slice(start, match.index)
    result.push(map(part, line, !part), match[0])
    start = match.index + match[0].length
    line++
  }
  const part = value.slice(start)
  result.push(map(part, line, !part))
  return result.join('')
}

/**
 * `micromark-util-classify-character`: 1 for whitespace (or nothing at all), 2 for punctuation,
 * `undefined` for anything else. A missing character reads as `NaN`, which counts as a letter.
 */
const classifyCharacter = (code: number): 1 | 2 | undefined => {
  if (Number.isNaN(code)) return undefined
  const character = String.fromCharCode(code)
  if (code === 32 || /\s/.test(character)) return 1
  if (/\p{P}|\p{S}/u.test(character)) return 2
  return undefined
}

/**
 * `encode-info.js`: whether the character inside an emphasis marker, or the one outside it, must be
 * a character reference for the emphasis to open or close. Punctuation is never encoded.
 */
const encodeInfo = (outside: number, inside: number, marker: string): { inside: boolean; outside: boolean } => {
  const outsideKind = classifyCharacter(outside)
  const insideKind = classifyCharacter(inside)
  if (outsideKind === undefined) {
    if (insideKind === undefined) {
      return marker === '_' ? { inside: true, outside: true } : { inside: false, outside: false }
    }
    return insideKind === 1 ? { inside: true, outside: true } : { inside: false, outside: true }
  }
  if (outsideKind === 1) {
    return insideKind === 1 ? { inside: true, outside: true } : { inside: false, outside: false }
  }
  return insideKind === 1 ? { inside: true, outside: false } : { inside: false, outside: false }
}

const handle = (node: Nodes, parent: Parents | undefined, state: State, info: Info): string => {
  const handler = HANDLERS[node.type] as Handler | undefined
  if (!handler) throw new Error(`Cannot handle unknown node \`${node.type}\``)
  return handler(node, parent, state, info)
}

/**
 * Inline content for a node that can only hold inline content, from children that may include
 * blocks. A tree converted from HTML can have them (`<td><pre>`, `<em><pre>`), and written as they
 * are, a block breaks out of its table cell or heading, and a code block's content is read as
 * Markdown, raw HTML included. So each block's inline content follows the content before it after
 * a line break, and a code block becomes a code span. `mdast-util-to-markdown` writes the blocks.
 */
const inlineContent = (nodes: Nodes[]): Nodes[] => {
  if (nodes.every((node) => PHRASING.has(node.type) || node.type === 'html')) return codeSpans(nodes)
  const out: Nodes[] = []
  let afterBlock = false
  const add = (content: Nodes[], block: boolean): void => {
    if (!content.length) return
    if (out.length && (block || afterBlock)) out.push({ type: 'break' })
    for (const node of content) out.push(node)
    afterBlock = block
  }
  for (const node of nodes) {
    if (PHRASING.has(node.type) || node.type === 'html') add([node], false)
    else if (node.type === 'code') add([{ type: 'inlineCode', value: node.value }], true)
    else if ('children' in node) add(inlineContent(node.children), true)
    // A thematic break has no inline form, and goes.
  }
  return codeSpans(out)
}

/**
 * Code spans as Markdown can write them. An empty one has no syntax (two backticks are text), and
 * two in a row run their fences together, so either way backticks pair up differently and code
 * comes back as Markdown and raw HTML. Empty ones go, and neighbours become one span, which looks
 * the same. `mdast-util-to-markdown` writes them as they are.
 */
const codeSpans = (nodes: Nodes[]): Nodes[] => {
  if (
    !nodes.some((node, index) => node.type === 'inlineCode' && (!node.value || nodes[index + 1]?.type === 'inlineCode'))
  ) {
    return nodes
  }
  const out: Nodes[] = []
  for (const node of nodes) {
    if (node.type !== 'inlineCode') out.push(node)
    else if (!node.value) continue
    else {
      const last = out.at(-1)
      if (last?.type === 'inlineCode') out[out.length - 1] = { ...last, value: last.value + node.value }
      else out.push(node)
    }
  }
  return out
}

/**
 * Whether a line ending would end the construct the serializer is in (a table cell, an ATX
 * heading): a pattern that makes every line ending unsafe there, not only one after another.
 */
const lineEndingsUnsafe = (state: State): boolean =>
  UNSAFE.some(
    (pattern) => pattern.character === '\n' && pattern.before === undefined && patternInScope(state.stack, pattern),
  )

const containerPhrasing = (parent: Parents, state: State, info: Info): string => {
  const indexStack = state.indexStack
  const children = inlineContent(parent.children as Nodes[])
  const results: string[] = []
  let before = info.before
  let encodeAfter: string | undefined
  indexStack.push(-1)
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!
    indexStack[indexStack.length - 1] = index
    let after: string
    const next = children[index + 1]
    if (next) {
      const handler = HANDLERS[next.type] as Handler | undefined
      const peek = handler?.peek ?? handler
      after = peek ? peek(next, parent, state, { before: '', after: '' }).charAt(0) : ''
    } else {
      after = info.after
    }
    // Raw HTML right after a line ending would be read as an HTML block, so the line ending
    // becomes a space.
    if (results.length > 0 && (before === '\r' || before === '\n') && child.type === 'html') {
      results[results.length - 1] = results[results.length - 1]!.replace(/(\r?\n|\r)$/, ' ')
      before = ' '
    }
    let value = handle(child, parent, state, { before, after })
    // The previous node asked for the character after it to be encoded, and it still is that character.
    if (encodeAfter && encodeAfter === value.slice(0, 1)) {
      value = encodeCharacterReference(encodeAfter.charCodeAt(0)) + value.slice(1)
    }
    const encodingInfo = state.attentionEncodeSurroundingInfo
    state.attentionEncodeSurroundingInfo = undefined
    encodeAfter = undefined
    if (encodingInfo) {
      const last = results[results.length - 1]
      if (last !== undefined && encodingInfo.before && before === last.slice(-1)) {
        results[results.length - 1] = last.slice(0, -1) + encodeCharacterReference(before.charCodeAt(0))
      }
      if (encodingInfo.after) encodeAfter = after
    }
    results.push(value)
    before = value.slice(-1)
  }
  indexStack.pop()
  return results.join('')
}

const between = (left: RootContent, right: RootContent, parent: Parents, state: State): string => {
  for (let index = state.join.length - 1; index >= 0; index--) {
    const result = state.join[index]!(left, right, parent, state)
    if (result === true || result === 1) break
    if (typeof result === 'number') return '\n'.repeat(1 + result)
    if (result === false) return '\n\n<!---->\n\n'
  }
  return '\n\n'
}

/**
 * Flow content from children that may include inline nodes, which a converted tree can have (text
 * before the first `<li>` lands in a list item). Written as flow, text gets no inline escapes, so
 * `![a](b)` or `x <img>` in it would come back as markup and raw HTML. Each run of inline nodes
 * goes into a paragraph, which is how it renders anyway. `mdast-util-to-markdown` writes the
 * runs as they are (and a root with any inline child entirely as inline content).
 */
const flowContent = (nodes: RootContent[]): RootContent[] => {
  if (!nodes.some((node) => PHRASING.has(node.type))) return nodes
  const out: RootContent[] = []
  for (const node of nodes) {
    const last = out.at(-1)
    if (!PHRASING.has(node.type)) out.push(node)
    else if (last?.type === 'paragraph' && wrapped.has(last)) last.children.push(node as PhrasingContent)
    else {
      const paragraph: Paragraph = { type: 'paragraph', children: [node as PhrasingContent] }
      wrapped.add(paragraph)
      out.push(paragraph)
    }
  }
  return out
}
/** Paragraphs `flowContent` made, so it only adds to its own. */
const wrapped = new WeakSet<Paragraph>()

const containerFlow = (parent: Parents, state: State): string => {
  const indexStack = state.indexStack
  const children = flowContent(parent.children as RootContent[])
  const results: string[] = []
  indexStack.push(-1)
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!
    indexStack[indexStack.length - 1] = index
    results.push(handle(child, parent, state, { before: '\n', after: '\n' }))
    if (child.type !== 'list') state.bulletLastUsed = undefined
    if (index < children.length - 1) results.push(between(child, children[index + 1]!, parent, state))
  }
  indexStack.pop()
  return results.join('')
}

/** Whether a list can start right after a paragraph line: a bullet or `1.`, with content on its first line. */
const interruptsParagraph = (list: List): boolean =>
  (!list.ordered || (list.start ?? 1) === 1) && Boolean(list.children[0]?.children.length)

/**
 * Children of lists and list items are as far apart as the parent's `spread` says, except where
 * a line ending would merge them: a paragraph followed by a paragraph or a setext heading.
 */
const joinDefaults: Join = (left, right, parent) => {
  if ('spread' in parent && typeof parent.spread === 'boolean') {
    // Not in `mdast-util-to-markdown`, which writes these on consecutive lines in a tight list:
    // a table takes in the lines after it as rows, and a list that cannot interrupt a paragraph
    // becomes part of it. Either way the text that follows is read anew, so it gets a blank line.
    if (left.type === 'table' || (left.type === 'paragraph' && right.type === 'list' && !interruptsParagraph(right))) {
      return 1
    }
    if (
      left.type === 'paragraph' &&
      (left.type === right.type ||
        right.type === 'definition' ||
        (right.type === 'heading' && formatHeadingAsSetext(right)))
    ) {
      return
    }
    return parent.spread ? 1 : 0
  }
  return
}

const root: Handler<Root> = (node, _, state) => containerFlow(node, state)

const paragraph: Handler<Paragraph> = (node, _, state, info) => {
  const exit = enter(state, 'paragraph')
  const subexit = enter(state, 'phrasing')
  const value = containerPhrasing(node, state, info)
  subexit()
  exit()
  return value
}

/** Setext only when an ATX heading cannot hold the content: a line ending in it, at depth 1 or 2. */
const formatHeadingAsSetext = (node: Heading): boolean => {
  const hasBreak = (n: Nodes): boolean =>
    ('value' in n && /\r?\n|\r/.test(n.value)) || n.type === 'break' || ('children' in n && n.children.some(hasBreak))
  return (!node.depth || node.depth < 3) && Boolean(toString(node)) && hasBreak(node)
}

const heading: Handler<Heading> = (node, _, state) => {
  const rank = Math.max(Math.min(6, node.depth || 1), 1)
  if (formatHeadingAsSetext(node)) {
    const exit = enter(state, 'headingSetext')
    const subexit = enter(state, 'phrasing')
    const value = containerPhrasing(node, state, { before: '\n', after: '\n' })
    subexit()
    exit()
    const lastLine = Math.max(value.lastIndexOf('\r'), value.lastIndexOf('\n')) + 1
    return `${value}\n${(rank === 1 ? '=' : '-').repeat(value.length - lastLine)}`
  }
  const sequence = '#'.repeat(rank)
  const exit = enter(state, 'headingAtx')
  const subexit = enter(state, 'phrasing')
  let value = containerPhrasing(node, state, { before: '# ', after: '\n' })
  // Leading whitespace would be taken as part of the heading marker.
  if (/^[\t ]/.test(value)) value = encodeCharacterReference(value.charCodeAt(0)) + value.slice(1)
  value = value ? `${sequence} ${value}` : sequence
  subexit()
  exit()
  return value
}

const text: Handler<Text> = (node, _, state, info) => safe(state, node.value, info)

/** Emphasis and strong: the markers, plus character references where the markers would not form. */
const attention = (
  node: Emphasis | Strong,
  state: State,
  info: Info,
  name: 'emphasis' | 'strong',
  marker: string,
): string => {
  const exit = enter(state, name)
  const sequence = name === 'strong' ? marker + marker : marker
  let inside = containerPhrasing(node, state, { before: sequence, after: marker })
  const head = inside.charCodeAt(0)
  const open = encodeInfo(info.before.charCodeAt(info.before.length - 1), head, marker)
  if (open.inside) inside = encodeCharacterReference(head) + inside.slice(1)
  const tail = inside.charCodeAt(inside.length - 1)
  const close = encodeInfo(info.after.charCodeAt(0), tail, marker)
  if (close.inside) inside = inside.slice(0, -1) + encodeCharacterReference(tail)
  exit()
  state.attentionEncodeSurroundingInfo = { after: close.outside, before: open.outside }
  return sequence + inside + sequence
}

const emphasis: Handler<Emphasis> = (node, _, state, info) => attention(node, state, info, 'emphasis', '*')
emphasis.peek = () => '*'

const strong: Handler<Strong> = (node, _, state, info) => attention(node, state, info, 'strong', '*')
strong.peek = () => '*'

const strikethrough: Handler<Delete> = (node, _, state) => {
  const exit = enter(state, 'strikethrough')
  const value = containerPhrasing(node, state, { before: '~~', after: '~' })
  exit()
  return `~~${value}~~`
}
strikethrough.peek = () => '~'

const inlineCode: Handler<InlineCode> = (node, _, state) => {
  // Code cannot be escaped, so a line ending in it could start a block, or end the paragraph,
  // table cell or heading, and leave the rest as Markdown and raw HTML. A line ending in a code
  // span reads as a space anyway, so it is written as one. `mdast-util-to-markdown` only replaces
  // a line ending before block syntax, which a blank line in the code (`a\n\n\n<img>`) defeats.
  let value = (node.value || '').replace(/\r\n|\r|\n/g, ' ')
  let sequence = '`'
  // A fence one longer than any run of backticks of that length inside.
  while (new RegExp(`(^|[^\`])${sequence}([^\`]|$)`).test(value)) sequence += '`'
  // Padding, so a leading or trailing backtick or space survives.
  if (/[^ ]/.test(value) && ((/^ /.test(value) && / $/.test(value)) || /^`|`$/.test(value))) {
    value = ` ${value} `
  }
  // A pipe would end a table cell, and inside a cell the table's own escape applies to code too.
  if (state.stack.includes('tableCell')) value = value.replace(/\|/g, '\\$&')
  return sequence + value + sequence
}
inlineCode.peek = () => '`'

const hardBreak: Handler = (_, _1, state, info) => {
  // Where line endings cannot go (ATX headings, table cells), a space does instead.
  if (lineEndingsUnsafe(state)) return /[ \t]/.test(info.before) ? '' : ' '
  return '\\\n'
}

const html: Handler<Html> = (node) => node.value || ''
html.peek = () => '<'

/** `<url>` when the text is the URL itself and an autolink can hold it. */
const formatLinkAsAutolink = (node: Link): boolean => {
  const raw = toString(node)
  return Boolean(
    node.url &&
      !node.title &&
      node.children.length === 1 &&
      node.children[0]!.type === 'text' &&
      (raw === node.url || `mailto:${raw}` === node.url) &&
      /^[a-z][a-z+.-]+:/i.test(node.url) &&
      // biome-ignore lint/suspicious/noControlCharactersInRegex: Autolinks cannot hold control characters, so a URL with one gets a resource link.
      !/[\0- <>\u007F]/.test(node.url),
  )
}

const link: Handler<Link> = (node, _, state) => {
  if (formatLinkAsAutolink(node)) {
    // Escapes do not work in an autolink, so it is not phrasing.
    const stack = state.stack.splice(0)
    const exit = enter(state, 'autolink')
    const value = containerPhrasing(node, state, { before: '<', after: '>' })
    exit()
    state.stack.push(...stack)
    return `<${value}>`
  }
  const exit = enter(state, 'link')
  let subexit = enter(state, 'label')
  let value = `[${containerPhrasing(node, state, { before: '[', after: '](' })}](`
  subexit()
  // Whitespace and control characters need a destination in angle brackets, and so does a leading
  // `<`: a raw destination cannot start with one, so the parser would read an angle bracket
  // destination up to the first `>`, and the rest as raw HTML. `mdast-util-to-markdown` writes it raw.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Whitespace and control characters need a destination in angle brackets.
  if ((!node.url && node.title) || /[\0- \u007F]/.test(node.url) || node.url.startsWith('<')) {
    subexit = enter(state, 'destinationLiteral')
    value += `<${safe(state, node.url, { before: `${value}<`, after: '>' })}>`
  } else {
    subexit = enter(state, 'destinationRaw')
    value += safe(state, node.url, { before: value, after: node.title ? ' ' : ')' })
  }
  subexit()
  if (node.title) {
    subexit = enter(state, 'titleQuote')
    value += ` "${safe(state, node.title, { before: `${value} "`, after: '"' })}"`
    subexit()
  }
  exit()
  return `${value})`
}
link.peek = (node) => (formatLinkAsAutolink(node) ? '<' : '[')

/** The length of the longest run of `character` in `value`, for a code fence that cannot close early. */
const longestStreak = (value: string, character: string): number => {
  let max = 0
  let count = 0
  for (const c of value) {
    count = c === character ? count + 1 : 0
    if (count > max) max = count
  }
  return max
}

const code: Handler<Code> = (node, _, state) => {
  const raw = node.value || ''
  const sequence = '`'.repeat(Math.max(longestStreak(raw, '`') + 1, 3))
  const exit = enter(state, 'codeFenced')
  let value = sequence
  if (node.lang) {
    const subexit = enter(state, 'codeFencedLangGraveAccent')
    value += safe(state, node.lang, { before: value, after: ' ', encode: ['`'] })
    subexit()
  }
  if (node.lang && node.meta) {
    const subexit = enter(state, 'codeFencedMetaGraveAccent')
    value += ' '
    value += safe(state, node.meta, { before: value, after: '\n', encode: ['`'] })
    subexit()
  }
  value += '\n'
  if (raw) value += `${raw}\n`
  value += sequence
  exit()
  return value
}

const blockquote: Handler<Blockquote> = (node, _, state) => {
  const exit = enter(state, 'blockquote')
  const value = indentLines(containerFlow(node, state), (line, _1, blank) => `>${blank ? '' : ' '}${line}`)
  exit()
  return value
}

const thematicBreak: Handler = () => '***'

const list: Handler<List> = (node, parent, state) => {
  const exit = enter(state, 'list')
  const bulletCurrent = state.bulletCurrent
  let bullet: string = node.ordered ? '.' : state.options.bullet
  const bulletOther = node.ordered ? ')' : bullet === '*' ? '-' : '*'
  // Two lists in a row need different markers, or they would be one list.
  let useDifferentMarker = parent && state.bulletLastUsed ? bullet === state.bulletLastUsed : false
  if (!node.ordered) {
    const first = node.children[0]
    const { stack, indexStack } = state
    // `* - *` would be one thematic break: an empty first item, as the first child of two
    // other first items, needs the other marker.
    if (
      (bullet === '*' || bullet === '-') &&
      first &&
      !first.children[0] &&
      stack[stack.length - 1] === 'list' &&
      stack[stack.length - 2] === 'listItem' &&
      stack[stack.length - 3] === 'list' &&
      stack[stack.length - 4] === 'listItem' &&
      indexStack[indexStack.length - 1] === 0 &&
      indexStack[indexStack.length - 2] === 0 &&
      indexStack[indexStack.length - 3] === 0
    ) {
      useDifferentMarker = true
    }
    // `* ***` would be a thematic break too, when the rule uses the bullet's character.
    if (bullet === '*' && first && node.children.some((item) => item.children[0]?.type === 'thematicBreak')) {
      useDifferentMarker = true
    }
  }
  if (useDifferentMarker) bullet = bulletOther
  state.bulletCurrent = bullet
  const value = containerFlow(node, state)
  state.bulletLastUsed = bullet
  state.bulletCurrent = bulletCurrent
  exit()
  return value
}

const listItem: Handler<ListItem> = (node, parent, state) => {
  let bullet = state.bulletCurrent || state.options.bullet
  if (parent?.type === 'list' && parent.ordered) {
    const start = typeof parent.start === 'number' && parent.start > -1 ? parent.start : 1
    bullet = `${start + parent.children.indexOf(node)}${bullet}`
  }
  const size = bullet.length + 1
  const exit = enter(state, 'listItem')
  let value = indentLines(containerFlow(node, state), (line, index, blank) => {
    if (index) return (blank ? '' : ' '.repeat(size)) + line
    return (blank ? bullet : bullet + ' '.repeat(size - bullet.length)) + line
  })
  exit()
  // GFM task list items: the checkbox goes after the marker.
  if (typeof node.checked === 'boolean' && node.children[0]?.type === 'paragraph') {
    const checkbox = `[${node.checked ? 'x' : ' '}] `
    value = value.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, (marker) => marker + checkbox)
  }
  return value
}

const footnoteReference: Handler<FootnoteReference> = (node, _, state) => {
  const exit = enter(state, 'footnoteReference')
  const subexit = enter(state, 'reference')
  const value = safe(state, associationId(node), { before: '[^', after: ']' })
  subexit()
  exit()
  return `[^${value}]`
}
footnoteReference.peek = () => '['

const footnoteDefinition: Handler<FootnoteDefinition> = (node, _, state) => {
  const exit = enter(state, 'footnoteDefinition')
  const subexit = enter(state, 'label')
  const label = safe(state, associationId(node), { before: '[^', after: ']' })
  subexit()
  const value = `[^${label}]:${node.children.length > 0 ? ' ' : ''}${indentLines(containerFlow(node, state), (line, index, blank) => (index === 0 ? line : (blank ? '' : '    ') + line))}`
  exit()
  return value
}

/** The label to write for a footnote: as authored, or else the identifier with escapes and references decoded. */
const associationId = (node: FootnoteReference | FootnoteDefinition): string =>
  node.label || !node.identifier ? node.label || '' : unescapeString(node.identifier)

/** A cell's content, with the pipes and line endings that would break the row escaped. */
const tableCell = (node: TableCell, state: State): string => {
  const exit = enter(state, 'tableCell')
  const subexit = enter(state, 'phrasing')
  const value = containerPhrasing(node, state, { before: '|', after: '|' })
  subexit()
  exit()
  return value
}

const tableRow = (node: TableRow, state: State): string[] => {
  const exit = enter(state, 'tableRow')
  const cells = node.children.map((cell) => tableCell(cell, state))
  exit()
  return cells
}

/**
 * `markdown-table` with the options `mdast-util-gfm-table` gives it: padded cells and delimiters
 * aligned to the widest cell, with `:` where a column is aligned.
 */
const markdownTable = (rows: string[][], align: Table['align']): string => {
  const columns = Math.max(0, ...rows.map((row) => row.length))
  const widths: number[] = []
  for (const row of rows) {
    row.forEach((cell, column) => {
      if (widths[column] === undefined || cell.length > widths[column]!) widths[column] = cell.length
    })
  }
  const alignments = Array.from({ length: columns }, (_, column) => {
    const value = align?.[column]
    const c = typeof value === 'string' ? value.charAt(0).toLowerCase() : ''
    return c === 'c' || c === 'l' || c === 'r' ? c : ''
  })
  const delimiter: string[] = []
  const delimiterSizes: number[] = []
  for (let column = 0; column < columns; column++) {
    const code = alignments[column]
    const before = code === 'c' || code === 'l' ? ':' : ''
    const after = code === 'c' || code === 'r' ? ':' : ''
    const size = Math.max(1, (widths[column] ?? 0) - before.length - after.length)
    delimiter[column] = before + '-'.repeat(size) + after
    const total = before.length + size + after.length
    if (widths[column] === undefined || total > widths[column]!) widths[column] = total
    delimiterSizes[column] = total
  }
  const matrix = rows.length ? [rows[0]!, delimiter, ...rows.slice(1)] : [delimiter]
  return matrix
    .map((row, index) => {
      let line = ''
      for (let column = 0; column < columns; column++) {
        const cell = row[column] ?? ''
        const size = (widths[column] ?? 0) - (index === 1 ? delimiterSizes[column]! : cell.length)
        const code = alignments[column]
        let before = ''
        let after = ''
        if (code === 'r') before = ' '.repeat(size)
        else if (code === 'c') {
          before = ' '.repeat(Math.ceil(size / 2))
          after = ' '.repeat(Math.floor(size / 2))
        } else after = ' '.repeat(size)
        if (!column) line += '|'
        line += ` ${before}${cell}${after} |`
      }
      return line
    })
    .join('\n')
}

const table: Handler<Table> = (node, _, state) => {
  const exit = enter(state, 'table')
  const rows = node.children.map((row) => tableRow(row, state))
  exit()
  return markdownTable(rows, node.align)
}

/** A row or cell outside a table, which a tree built by hand can have: as `mdast-util-gfm-table` writes them. */
const looseTableRow: Handler<TableRow> = (node, _, state) => {
  const value = markdownTable([tableRow(node, state)], undefined)
  return value.slice(0, value.indexOf('\n'))
}
const looseTableCell: Handler<TableCell> = (node, _, state) => tableCell(node, state)

const HANDLERS: { [K in Nodes['type']]?: Handler<Extract<Nodes, { type: K }>> } = {
  blockquote,
  break: hardBreak,
  code,
  delete: strikethrough,
  emphasis,
  footnoteDefinition,
  footnoteReference,
  heading,
  html,
  inlineCode,
  link,
  list,
  listItem,
  paragraph,
  root,
  strong,
  table,
  tableCell: looseTableCell,
  tableRow: looseTableRow,
  text,
  thematicBreak,
}

/**
 * Creates a function that serializes an mdast tree to GitHub Flavored Markdown.
 *
 * Build it once and reuse it, as the options are checked and the handlers set up only once.
 */
export const createMarkdownSerializer = (options?: MarkdownSerializerOptions): ((tree: Root) => string) => {
  const bullet = options?.bullet ?? '*'
  if (bullet !== '*' && bullet !== '+' && bullet !== '-') {
    throw new Error(`Cannot serialize items with \`${bullet}\` for \`options.bullet\`, expected \`*\`, \`+\`, or \`-\``)
  }
  const join = [joinDefaults, ...(options?.join ?? [])]
  return (tree) => {
    const state: State = {
      options: { bullet },
      stack: [],
      indexStack: [],
      join,
      bulletCurrent: undefined,
      bulletLastUsed: undefined,
      attentionEncodeSurroundingInfo: undefined,
    }
    const result = handle(tree, undefined, state, { before: '\n', after: '\n' })
    return result && !/[\r\n]$/.test(result) ? `${result}\n` : result
  }
}

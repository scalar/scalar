/**
 * A small HTML tree for converting the pipeline's own HTML to mdast: a tree builder over the
 * pipeline's tokenizer, and ports of the two hast utilities `hast-util-to-mdast` relies on,
 * `rehype-minify-whitespace` and `hast-util-to-text`.
 *
 * The input is HTML that the pipeline's `Writer` wrote: allowlisted, balanced and escaped. That is
 * why a stack of open elements is enough here, where parse5 implements the whole HTML parser. The
 * one part of the parser it adds is what the writer leaves to the browser: implied table rows and
 * bodies, and moving content a table cannot hold to before the table ("foster parenting").
 */
import { decodeHtml } from '../pipeline/entities'
import { DEFAULT_TAGS, type TokenSink, VOID, Writer, tokenize } from '../pipeline/html'

export type HastText = { type: 'text'; value: string }
/** Attributes by name, decoded. A boolean attribute such as `checked` is present with an empty value. */
export type HastElement = {
  type: 'element'
  tagName: string
  properties: Record<string, string>
  children: HastNode[]
}
export type HastRoot = { type: 'root'; children: HastNode[] }
export type HastNode = HastText | HastElement
export type HastParent = HastRoot | HastElement

const TAGS = new Set(DEFAULT_TAGS)

/** Elements whose content model is table parts only: anything else goes before the table. */
const TABLE_CONTEXT = new Set(['table', 'tbody', 'tfoot', 'thead', 'tr'])
/** The table parts the sanitizer allows, and the elements each one closes up to. */
const TABLE_PART_PARENTS: Record<string, string[]> = {
  td: ['tr', 'tbody', 'thead', 'tfoot', 'table'],
  th: ['tr', 'tbody', 'thead', 'tfoot', 'table'],
  tr: ['tbody', 'thead', 'tfoot', 'table'],
  tbody: ['table'],
  thead: ['table'],
  tfoot: ['table'],
}

/** The HTML parser drops a line ending right after these start tags. */
const LEADING_NEWLINE = new Set(['pre', 'listing', 'textarea'])

/**
 * Parses HTML into a tree, after sanitizing it with the same allowlist as `htmlFromMarkdown`.
 * Output of `htmlFromMarkdown` comes through unchanged, and anything else is made safe and
 * balanced first, the way `rehype-sanitize` cleaned the tree before.
 */
export const parseHtml = (html: string): HastRoot => {
  const writer = new Writer({ tags: TAGS, inline: () => false })
  writer.raw(html)
  const clean = writer.finish()

  const root: HastRoot = { type: 'root', children: [] }
  const stack: HastParent[] = [root]
  const top = (): HastParent => stack.at(-1)!
  const tableIndex = (): number => {
    for (let index = stack.length - 1; index > 0; index--) {
      const node = stack[index]!
      if (node.type === 'element' && node.tagName === 'table') return index
    }
    return -1
  }
  /** Where the parser puts what a table cannot hold: right before the table, in its parent. */
  const fosterParent = (node: HastNode): void => {
    const index = tableIndex()
    const table = stack[index] as HastElement
    const siblings = stack[index - 1]!.children
    const at = siblings.indexOf(table)
    const previous = siblings[at - 1]
    if (node.type === 'text' && previous?.type === 'text') previous.value += node.value
    else siblings.splice(at, 0, node)
  }
  const inTableContext = (): boolean => {
    const node = top()
    return node.type === 'element' && TABLE_CONTEXT.has(node.tagName)
  }
  const appendText = (value: string): void => {
    const parent = top()
    if (parent.type === 'element' && LEADING_NEWLINE.has(parent.tagName) && parent.children.length === 0) {
      value = value.replace(/^\r?\n/, '')
    }
    if (!value) return
    if (inTableContext() && !isWhitespace(value)) return fosterParent({ type: 'text', value })
    const last = parent.children.at(-1)
    if (last?.type === 'text') last.value += value
    else parent.children.push({ type: 'text', value })
  }
  const open = (tagName: string, properties: Record<string, string> = {}): HastElement => {
    const element: HastElement = { type: 'element', tagName, properties, children: [] }
    top().children.push(element)
    if (!VOID.has(tagName)) stack.push(element)
    return element
  }
  const sink: TokenSink = {
    onText: (text) => appendText(decodeHtml(text)),
    onRawText: (_tag, text) => appendText(text),
    onComment: () => undefined,
    onStart: (tagName, attrs) => {
      const properties: Record<string, string> = {}
      for (const [name, value] of attrs) {
        if (!(name in properties)) properties[name] = value === null ? '' : decodeHtml(value, true)
      }
      const closesTo = TABLE_PART_PARENTS[tagName]
      if (closesTo && tableIndex() !== -1) {
        // A table part closes the parts it cannot be inside (a row closes the open row), and
        // implies the ones it needs: `<td>` in a table body is in a row, and a row is in a body.
        while (!closesTo.includes((top() as HastElement).tagName)) stack.pop()
        const parent = (top() as HastElement).tagName
        if ((tagName === 'td' || tagName === 'th') && parent !== 'tr') {
          if (parent === 'table') open('tbody')
          open('tr')
        } else if (tagName === 'tr' && parent === 'table') open('tbody')
        open(tagName, properties)
        return
      }
      if (inTableContext()) {
        const element: HastElement = { type: 'element', tagName, properties, children: [] }
        fosterParent(element)
        if (!VOID.has(tagName)) stack.push(element)
        return
      }
      open(tagName, properties)
    },
    onEnd: (tagName) => {
      for (let index = stack.length - 1; index > 0; index--) {
        if ((stack[index] as HastElement).tagName === tagName) {
          stack.length = index
          return
        }
      }
    },
  }
  tokenize(clean, sink)
  return root
}

const isElement = (node: HastNode | HastRoot, names: Set<string>): boolean =>
  node.type === 'element' && names.has(node.tagName)

/** `hast-util-whitespace`: text that is only inter-element whitespace. */
export const isWhitespace = (value: string): boolean => !/[^ \t\n\f\r]/.test(value)

/** `hast-util-embedded`. */
const EMBEDDED = new Set(['audio', 'canvas', 'embed', 'iframe', 'img', 'math', 'object', 'picture', 'svg', 'video'])

/** `hast-util-phrasing`, for the elements that can occur here. */
const PHRASING_ELEMENTS = new Set(
  'a abbr area b bdi bdo br button cite code data datalist del dfn em i input ins kbd keygen label map mark meter noscript output progress q ruby s samp script select small span strong sub sup template textarea time u var wbr'.split(
    ' ',
  ),
)
export const isPhrasingElement = (node: HastNode): boolean =>
  node.type === 'text' || isElement(node, PHRASING_ELEMENTS) || isElement(node, EMBEDDED)

// rehype-minify-whitespace

const BLOCKS = new Set(
  'address article aside blockquote body br caption center col colgroup dd dialog dir div dl dt figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html legend li listing main menu nav ol optgroup option p plaintext pre section summary table tbody td tfoot th thead tr ul wbr xmp'.split(
    ' ',
  ),
)
const CONTENT = new Set(['button', 'input', 'select', 'textarea', ...EMBEDDED])
const SKIPPABLE = new Set(
  'area base basefont dialog datalist head link meta noembed noframes param rp script source style template track title'.split(
    ' ',
  ),
)

type WhiteSpace = 'normal' | 'pre' | 'nowrap' | 'pre-wrap'
type MinifyState = { whitespace: WhiteSpace; before?: boolean; after?: boolean }
type MinifyResult = { stripAtStart: boolean; remove: boolean }

const inferWhiteSpace = (node: HastNode | HastRoot, whitespace: WhiteSpace): WhiteSpace => {
  if (node.type !== 'element') return whitespace
  switch (node.tagName) {
    case 'listing':
    case 'plaintext':
    case 'script':
    case 'style':
    case 'xmp':
      return 'pre'
    case 'nobr':
      return 'nowrap'
    case 'pre':
      return 'wrap' in node.properties ? 'pre-wrap' : 'pre'
    case 'td':
    case 'th':
      return 'nowrap' in node.properties ? 'nowrap' : whitespace
    case 'textarea':
      return 'pre-wrap'
    default:
      return whitespace
  }
}

const collapse = (value: string): string => value.replace(/[\t\n\v\f\r ]+/g, ' ')

/** Whether the whitespace at the end of a node can go: what follows starts a block (or nothing does). */
const collapsableAfter = (nodes: HastNode[], index: number, after: boolean | undefined): boolean | undefined => {
  while (++index < nodes.length) {
    const node = nodes[index]!
    let result: boolean | undefined
    if (node.type === 'element') {
      if (isElement(node, CONTENT)) result = false
      else if (isElement(node, BLOCKS)) result = true
      else if (!SKIPPABLE.has(node.tagName) && !('hidden' in node.properties)) {
        result = collapsableAfter(node.children, -1, undefined)
      }
    } else if (!isWhitespace(node.value)) {
      result = false
    }
    if (typeof result === 'boolean') return result
  }
  return after
}

const minifyAll = (parent: HastParent, state: MinifyState): MinifyResult => {
  let before = state.before
  const after = state.after
  const children = parent.children
  for (let index = 0; index < children.length; index++) {
    const result = minify(children[index]!, {
      ...state,
      after: collapsableAfter(children, index, after),
      before,
    })
    if (result.remove) {
      children.splice(index, 1)
      index--
    } else {
      before = result.stripAtStart
    }
    const child = children[index]
    if (child && isElement(child, CONTENT)) before = false
  }
  return { stripAtStart: Boolean(before || after), remove: false }
}

const minify = (node: HastNode | HastRoot, state: MinifyState): MinifyResult => {
  if (node.type !== 'text') {
    const settings = { ...state }
    if (node.type === 'root' || isElement(node, BLOCKS)) {
      settings.before = true
      settings.after = true
    }
    settings.whitespace = inferWhiteSpace(node, state.whitespace)
    return minifyAll(node, settings)
  }
  if (state.whitespace === 'nowrap') node.value = collapse(node.value)
  if (state.whitespace !== 'normal') return { stripAtStart: false, remove: false }
  const value = collapse(node.value)
  const result = { stripAtStart: false, remove: false }
  let start = 0
  let end = value.length
  if (state.before && (value[0] === ' ' || value[0] === '\n')) start++
  if (start !== end && (value[end - 1] === ' ' || value[end - 1] === '\n')) {
    if (state.after) end--
    else result.stripAtStart = true
  }
  if (start === end) result.remove = true
  else node.value = value.slice(start, end)
  return result
}

/** Collapses whitespace as a browser would render it, in place. */
export const minifyWhitespace = (tree: HastRoot): void => {
  minify(tree, { whitespace: 'normal' })
}

// hast-util-to-text

const TABLE_PARTS = new Set(['caption', 'col', 'colgroup', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr'])
const NOT_RENDERED = new Set([
  'datalist',
  'head',
  'noembed',
  'noframes',
  'noscript',
  'rp',
  'script',
  'style',
  'template',
  'title',
])
const BLOCK_OR_CAPTION = new Set(
  'address article aside blockquote body caption center dd dialog dir dl dt div figure figcaption footer form h1 h2 h3 h4 h5 h6 header hgroup hr html legend li listing main menu nav ol p plaintext pre section ul xmp'.split(
    ' ',
  ),
)

/** A line feed or tab that must be output, as opposed to a count of line breaks that collapse with others. */
type Forced = { value: string }
type TextItem = string | number | Forced
const FORCED_LINE_FEED: Forced = { value: '\n' }
const FORCED_TAB: Forced = { value: '\t' }

const isRowGroup = (node: HastElement): boolean =>
  node.tagName === 'tbody' || node.tagName === 'tfoot' || node.tagName === 'thead'
const isRow = (node: HastElement): boolean => node.tagName === 'tr'
const isCell = (node: HastElement): boolean => node.tagName === 'td' || node.tagName === 'th'
const isRowOrRowGroupWithRow = (node: HastElement): boolean =>
  isRow(node) || (isRowGroup(node) && node.children.some((child) => child.type === 'element' && isRow(child)))

const hasAfter = (parent: HastParent, index: number, test: (node: HastElement) => boolean): boolean => {
  while (++index < parent.children.length) {
    const child = parent.children[index]!
    if (child.type === 'element' && test(child)) return true
  }
  return false
}

const inferRowAfter = (parent: HastParent, index: number, rowAfter: boolean | undefined): boolean | undefined =>
  parent.type === 'element' && parent.tagName === 'table' ? hasAfter(parent, index, isRowOrRowGroupWithRow) : rowAfter

const collectText = (node: HastText): TextItem[] => {
  const value = node.value.replace(/[؜‎‏‪-‮⁦-⁩]/g, '')
  const lines: string[] = []
  const result: TextItem[] = []
  if (/^[\t ]/.test(value)) result.push(0)
  let start = 0
  while (start <= value.length) {
    const found = value.indexOf('\n', start)
    const end = found === -1 ? value.length : found
    lines.push(
      value
        .slice(start, end)
        .replace(/^[\t ]+|[\t ]+$/g, '')
        .replace(/[\t ]+/g, ' '),
    )
    start = end + 1
  }
  let join: number | undefined
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    // A zero width space next to a line break removes the break, as in `innerText`.
    if (
      line.charCodeAt(line.length - 1) === 0x20_0b ||
      (index < lines.length - 1 && lines[index + 1]!.charCodeAt(0) === 0x20_0b)
    ) {
      result.push(line)
      join = undefined
    } else if (line) {
      if (typeof join === 'number') result.push(join)
      result.push(line)
      join = 0
    } else if (index === 0 || index === lines.length - 1) {
      result.push(0)
    }
  }
  if (/[\t ]$/.test(value)) result.push(0)
  return result
}

type TextInfo = { whitespace: WhiteSpace; rowAfter: boolean | undefined }

/** A loop rather than `push(...items)`, which fails past the engine's argument limit on long text. */
const append = (list: TextItem[], items: TextItem[]): void => {
  for (const item of items) list.push(item)
}

const renderedTextCollection = (node: HastNode, index: number, parent: HastParent, info: TextInfo): TextItem[] => {
  if (node.type === 'element') return collectElement(node, index, parent, info)
  if (
    /^[\t\n\f\r ]+$/.test(node.value) &&
    parent.type === 'element' &&
    (parent.tagName === 'table' || parent.tagName === 'tr' || isRowGroup(parent))
  ) {
    const before = parent.children[index - 1]
    const after = parent.children[index + 1]
    if (
      (!before || (before.type === 'element' && TABLE_PARTS.has(before.tagName))) &&
      (!after || (after.type === 'element' && TABLE_PARTS.has(after.tagName)))
    ) {
      return []
    }
  }
  return info.whitespace === 'normal' ? collectText(node) : [node.value]
}

const collectElement = (node: HastElement, position: number, parent: HastParent, info: TextInfo): TextItem[] => {
  const whitespace = inferWhiteSpace(node, info.whitespace)
  const inTable = node.tagName === 'table' || isRowGroup(node)
  const items: TextItem[] = []
  if (
    NOT_RENDERED.has(node.tagName) ||
    'hidden' in node.properties ||
    (node.tagName === 'dialog' && !('open' in node.properties))
  ) {
    return items
  }
  let prefix: number | undefined
  let suffix: TextItem | undefined
  if (node.tagName === 'br') suffix = FORCED_LINE_FEED
  else if (isRow(node) && (info.rowAfter || hasAfter(parent, position, isRow))) suffix = FORCED_LINE_FEED
  else if (node.tagName === 'p') {
    prefix = 2
    suffix = 2
  } else if (BLOCK_OR_CAPTION.has(node.tagName)) {
    prefix = 1
    suffix = 1
  }
  node.children.forEach((child, index) => {
    append(
      items,
      renderedTextCollection(child, index, node, {
        rowAfter: inTable ? inferRowAfter(node, index, info.rowAfter) : undefined,
        whitespace,
      }),
    )
  })
  if (isCell(node) && hasAfter(parent, position, isCell)) items.push(FORCED_TAB)
  if (prefix) items.unshift(prefix)
  if (suffix) items.push(suffix)
  return items
}

/** `hast-util-to-text`: the text of an element as `innerText` would give it. */
export const toText = (tree: HastElement): string => {
  const inline =
    tree.tagName !== 'p' &&
    tree.tagName !== 'table' &&
    !BLOCK_OR_CAPTION.has(tree.tagName) &&
    !TABLE_PARTS.has(tree.tagName)
  const inTable = tree.tagName === 'table' || isRowGroup(tree)
  const whitespace = inferWhiteSpace(tree, 'normal')
  const results: TextItem[] = []
  tree.children.forEach((child, index) => {
    append(
      results,
      renderedTextCollection(child, index, tree, {
        rowAfter: inTable ? inferRowAfter(tree, index, undefined) : undefined,
        whitespace,
      }),
    )
  })
  let force = false
  const result: string[] = []
  let count = inline ? -1 : undefined
  for (const value of results) {
    if (typeof value === 'number') {
      if (count !== undefined && value > count) count = value
    } else if (value) {
      const forceBefore = force
      force = typeof value === 'object'
      if (count !== undefined && count > (force || forceBefore ? 0 : -1) && (result.length > 0 || count === 0)) {
        result.push('\n'.repeat(count) || ' ')
      }
      count = -1
      result.push(typeof value === 'object' ? value.value : value)
    }
  }
  if (inline && count === 0 && !force) result.push(' ')
  return result.join('')
}

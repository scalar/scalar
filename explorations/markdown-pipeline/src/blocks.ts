/**
 * Block parser: CommonMark's line-by-line container algorithm (ported from
 * commonmark.js), plus GFM tables, task list items and footnote definitions.
 */
import { CLOSETAG, type Inline, InlineParser, OPENTAG, type Refs, normalizeLabel, unescapeString } from './inline'

type Kind =
  | 'root'
  | 'blockquote'
  | 'list'
  | 'listItem'
  | 'paragraph'
  | 'heading'
  | 'thematicBreak'
  | 'code'
  | 'html'
  | 'table'
  | 'footnoteDefinition'

type ListData = {
  ordered: boolean
  bullet: string
  delimiter: string
  start: number
  markerOffset: number
  padding: number
}

/** Internal block. Converted to mdast once the whole document is parsed. */
type B = {
  kind: Kind
  parent: B | null
  children: B[]
  open: boolean
  startLine: number
  endLine: number
  content: string
  // per kind
  depth?: number
  list?: ListData
  fenced?: boolean
  fenceChar?: string
  fenceLength?: number
  fenceOffset?: number
  htmlType?: number
  rows?: string[]
  align?: (string | null)[]
  label?: string
}

export type Block =
  | { type: 'paragraph'; children: Inline[]; position: Pos }
  | {
      type: 'heading'
      depth: number
      children: Inline[]
      position: Pos
      data?: { hProperties?: Record<string, unknown> }
    }
  | { type: 'thematicBreak'; position: Pos }
  | { type: 'blockquote'; children: Block[]; position: Pos }
  | { type: 'list'; ordered: boolean; start: number | null; spread: boolean; children: ListItem[]; position: Pos }
  | { type: 'code'; lang: string | null; meta: string | null; value: string; position: Pos }
  | { type: 'html'; value: string; position: Pos }
  | { type: 'table'; align: (string | null)[]; children: TableRow[]; position: Pos }
  | { type: 'footnoteDefinition'; identifier: string; label: string; children: Block[]; position: Pos }
export type ListItem = { type: 'listItem'; checked: boolean | null; spread: boolean; children: Block[]; position: Pos }
export type TableRow = { type: 'tableRow'; children: { type: 'tableCell'; children: Inline[] }[] }
export type Pos = { start: { line: number }; end: { line: number } }
export type Root = { type: 'root'; children: Block[]; footnotes: Map<string, Block & { type: 'footnoteDefinition' }> }

const CODE_INDENT = 4
const MAX_DEPTH = 100
const ATX = /^#{1,6}(?:[ \t]+|$)/
const FENCE = /^`{3,}(?!.*`)|^~{3,}/
const CLOSING_FENCE = /^(?:`{3,}|~{3,})(?=[ \t]*$)/
const THEMATIC = /^(?:\*[ \t]*){3,}$|^(?:_[ \t]*){3,}$|^(?:-[ \t]*){3,}$/
const SETEXT = /^(?:=+|-+)[ \t]*$/
const BULLET = /^[*+-]/
const ORDERED = /^(\d{1,9})([.)])/
const MAYBE_SPECIAL = /^[#`~*+_=<>0-9|:[-]/
const TABLE_DELIM = /^\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/
const FOOTNOTE_DEF = /^\[\^([^\]\s][^\]]*)\]:/
const HTML_OPEN = [
  /./,
  /^<(?:script|pre|textarea|style)(?:\s|>|$)/i,
  /^<!--/,
  /^<[?]/,
  /^<![A-Za-z]/,
  /^<!\[CDATA\[/,
  /^<[/]?(?:address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[123456]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|[/]?[>]|$)/i,
  new RegExp(`^(?:${OPENTAG}|${CLOSETAG})\\s*$`, 'i'),
]
const HTML_CLOSE = [/./, /<\/(?:script|pre|textarea|style)>/i, /-->/, /\?>/, />/, /\]\]>/]

const isSpaceOrTab = (c: string | undefined): boolean => c === ' ' || c === '\t'

const canContain = (parent: Kind, child: Kind): boolean => {
  switch (parent) {
    case 'root':
    case 'blockquote':
    case 'listItem':
    case 'footnoteDefinition':
      return child !== 'listItem'
    case 'list':
      return child === 'listItem'
    default:
      return false
  }
}
const acceptsLines = (k: Kind): boolean => k === 'paragraph' || k === 'code' || k === 'html' || k === 'table'

/** Splits a table row into cells on unescaped pipes. */
const splitRow = (line: string): string[] => {
  // GFM trims spaces and tabs only: a no-break space is cell content.
  let s = line.replace(/^[ \t]+|[ \t]+$/g, '')
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1)
  const cells: string[] = []
  let cell = ''
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '\\' && s[i + 1] === '|') {
      cell += '|'
      i++
    } else if (c === '|') {
      cells.push(cell.replace(/^[ \t]+|[ \t]+$/g, ''))
      cell = ''
    } else cell += c
  }
  cells.push(cell.replace(/^[ \t]+|[ \t]+$/g, ''))
  return cells
}

export class BlockParser {
  private doc: B = this.node('root', 0)
  private tip: B = this.doc
  private oldtip: B = this.doc
  private line = ''
  private lineNumber = 0
  private offset = 0
  private column = 0
  private nextNonspace = 0
  private nextNonspaceColumn = 0
  private indent = 0
  private indented = false
  private blank = false
  private partiallyConsumedTab = false
  private allClosed = true
  private lastMatched: B = this.doc
  readonly refs: Refs = new Map()
  readonly footnotes = new Set<string>()
  private inline = new InlineParser(this.refs, this.footnotes)

  private node(kind: Kind, line: number): B {
    return { kind, parent: null, children: [], open: true, startLine: line, endLine: line, content: '' }
  }

  parse(input: string): Root {
    const lines = input.replace(/￿/g, '�').split(/\r\n|\r|\n/)
    if (lines.at(-1) === '') lines.pop()
    for (const l of lines) this.incorporateLine(l)
    while (this.tip !== this.doc) this.finalize(this.tip, lines.length)
    this.finalize(this.doc, lines.length)
    const footnotes = new Map()
    const children = this.convertChildren(this.doc, footnotes)
    return { type: 'root', children, footnotes }
  }

  private findNextNonspace(): void {
    const ln = this.line
    let i = this.offset
    let cols = this.column
    let c: string | undefined
    while ((c = ln[i]) !== undefined) {
      if (c === ' ') {
        i++
        cols++
      } else if (c === '\t') {
        i++
        cols += 4 - (cols % 4)
      } else break
    }
    this.blank = c === undefined
    this.nextNonspace = i
    this.nextNonspaceColumn = cols
    this.indent = cols - this.column
    this.indented = this.indent >= CODE_INDENT
  }

  private advanceNextNonspace(): void {
    this.offset = this.nextNonspace
    this.column = this.nextNonspaceColumn
    this.partiallyConsumedTab = false
  }

  private advanceOffset(count: number, columns: boolean): void {
    let c: string | undefined
    while (count > 0 && (c = this.line[this.offset]) !== undefined) {
      if (c === '\t') {
        const toTab = 4 - (this.column % 4)
        if (columns) {
          this.partiallyConsumedTab = toTab > count
          const adv = toTab > count ? count : toTab
          this.column += adv
          this.offset += this.partiallyConsumedTab ? 0 : 1
          count -= adv
        } else {
          this.partiallyConsumedTab = false
          this.column += toTab
          this.offset++
          count--
        }
      } else {
        this.partiallyConsumedTab = false
        this.offset++
        this.column++
        count--
      }
    }
  }

  private addLine(): void {
    if (this.partiallyConsumedTab) {
      this.offset++
      this.tip.content += ' '.repeat(4 - (this.column % 4))
    }
    this.tip.content += this.line.slice(this.offset) + '\n'
  }

  private addChild(kind: Kind): B {
    while (!canContain(this.tip.kind, kind)) this.finalize(this.tip, this.lineNumber - 1)
    const b = this.node(kind, this.lineNumber)
    b.parent = this.tip
    this.tip.children.push(b)
    this.tip = b
    return b
  }

  private closeUnmatchedBlocks(): void {
    if (this.allClosed) return
    while (this.oldtip !== this.lastMatched) {
      const parent = this.oldtip.parent!
      this.finalize(this.oldtip, this.lineNumber - 1)
      this.oldtip = parent
    }
    this.allClosed = true
  }

  /** 0: matched, 1: not matched, 2: matched and consumed the line. */
  private continues(b: B): 0 | 1 | 2 {
    const ln = this.line
    switch (b.kind) {
      case 'blockquote':
        if (!this.indented && ln[this.nextNonspace] === '>') {
          this.advanceNextNonspace()
          this.advanceOffset(1, false)
          if (isSpaceOrTab(ln[this.offset])) this.advanceOffset(1, true)
          return 0
        }
        return 1
      case 'listItem': {
        const l = b.list!
        if (this.blank) {
          if (b.children.length === 0) return 1
          this.advanceNextNonspace()
        } else if (this.indent >= l.markerOffset + l.padding) {
          this.advanceOffset(l.markerOffset + l.padding, true)
        } else return 1
        return 0
      }
      case 'footnoteDefinition':
        if (this.blank) {
          this.advanceNextNonspace()
          return 0
        }
        if (this.indent >= 4) {
          this.advanceOffset(4, true)
          return 0
        }
        return 1
      case 'heading':
      case 'thematicBreak':
        return 1
      case 'code':
        if (b.fenced) {
          const m =
            this.indent <= 3 && ln[this.nextNonspace] === b.fenceChar && CLOSING_FENCE.exec(ln.slice(this.nextNonspace))
          if (m && m[0].length >= b.fenceLength!) {
            this.finalize(b, this.lineNumber)
            return 2
          }
          let i = b.fenceOffset!
          while (i > 0 && isSpaceOrTab(ln[this.offset])) {
            this.advanceOffset(1, true)
            i--
          }
          return 0
        }
        if (this.indent >= CODE_INDENT) this.advanceOffset(CODE_INDENT, true)
        else if (this.blank) this.advanceNextNonspace()
        else return 1
        return 0
      case 'html':
        return this.blank && (b.htmlType === 6 || b.htmlType === 7) ? 1 : 0
      case 'paragraph':
      case 'table':
        return this.blank ? 1 : 0
      default:
        return 0
    }
  }

  /** Tries each block start in order. 0: none, 1: container started, 2: leaf started. */
  private tryStarts(container: B): 0 | 1 | 2 {
    // Past this depth, container markers are read as text: deeper nesting has no
    // real use, and unbounded depth would overflow the stack when rendering.
    let depth = 0
    for (let p: B | null = this.tip; p; p = p.parent) depth++
    if (depth > MAX_DEPTH) return 0
    const ln = this.line
    const rest = ln.slice(this.nextNonspace)
    const c = ln[this.nextNonspace]
    if (!this.indented) {
      // Block quote
      if (c === '>') {
        this.advanceNextNonspace()
        this.advanceOffset(1, false)
        if (isSpaceOrTab(ln[this.offset])) this.advanceOffset(1, true)
        this.closeUnmatchedBlocks()
        this.addChild('blockquote')
        return 1
      }
      // ATX heading
      let m = c === '#' ? ATX.exec(rest) : null
      if (m) {
        this.advanceNextNonspace()
        this.advanceOffset(m[0].length, false)
        this.closeUnmatchedBlocks()
        const h = this.addChild('heading')
        h.depth = m[0].trim().length
        h.content = ln
          .slice(this.offset)
          .replace(/^[ \t]*#+[ \t]*$/, '')
          .replace(/[ \t]+#+[ \t]*$/, '')
        this.advanceOffset(ln.length - this.offset, false)
        return 2
      }
      // Fenced code
      if ((c === '`' || c === '~') && (m = FENCE.exec(rest))) {
        this.closeUnmatchedBlocks()
        const b = this.addChild('code')
        b.fenced = true
        b.fenceLength = m[0].length
        b.fenceChar = m[0][0]
        b.fenceOffset = this.indent
        this.advanceNextNonspace()
        this.advanceOffset(m[0].length, false)
        return 2
      }
      // HTML block
      if (c === '<') {
        for (let t = 1; t <= 7; t++) {
          if (
            HTML_OPEN[t]!.test(rest) &&
            (t < 7 ||
              (container.kind !== 'paragraph' && !(!this.allClosed && !this.blank && this.tip.kind === 'paragraph')))
          ) {
            this.closeUnmatchedBlocks()
            const b = this.addChild('html')
            b.htmlType = t
            return 2
          }
        }
      }
      // Setext heading
      if (container.kind === 'paragraph' && (c === '=' || c === '-') && SETEXT.test(rest)) {
        this.closeUnmatchedBlocks()
        this.extractReferences(container)
        if (container.content.length > 0) {
          container.kind = 'heading'
          container.depth = c === '=' ? 1 : 2
          this.advanceOffset(ln.length - this.offset, false)
          return 2
        }
      }
      // GFM table: a delimiter row turns the paragraph's last line into a header row.
      if (container.kind === 'paragraph' && (c === '|' || c === ':' || c === '-') && TABLE_DELIM.test(rest)) {
        const lines = container.content.replace(/\n$/, '').split('\n')
        const header = lines.at(-1)!
        const align = splitRow(rest).map((d) => {
          const l = d.startsWith(':')
          const r = d.endsWith(':')
          return l && r ? 'center' : l ? 'left' : r ? 'right' : null
        })
        if ((header.includes('|') || rest.includes('|')) && splitRow(header).length === align.length) {
          this.closeUnmatchedBlocks()
          const before = lines.slice(0, -1)
          const table = this.node('table', this.lineNumber - 1)
          table.parent = container.parent
          table.align = align
          table.rows = [header]
          if (before.length) {
            container.content = before.join('\n') + '\n'
            container.parent!.children.push(table)
            this.finalize(container, this.lineNumber - 2)
          } else {
            const siblings = container.parent!.children
            siblings[siblings.indexOf(container)] = table
          }
          this.tip = table
          this.advanceOffset(ln.length - this.offset, false)
          return 2
        }
      }
      // Thematic break
      if ((c === '*' || c === '-' || c === '_') && THEMATIC.test(rest)) {
        this.closeUnmatchedBlocks()
        this.addChild('thematicBreak')
        this.advanceOffset(ln.length - this.offset, false)
        return 2
      }
      // GFM footnote definition
      if (c === '[' && (m = FOOTNOTE_DEF.exec(rest))) {
        this.closeUnmatchedBlocks()
        const b = this.addChild('footnoteDefinition')
        b.label = m[1]!
        this.footnotes.add(normalizeLabel(`[${m[1]}]`))
        this.advanceNextNonspace()
        this.advanceOffset(m[0].length, false)
        if (isSpaceOrTab(ln[this.offset])) this.advanceOffset(1, true)
        return 1
      }
    }
    // List item
    if (!this.indented || container.kind === 'list') {
      const data = this.parseListMarker(container)
      if (data) {
        this.closeUnmatchedBlocks()
        const l = this.tip.list
        if (
          this.tip.kind !== 'list' ||
          !l ||
          l.ordered !== data.ordered ||
          l.delimiter !== data.delimiter ||
          l.bullet !== data.bullet
        ) {
          this.addChild('list').list = data
        }
        this.addChild('listItem').list = data
        return 1
      }
    }
    // Indented code
    if (this.indented && this.tip.kind !== 'paragraph' && !this.blank) {
      this.advanceOffset(CODE_INDENT, true)
      this.closeUnmatchedBlocks()
      this.addChild('code')
      return 2
    }
    return 0
  }

  private parseListMarker(container: B): ListData | null {
    if (this.indent >= 4) return null
    const rest = this.line.slice(this.nextNonspace)
    const data: ListData = {
      ordered: false,
      bullet: '',
      delimiter: '',
      start: 1,
      markerOffset: this.indent,
      padding: 0,
    }
    let m = BULLET.exec(rest)
    if (m) data.bullet = m[0]
    else if ((m = ORDERED.exec(rest)) && (container.kind !== 'paragraph' || m[1] === '1')) {
      data.ordered = true
      data.start = Number.parseInt(m[1]!, 10)
      data.delimiter = m[2]!
    } else return null
    const next = this.line[this.nextNonspace + m[0].length]
    if (!(next === undefined || next === '\t' || next === ' ')) return null
    if (container.kind === 'paragraph' && !/[^ \t]/.test(this.line.slice(this.nextNonspace + m[0].length))) return null
    this.advanceNextNonspace()
    this.advanceOffset(m[0].length, true)
    const startCol = this.column
    const startOffset = this.offset
    do {
      this.advanceOffset(1, true)
    } while (this.column - startCol < 5 && isSpaceOrTab(this.line[this.offset]))
    const blankItem = this.line[this.offset] === undefined
    const spaces = this.column - startCol
    if (spaces >= 5 || spaces < 1 || blankItem) {
      data.padding = m[0].length + 1
      this.column = startCol
      this.offset = startOffset
      if (isSpaceOrTab(this.line[this.offset])) this.advanceOffset(1, true)
    } else data.padding = m[0].length + spaces
    return data
  }

  private incorporateLine(ln: string): void {
    let container = this.doc
    this.oldtip = this.tip
    this.offset = 0
    this.column = 0
    this.blank = false
    this.partiallyConsumedTab = false
    this.lineNumber++
    this.line = ln.includes('\0') ? ln.replace(/\0/g, '�') : ln

    let last: B | undefined
    while ((last = container.children.at(-1)) && last.open) {
      container = last
      this.findNextNonspace()
      const r = this.continues(container)
      if (r === 2) return
      if (r === 1) {
        container = container.parent!
        break
      }
    }
    this.allClosed = container === this.oldtip
    this.lastMatched = container

    let matchedLeaf = acceptsLines(container.kind) && container.kind !== 'paragraph' && container.kind !== 'table'
    while (!matchedLeaf) {
      this.findNextNonspace()
      if (!this.indented && !MAYBE_SPECIAL.test(ln.slice(this.nextNonspace))) {
        this.advanceNextNonspace()
        break
      }
      const r = this.tryStarts(container)
      if (r === 0) {
        this.advanceNextNonspace()
        break
      }
      container = this.tip
      if (r === 2) matchedLeaf = true
    }

    if (!this.allClosed && !this.blank && this.tip.kind === 'paragraph') {
      // Lazy paragraph continuation
      this.addLine()
      return
    }
    this.closeUnmatchedBlocks()
    const k = container.kind
    if (k === 'table') {
      // The delimiter row itself was consumed when the table started.
      if (this.offset < this.line.length) container.rows!.push(this.line.slice(this.offset))
    } else if (acceptsLines(k)) {
      this.addLine()
      if (
        k === 'html' &&
        container.htmlType! <= 5 &&
        HTML_CLOSE[container.htmlType!]!.test(this.line.slice(this.offset))
      ) {
        this.finalize(container, this.lineNumber)
      }
    } else if (this.offset < ln.length && !this.blank) {
      this.addChild('paragraph')
      this.advanceNextNonspace()
      this.addLine()
    }
  }

  private extractReferences(b: B): void {
    let pos: number
    while (b.content[0] === '[' && (pos = this.inline.parseReference(b.content))) b.content = b.content.slice(pos)
  }

  private finalize(b: B, line: number): void {
    const parent = b.parent
    b.open = false
    b.endLine = line
    switch (b.kind) {
      case 'paragraph':
        if (b.content[0] === '[') {
          this.extractReferences(b)
          if (!/[^ \t\n]/.test(b.content)) b.content = ''
        }
        break
      case 'code':
        if (!b.fenced) {
          const lines = b.content.split('\n')
          while (lines.length && /^[ \t]*$/.test(lines.at(-1)!)) lines.pop()
          b.content = lines.join('\n') + '\n'
          b.endLine = b.startLine + lines.length - 1
        }
        break
      case 'listItem':
        b.endLine = b.children.at(-1)?.endLine ?? b.startLine
        break
      case 'list':
        b.endLine = b.children.at(-1)!.endLine
        break
    }
    this.tip = parent ?? this.doc
  }

  private convertChildren(b: B, footnotes: Root['footnotes']): Block[] {
    const out: Block[] = []
    for (const c of b.children) {
      const block = this.convert(c, footnotes)
      if (block) out.push(block)
    }
    return out
  }

  private convert(b: B, footnotes: Root['footnotes']): Block | null {
    const position: Pos = { start: { line: b.startLine }, end: { line: b.endLine } }
    const inline = (s: string): Inline[] => this.inline.parse(s.replace(/^[ \t\n]+|[ \t\n]+$/g, ''))
    switch (b.kind) {
      case 'paragraph':
        if (b.content === '') return null
        return { type: 'paragraph', children: inline(b.content), position }
      case 'heading':
        return { type: 'heading', depth: b.depth!, children: inline(b.content), position }
      case 'thematicBreak':
        return { type: 'thematicBreak', position }
      case 'blockquote':
        return { type: 'blockquote', children: this.convertChildren(b, footnotes), position }
      case 'html':
        return { type: 'html', value: b.content.replace(/\n$/, ''), position }
      case 'code': {
        if (!b.fenced) return { type: 'code', lang: null, meta: null, value: b.content.replace(/\n$/, ''), position }
        const nl = b.content.indexOf('\n')
        const info = unescapeString(b.content.slice(0, nl).trim())
        const [lang, ...meta] = info.split(/[ \t]+/)
        const value = b.content.slice(nl + 1).replace(/\n$/, '')
        return { type: 'code', lang: lang || null, meta: meta.join(' ') || null, value, position }
      }
      case 'list': {
        const items = b.children.map((item) => {
          const children = this.convertChildren(item, footnotes)
          let checked: boolean | null = null
          const first = children[0]
          const head = first?.type === 'paragraph' ? first.children[0] : undefined
          // A task marker needs whitespace after it and content after that.
          const m = head?.type === 'text' ? /^\[([ \txX])\][ \t\n]+/.exec(head.value) : null
          if (head?.type === 'text' && m && (head.value.length > m[0].length || first!.children.length > 1)) {
            checked = m[1] === 'x' || m[1] === 'X'
            head.value = head.value.slice(m[0].length)
            if (!head.value) (first as { children: Inline[] }).children.shift()
          }
          // An item is spread when a blank line separates its children.
          let spread = false
          for (let j = 0; j + 1 < item.children.length; j++) {
            if (item.children[j]!.endLine !== item.children[j + 1]!.startLine - 1) spread = true
          }
          return {
            type: 'listItem' as const,
            checked,
            spread,
            children,
            position: { start: { line: item.startLine }, end: { line: item.endLine } },
          }
        })
        // A list is loose when blank lines separate its items or the children of any item.
        let spread = items.some((it) => it.spread)
        for (let j = 0; j + 1 < b.children.length; j++) {
          if (b.children[j]!.endLine !== b.children[j + 1]!.startLine - 1) spread = true
        }
        const l = b.list!
        return {
          type: 'list',
          ordered: l.ordered,
          start: l.ordered ? l.start : null,
          spread,
          children: items,
          position,
        }
      }
      case 'table': {
        const width = b.align!.length
        const rows = b.rows!.map((r) => {
          const cells = splitRow(r).slice(0, width)
          while (cells.length < width) cells.push('')
          return {
            type: 'tableRow' as const,
            children: cells.map((c) => ({ type: 'tableCell' as const, children: this.inline.parse(c) })),
          }
        })
        return { type: 'table', align: b.align!, children: rows, position }
      }
      case 'footnoteDefinition': {
        const id = normalizeLabel(`[${b.label}]`)
        const def = {
          type: 'footnoteDefinition' as const,
          identifier: id,
          label: b.label!,
          children: this.convertChildren(b, footnotes),
          position,
        }
        if (!footnotes.has(id)) footnotes.set(id, def)
        return null
      }
      default:
        return null
    }
  }
}

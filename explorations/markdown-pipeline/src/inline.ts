/**
 * Inline parser: CommonMark's delimiter-run and bracket algorithms (ported
 * from commonmark.js), plus GFM strikethrough, autolink literals and footnote
 * calls. Produces mdast-shaped nodes.
 */
import { REF } from './html'

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'emphasis' | 'strong' | 'delete'; children: Inline[] }
  | { type: 'inlineCode'; value: string }
  | { type: 'break' }
  | { type: 'html'; value: string }
  | { type: 'link'; url: string; title: string | null; children: Inline[] }
  | { type: 'image'; url: string; title: string | null; alt: string }
  | { type: 'footnoteReference'; identifier: string; label: string }

export type Refs = Map<string, { url: string; title: string | null }>

/** Linked-list node used while parsing, because emphasis rewires siblings. */
type N = {
  type: string
  value?: string
  url?: string
  title?: string | null
  identifier?: string
  parent?: N
  prev?: N
  next?: N
  first?: N
  last?: N
}

type Delim = {
  cc: string
  num: number
  orig: number
  node: N
  prev: Delim | null
  next: Delim | null
  open: boolean
  close: boolean
}
type Bracket = {
  node: N
  prev: Bracket | null
  prevDelim: Delim | null
  index: number
  image: boolean
  active: boolean
  bracketAfter: boolean
}

const append = (p: N, c: N): void => {
  c.parent = p
  c.prev = p.last
  c.next = undefined
  if (p.last) p.last.next = c
  else p.first = c
  p.last = c
}
const unlink = (c: N): void => {
  if (c.prev) c.prev.next = c.next
  else if (c.parent) c.parent.first = c.next
  if (c.next) c.next.prev = c.prev
  else if (c.parent) c.parent.last = c.prev
  c.parent = c.prev = c.next = undefined
}
const insertAfter = (a: N, c: N): void => {
  unlink(c)
  c.next = a.next
  if (c.next) c.next.prev = c
  c.prev = a
  a.next = c
  c.parent = a.parent
  if (!c.next && c.parent) c.parent.last = c
}
const text = (value: string): N => ({ type: 'text', value })

const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/
const PUNCT = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~\p{P}\p{S}]/u
const WHITESPACE = /\s/
const MAIN = /[^\n`[\]\\!<&*_~]+/y
const ENTITY = /&(?:#x[a-f0-9]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});/iy
const TAGNAME = '[A-Za-z][A-Za-z0-9-]*'
const ATTRIBUTE = `(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)`
export const OPENTAG = `<${TAGNAME}${ATTRIBUTE}*\\s*/?>`
export const CLOSETAG = `</${TAGNAME}\\s*[>]`
const HTML_TAG = new RegExp(
  `(?:${OPENTAG}|${CLOSETAG}|<!-->|<!--->|<!--[\\s\\S]*?-->|[<][?][\\s\\S]*?[?][>]|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`,
  'iy',
)
const AUTOLINK = /<[A-Za-z][A-Za-z0-9.+-]{1,31}:[^<>\x00-\x20]*>/y
const EMAIL_AUTOLINK =
  /<([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/y
const LINK_LABEL = /\[(?:[^\\[\]]|\\[\s\S]){0,1000}\]/y
const LINK_TITLE = /"(?:\\[\s\S]|[^\\"\x00])*"|'(?:\\[\s\S]|[^\\'\x00])*'|\((?:\\[\s\S]|[^\\()\x00])*\)/y
const DEST_BRACES = /<(?:[^<>\n\\\x00]|\\[\s\S])*>/y
const SPNL = /[ \t]*(?:\n[ \t]*)?/y
const TICKS = /`+/g

/**
 * Named references the parser decodes itself, so heading text and URLs
 * read naturally. Every other valid name is written through for the browser to
 * decode, which renders identically without shipping the 2,125-name table.
 */
const COMMON: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '©',
  reg: '®',
  trade: '™',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  bull: '•',
  middot: '·',
  times: '×',
  divide: '÷',
  deg: '°',
  euro: '€',
  larr: '←',
  rarr: '→',
  uarr: '↑',
  darr: '↓',
  harr: '↔',
  le: '≤',
  ge: '≥',
  ne: '≠',
  plusmn: '±',
  laquo: '«',
  raquo: '»',
  sect: '§',
  para: '¶',
}
/**
 * Names HTML decodes even without a trailing `;`. A browser reads `&notit;`
 * as `¬it;`, while CommonMark keeps it literal, so an unknown name starting
 * with one of these is escaped instead of written through, unless it is one of
 * the valid longer names below.
 */
const LEGACY =
  'AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml'.split(
    ' ',
  )
const LEGACY_PREFIXED = new Set(
  'GTGT LTLT ampersand angmsd angmsdaa angmsdab angmsdac angmsdad angmsdae angmsdaf angmsdag angmsdah angst gtcc gtcir gtdot gtlPar gtquest gtrapprox gtrarr gtrdot gtreqless gtreqqless gtrless gtrsim ltcc ltcir ltdot lthree ltimes ltlarr ltquest ltrPar ltri ltrie ltrif notin notinE notindot notinva notinvb notinvc notni notniva notnivb notnivc parallel parsim parsl part times timesb timesbar timesd'.split(
    ' ',
  ),
)

export const decodeEntity = (ref: string): string => {
  if (ref[1] === '#') {
    const hex = ref[2] === 'x' || ref[2] === 'X'
    const cp = Number.parseInt(ref.slice(hex ? 3 : 2, -1), hex ? 16 : 10)
    return cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff) ? '\ufffd' : String.fromCodePoint(cp)
  }
  const name = ref.slice(1, -1)
  const common = COMMON[name]
  if (common) return common
  if (LEGACY.includes(name) || LEGACY_PREFIXED.has(name) || !LEGACY.some((p) => name.startsWith(p))) {
    return REF + ref.slice(1)
  }
  return ref
}

const ENTITY_OR_ESCAPE =
  /\\[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]|&(?:#x[a-f0-9]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});/gi
export const unescapeString = (s: string): string =>
  s.includes('\\') || s.includes('&')
    ? s.replace(ENTITY_OR_ESCAPE, (m) => (m[0] === '\\' ? m[1]! : decodeEntity(m)))
    : s

/** CommonMark's URL normalization: percent-encode, keeping existing `%XX` escapes and character references. */
export const normalizeUri = (s: string): string =>
  s.replace(/%(?![0-9a-fA-F]{2})|[^\w;/?:@&=+$,\-.!~*'()#%\uffff]/gu, (c) => {
    if (c === '%') return '%25'
    try {
      return encodeURIComponent(c)
    } catch {
      return '%EF%BF%BD'
    }
  })

export const normalizeLabel = (s: string): string =>
  s
    .slice(1, -1)
    .trim()
    .replace(/[ \t\r\n]+/g, ' ')
    .toLowerCase()
    .toUpperCase()

export class InlineParser {
  private s = ''
  private pos = 0
  private delims: Delim | null = null
  private brackets: Bracket | null = null
  /**
   * Searches that already ran to the end of the input without finding their
   * closer. Positions only move forward, so a later search would fail too;
   * remembering that keeps unclosed backticks and comments linear.
   */
  private noTicks = new Map<number, number>()
  private noCommentAfter = -1
  /** Raw HTML is literal text when inline Markdown runs inside raw HTML. */
  htmlAsText = false

  constructor(
    readonly refs: Refs,
    readonly footnotes: Set<string>,
  ) {}

  parse(content: string): Inline[] {
    this.s = content
    this.pos = 0
    this.delims = null
    this.brackets = null
    this.noTicks.clear()
    this.noCommentAfter = -1
    const root: N = { type: 'root' }
    while (this.pos < this.s.length) this.parseInline(root)
    this.processEmphasis(null)
    return toMdast(root, true)
  }

  private match(re: RegExp): string | null {
    re.lastIndex = this.pos
    const m = re.exec(this.s)
    if (!m) return null
    this.pos = re.lastIndex
    return m[0]
  }

  private parseInline(block: N): void {
    const c = this.s[this.pos]!
    if (MAY_START_LITERAL.test(c) && this.parseLiteral(block)) return
    switch (c) {
      case '\n':
        return this.parseNewline(block)
      case '\\':
        return this.parseBackslash(block)
      case '`':
        return this.parseBackticks(block)
      case '*':
      case '_':
      case '~':
        return this.handleDelim(c, block)
      case '[':
        this.pos++
        append(block, text('['))
        return this.addBracket(block.last!, this.pos - 1, false)
      case '!':
        this.pos++
        if (this.s[this.pos] === '[') {
          this.pos++
          append(block, text('!['))
          return this.addBracket(block.last!, this.pos - 1, true)
        }
        return append(block, text('!'))
      case ']':
        return this.parseCloseBracket(block)
      case '<':
        return this.parseLt(block)
      case '&': {
        const m = this.match(ENTITY)
        return append(block, text(m ? decodeEntity(m) : (this.pos++, '&')))
      }
      default: {
        const start = this.pos
        const m = this.match(MAIN)
        if (!m) return append(block, text((this.pos++, c)))
        // Stop the run where an autolink literal could start, so it is tried there.
        const cut = literalCandidate(this.s, start + 1, this.pos)
        if (cut !== -1) this.pos = cut
        append(block, text(this.s.slice(start, this.pos)))
      }
    }
  }

  /**
   * GFM autolink literals at the tokenizer level, ported from
   * `micromark-extension-gfm-autolink-literal`: they are tried before
   * emphasis, escapes and entities, so a `*` or `\\` inside a URL stays part
   * of it. None start inside an open `[` label, as in micromark.
   */
  private parseLiteral(block: N): boolean {
    if (this.brackets) return false
    const end = literalAt(this.s, this.pos)
    if (!end) return false
    const value = this.s.slice(this.pos, end.end)
    const link: N = { type: 'link', url: normalizeUri(end.prefix + value), title: null }
    append(link, text(value))
    append(block, link)
    this.pos = end.end
    return true
  }

  private parseNewline(block: N): void {
    this.pos++
    const last = block.last
    if (last?.type === 'text' && last.value!.endsWith(' ')) {
      const hard = last.value!.endsWith('  ')
      last.value = last.value!.replace(/ +$/, '')
      append(block, hard ? { type: 'break' } : text('\n'))
    } else append(block, text('\n'))
    while (this.s[this.pos] === ' ' || this.s[this.pos] === '\t') this.pos++
  }

  private parseBackslash(block: N): void {
    this.pos++
    const c = this.s[this.pos]
    if (c === '\n') {
      this.pos++
      append(block, { type: 'break' })
    } else if (c && ESCAPABLE.test(c)) {
      this.pos++
      append(block, text(c))
    } else append(block, text('\\'))
  }

  private parseBackticks(block: N): void {
    const start = this.pos
    while (this.s[this.pos] === '`') this.pos++
    const ticks = this.s.slice(start, this.pos)
    const after = this.pos
    if ((this.noTicks.get(ticks.length) ?? Number.POSITIVE_INFINITY) <= after) return append(block, text(ticks))
    TICKS.lastIndex = after
    let m: RegExpExecArray | null
    while ((m = TICKS.exec(this.s))) {
      if (m[0].length === ticks.length) {
        let v = this.s.slice(after, m.index).replace(/\n/g, ' ')
        if (v.length > 1 && v[0] === ' ' && v.at(-1) === ' ' && /[^ ]/.test(v)) v = v.slice(1, -1)
        this.pos = m.index + ticks.length
        return append(block, { type: 'inlineCode', value: v })
      }
    }
    this.noTicks.set(ticks.length, after)
    append(block, text(ticks))
  }

  private parseLt(block: N): void {
    let m = this.match(EMAIL_AUTOLINK)
    if (m) {
      const dest = m.slice(1, -1)
      const link: N = { type: 'link', url: normalizeUri('mailto:' + dest), title: null }
      append(link, text(dest))
      return append(block, link)
    }
    if ((m = this.match(AUTOLINK))) {
      const dest = m.slice(1, -1)
      const link: N = { type: 'link', url: normalizeUri(dest), title: null }
      append(link, text(dest))
      return append(block, link)
    }
    if (
      this.s.startsWith('<!--', this.pos) &&
      !this.s.startsWith('<!-->', this.pos) &&
      !this.s.startsWith('<!--->', this.pos)
    ) {
      const unclosed =
        (this.noCommentAfter !== -1 && this.noCommentAfter <= this.pos) || this.s.indexOf('-->', this.pos + 4) === -1
      if (unclosed) {
        this.noCommentAfter = this.pos
        this.pos++
        return append(block, text('<'))
      }
    }
    if ((m = this.match(HTML_TAG))) {
      return append(block, this.htmlAsText ? text(m) : { type: 'html', value: m })
    }
    this.pos++
    append(block, text('<'))
  }

  private scanDelims(cc: string): { num: number; open: boolean; close: boolean } | null {
    const start = this.pos
    let num = 0
    while (this.s[this.pos] === cc) {
      num++
      this.pos++
    }
    const before = start === 0 ? '\n' : String.fromCodePoint(this.s.codePointAt(start - 1)!)
    const lo = this.s.charCodeAt(start - 1)
    const b = lo >= 0xdc00 && lo <= 0xdfff && start > 1 ? String.fromCodePoint(this.s.codePointAt(start - 2)!) : before
    const after = this.pos >= this.s.length ? '\n' : String.fromCodePoint(this.s.codePointAt(this.pos)!)
    this.pos = start
    const aW = WHITESPACE.test(after)
    const aP = PUNCT.test(after)
    const bW = WHITESPACE.test(b)
    const bP = PUNCT.test(b)
    const left = !aW && (!aP || bW || bP)
    const right = !bW && (!bP || aW || aP)
    if (cc === '_') return { num, open: left && (!right || bP), close: right && (!left || aP) }
    return { num, open: left, close: right }
  }

  private handleDelim(cc: string, block: N): void {
    const res = this.scanDelims(cc)!
    const start = this.pos
    this.pos += res.num
    const node = text(this.s.slice(start, this.pos))
    append(block, node)
    // GFM strikethrough takes runs of one or two tildes only.
    if (cc === '~' && res.num > 2) return
    if (res.open || res.close) {
      this.delims = {
        cc,
        num: res.num,
        orig: res.num,
        node,
        prev: this.delims,
        next: null,
        open: res.open,
        close: res.close,
      }
      if (this.delims.prev) this.delims.prev.next = this.delims
    }
  }

  private removeDelim(d: Delim): void {
    if (d.prev) d.prev.next = d.next
    if (d.next) d.next.prev = d.prev
    else this.delims = d.prev
  }

  private processEmphasis(bottom: Delim | null): void {
    const openersBottom: Record<string, Delim | null> = {}
    let closer = this.delims
    while (closer && closer.prev !== bottom) closer = closer.prev
    while (closer) {
      if (!closer.close) {
        closer = closer.next
        continue
      }
      const cc = closer.cc
      const key = cc === '~' ? `~${closer.num}` : `${cc}${closer.open ? 1 : 0}${closer.orig % 3}`
      let opener = closer.prev
      let found = false
      const limit = key in openersBottom ? openersBottom[key] : bottom
      while (opener && opener !== bottom && opener !== limit) {
        if (opener.cc === cc && opener.open) {
          if (cc === '~') {
            if (opener.num === closer.num) {
              found = true
              break
            }
          } else {
            const odd = (closer.open || opener.close) && closer.orig % 3 !== 0 && (opener.orig + closer.orig) % 3 === 0
            if (!odd) {
              found = true
              break
            }
          }
        }
        opener = opener.prev
      }
      const oldCloser = closer
      if (found && opener) {
        const use = cc === '~' ? closer.num : closer.num >= 2 && opener.num >= 2 ? 2 : 1
        const o = opener.node
        const c = closer.node
        opener.num -= use
        closer.num -= use
        o.value = o.value!.slice(0, o.value!.length - use)
        c.value = c.value!.slice(0, c.value!.length - use)
        const wrap: N = { type: cc === '~' ? 'delete' : use === 1 ? 'emphasis' : 'strong' }
        let t = o.next
        while (t && t !== c) {
          const nx = t.next
          unlink(t)
          append(wrap, t)
          t = nx
        }
        insertAfter(o, wrap)
        if (opener.next !== closer) {
          opener.next = closer
          closer.prev = opener
        }
        if (opener.num === 0) {
          unlink(o)
          this.removeDelim(opener)
        }
        if (closer.num === 0) {
          unlink(c)
          const nx = closer.next
          this.removeDelim(closer)
          closer = nx
        }
      } else {
        closer = closer.next
        openersBottom[key] = oldCloser.prev
        if (!oldCloser.open) this.removeDelim(oldCloser)
      }
    }
    while (this.delims && this.delims !== bottom) this.removeDelim(this.delims)
  }

  private addBracket(node: N, index: number, image: boolean): void {
    if (this.brackets) this.brackets.bracketAfter = true
    this.brackets = {
      node,
      prev: this.brackets,
      prevDelim: this.delims,
      index,
      image,
      active: true,
      bracketAfter: false,
    }
  }

  private parseLinkDestination(): string | null {
    const braced = this.match(DEST_BRACES)
    if (braced !== null) return normalizeUri(unescapeString(braced.slice(1, -1)))
    if (this.s[this.pos] === '<') return null
    const start = this.pos
    let parens = 0
    let c = ''
    while (this.pos < this.s.length) {
      c = this.s[this.pos]!
      if (c === '\\' && ESCAPABLE.test(this.s[this.pos + 1] ?? '')) this.pos += 2
      else if (c === '(') {
        // The spec allows a nesting limit; cmark uses 32. Without one, `[a](b` repeated is quadratic.
        if (++parens > 32) return null
        this.pos++
      } else if (c === ')') {
        if (parens < 1) break
        this.pos++
        parens--
      } else if (c.charCodeAt(0) <= 0x20 || c === '\x7f') break
      else this.pos++
    }
    if (this.pos === start && c !== ')') return null
    if (parens !== 0) return null
    return normalizeUri(unescapeString(this.s.slice(start, this.pos)))
  }

  private parseLinkTitle(): string | null {
    const t = this.match(LINK_TITLE)
    return t === null ? null : unescapeString(t.slice(1, -1))
  }

  private parseLinkLabel(): number {
    const m = this.match(LINK_LABEL)
    return m === null || m.length > 1001 ? 0 : m.length
  }

  private parseCloseBracket(block: N): void {
    this.pos++
    const start = this.pos
    const opener = this.brackets
    if (!opener) return append(block, text(']'))
    if (!opener.active) {
      append(block, text(']'))
      this.brackets = opener.prev
      return
    }
    const image = opener.image
    const save = this.pos
    let matched = false
    let dest: string | null = null
    let title: string | null = null

    // GFM footnote call: `[^label]`, when the label is defined.
    if (!image && this.s[opener.index + 1] === '^') {
      const id = normalizeLabel(this.s.slice(opener.index + 1, start).replace(/^\[\^/, '['))
      if (this.footnotes.has(id)) {
        let t = opener.node.next
        while (t) {
          const nx = t.next
          unlink(t)
          t = nx
        }
        unlink(opener.node)
        this.processEmphasis(opener.prevDelim)
        this.brackets = opener.prev
        return append(block, {
          type: 'footnoteReference',
          identifier: id,
          value: this.s.slice(opener.index + 2, start - 1),
        })
      }
    }

    if (this.s[this.pos] === '(') {
      this.pos++
      this.match(SPNL)
      dest = this.parseLinkDestination()
      if (dest !== null) {
        this.match(SPNL)
        if (/[ \t\n]/.test(this.s[this.pos - 1]!)) title = this.parseLinkTitle()
        this.match(SPNL)
        if (this.s[this.pos] === ')') {
          this.pos++
          matched = true
        }
      }
      if (!matched) this.pos = save
    }
    if (!matched) {
      const beforeLabel = this.pos
      const n = this.parseLinkLabel()
      let label: string | undefined
      if (n > 2) label = this.s.slice(beforeLabel, beforeLabel + n)
      else if (!opener.bracketAfter) label = this.s.slice(opener.index, start)
      if (n === 0) this.pos = save
      if (label) {
        const ref = this.refs.get(normalizeLabel(label))
        if (ref) {
          dest = ref.url
          title = ref.title
          matched = true
        }
      }
    }
    if (!matched) {
      this.brackets = opener.prev
      this.pos = start
      return append(block, text(']'))
    }
    const node: N = { type: image ? 'image' : 'link', url: dest!, title }
    let t = opener.node.next
    while (t) {
      const nx = t.next
      unlink(t)
      append(node, t)
      t = nx
    }
    append(block, node)
    this.processEmphasis(opener.prevDelim)
    this.brackets = opener.prev
    unlink(opener.node)
    if (!image) {
      for (let o = this.brackets; o; o = o.prev) if (!o.image) o.active = false
    }
  }

  /** Parses a link reference definition at the start of `s`. Returns the characters consumed, or 0. */
  parseReference(s: string): number {
    this.s = s
    this.pos = 0
    const n = this.parseLinkLabel()
    if (n === 0 || s[n] !== ':') return 0
    const label = s.slice(0, n)
    this.pos = n + 1
    this.match(SPNL)
    const dest = this.parseLinkDestination()
    if (dest === null) return 0
    const beforeTitle = this.pos
    this.match(SPNL)
    let title: string | null = null
    if (this.pos !== beforeTitle) title = this.parseLinkTitle()
    if (title === null) this.pos = beforeTitle
    const eol = /[ \t]*(?:\n|$)/y
    if (this.match(eol) === null) {
      if (title === null) return 0
      title = null
      this.pos = beforeTitle
      if (this.match(eol) === null) return 0
    }
    const key = normalizeLabel(label)
    if (!key) return 0
    if (!this.refs.has(key)) this.refs.set(key, { url: dest, title })
    return this.pos
  }
}

const isAsciiAlpha = (c: string | undefined): boolean => c !== undefined && /[A-Za-z]/.test(c)
const isAsciiAlnum = (c: string | undefined): boolean => c !== undefined && /[A-Za-z0-9]/.test(c)
const isAtext = (c: string | undefined): boolean => c !== undefined && /[+\-._A-Za-z0-9]/.test(c)
/** Ends a URL: end of input, a space or line ending, or Unicode whitespace. */
const isBreak = (c: string | undefined): boolean => c === undefined || /\s/.test(c)
const isUnicodePunct = (c: string | undefined): boolean => c !== undefined && /[\p{P}\p{S}]/u.test(c)
const isControl = (c: string | undefined): boolean => c !== undefined && (c.charCodeAt(0) < 32 || c === '\x7f')

const MAY_START_LITERAL = /[+\-._A-Za-z0-9]/
const PREVIOUS_WWW = /[(*_[\]~ \t\n\r]/

/** Whether the rest from `i` is trailing punctuation that is not part of a URL. */
const isTrail = (s: string, i: number): boolean => {
  for (;;) {
    const c = s[i]
    if (c === '<' || isBreak(c)) return true
    if (c !== undefined && '!"\')*,.:;?_~'.includes(c)) {
      i++
    } else if (c === '&') {
      i++
      if (!isAsciiAlpha(s[i])) return false
      while (isAsciiAlpha(s[i])) i++
      if (s[i] !== ';') return false
      i++
    } else if (c === ']') {
      i++
      const d = s[i]
      if (d === '(' || d === '[' || isBreak(d)) return true
    } else return false
  }
}

const domainEnd = (s: string, i: number): number => {
  let underscore = false
  let underscoreBefore = false
  let seen = false
  for (;;) {
    const c = s[i]
    if (c === '.' || c === '_') {
      if (isTrail(s, i)) break
      if (c === '_') underscore = true
      else {
        underscoreBefore = underscore
        underscore = false
      }
      i++
      continue
    }
    if (isBreak(c) || (c !== '-' && isUnicodePunct(c))) break
    seen = true
    i++
  }
  return underscoreBefore || underscore || !seen ? -1 : i
}

const pathEnd = (s: string, i: number): number => {
  let open = 0
  let close = 0
  for (;;) {
    const c = s[i]
    if (c === '(') {
      open++
      i++
    } else if (c === ')' && close < open) {
      close++
      i++
    } else if (c !== undefined && '!"&\')*,.:;<?]_~'.includes(c)) {
      if (isTrail(s, i)) return i
      if (c === ')') close++
      i++
    } else if (isBreak(c)) return i
    else i++
  }
}

/** The end of a `www.`, `http(s)://` or email literal starting at `i`, and the prefix its URL needs. */
const literalAt = (s: string, i: number): { end: number; prefix: string } | null => {
  const prev = s[i - 1]
  const c = s[i]!
  // Email: tried first at every character, as in micromark.
  if (isAtext(c) && prev !== '/' && !isAtext(prev)) {
    let j = i
    while (isAtext(s[j])) j++
    if (s[j] === '@') {
      j++
      let data = false
      let dot = false
      for (;;) {
        const d = s[j]
        if (d === '.' && isAsciiAlnum(s[j + 1])) {
          dot = true
          j++
        } else if (d === '-' || d === '_' || isAsciiAlnum(d)) {
          data = true
          j++
        } else break
      }
      if (data && dot && isAsciiAlpha(s[j - 1])) return { end: j, prefix: 'mailto:' }
    }
  }
  if ((c === 'h' || c === 'H') && !isAsciiAlpha(prev)) {
    const m = /^https?:\/\//i.exec(s.slice(i, i + 8))
    if (m) {
      const after = i + m[0].length
      const d = s[after]
      if (!isBreak(d) && !isControl(d) && !isUnicodePunct(d)) {
        const domain = domainEnd(s, after)
        if (domain !== -1) return { end: pathEnd(s, domain), prefix: '' }
      }
    }
  }
  if (
    (c === 'w' || c === 'W') &&
    (prev === undefined || PREVIOUS_WWW.test(prev)) &&
    /^www\./i.test(s.slice(i, i + 4)) &&
    s[i + 4] !== undefined
  ) {
    const domain = domainEnd(s, i)
    if (domain !== -1) return { end: pathEnd(s, domain), prefix: 'http://' }
  }
  return null
}

/** The first position in `s[from, to)` where a literal could start, or -1. Cheap enough for every text run. */
const literalCandidate = (s: string, from: number, to: number): number => {
  const run = s.slice(from, to)
  if (!/[@:.]/.test(run)) return -1
  for (let i = from; i < to; i++) {
    const c = s[i]!
    if (!MAY_START_LITERAL.test(c)) continue
    const prev = s[i - 1]
    const email = prev !== '/' && !isAtext(prev)
    const http = (c === 'h' || c === 'H') && !isAsciiAlpha(prev)
    const www = (c === 'w' || c === 'W') && PREVIOUS_WWW.test(prev ?? ' ')
    if ((email || http || www) && literalAt(s, i)) return i
  }
  return -1
}

/**
 * The second half of GFM autolink literals, ported from
 * `mdast-util-gfm-autolink-literal`: a find-and-replace over text outside
 * links, for literals the tokenizer did not take.
 */
const FIND_URL = /(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi
const FIND_EMAIL = /([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/g

const previousOk = (input: string, index: number, email: boolean): boolean => {
  const c = input[index - 1]
  return (index === 0 || /\s/.test(c!) || isUnicodePunct(c)) && (!email || c !== '/')
}

const isCorrectDomain = (domain: string): boolean => {
  const parts = domain.split('.')
  const bad = (p: string | undefined) => p !== undefined && p !== '' && (/_/.test(p) || !/[a-zA-Z\d]/.test(p))
  return parts.length >= 2 && !bad(parts.at(-1)) && !bad(parts.at(-2))
}

const splitUrl = (url: string): [string, string | undefined] => {
  const trailExec = /[!"&'),.:;<>?\]}]+$/.exec(url)
  if (!trailExec) return [url, undefined]
  url = url.slice(0, trailExec.index)
  let trail = trailExec[0]
  let closingParenIndex = trail.indexOf(')')
  const openingParens = url.split('(').length - 1
  let closingParens = url.split(')').length - 1
  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail.slice(0, closingParenIndex + 1)
    trail = trail.slice(closingParenIndex + 1)
    closingParenIndex = trail.indexOf(')')
    closingParens++
  }
  return [url, trail]
}

type Replace = (m: RegExpExecArray) => Inline[] | false

const findUrl: Replace = (m) => {
  if (!previousOk(m.input, m.index, false)) return false
  let [, protocol, domain, path] = m as unknown as [string, string, string, string]
  let prefix = ''
  if (/^w/i.test(protocol)) {
    domain = protocol + domain
    protocol = ''
    prefix = 'http://'
  }
  if (!isCorrectDomain(domain)) return false
  const [url, trail] = splitUrl(domain + path)
  if (!url) return false
  const link: Inline = {
    type: 'link',
    url: normalizeUri(prefix + protocol + url),
    title: null,
    children: [{ type: 'text', value: protocol + url }],
  }
  return trail ? [link, { type: 'text', value: trail }] : [link]
}

const findEmail: Replace = (m) => {
  const [, atext, label] = m as unknown as [string, string, string]
  if (!previousOk(m.input, m.index, true) || /[-\d_]$/.test(label)) return false
  return [
    {
      type: 'link',
      url: normalizeUri(`mailto:${atext}@${label}`),
      title: null,
      children: [{ type: 'text', value: `${atext}@${label}` }],
    },
  ]
}

/** `mdast-util-find-and-replace` on one text value: a rejected match is retried one character later. */
const findAndReplace = (value: string, find: RegExp, replace: Replace): Inline[] => {
  const out: Inline[] = []
  let start = 0
  find.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = find.exec(value))) {
    const result = replace(m)
    if (result === false) {
      find.lastIndex = m.index + 1
      continue
    }
    if (m.index !== start) out.push({ type: 'text', value: value.slice(start, m.index) })
    out.push(...result)
    start = m.index + m[0].length
    find.lastIndex = start
  }
  if (start < value.length) out.push({ type: 'text', value: value.slice(start) })
  return out
}

const linkLiterals = (value: string, out: Inline[]): void => {
  const urls = /[wW:]/.test(value) ? findAndReplace(value, FIND_URL, findUrl) : [{ type: 'text' as const, value }]
  for (const node of urls) {
    if (node.type === 'text' && node.value.includes('@')) out.push(...findAndReplace(node.value, FIND_EMAIL, findEmail))
    else out.push(node)
  }
}

const plain = (nodes: Inline[]): string =>
  nodes
    .map((n) => ('value' in n ? n.value : 'children' in n ? plain(n.children) : n.type === 'image' ? n.alt : ''))
    .join('')

/** Past this depth, nested inlines are flattened to their text, so deep nesting cannot overflow the stack. */
const MAX_INLINE_DEPTH = 64

const flatText = (root: N): string => {
  let s = ''
  const stack: N[] = [root]
  while (stack.length) {
    const n = stack.pop()!
    if (n !== root && n.value !== undefined) s += n.value
    const kids: N[] = []
    for (let c = n.first; c; c = c.next) kids.push(c)
    for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]!)
  }
  return s
}

const toMdast = (parent: N, literals: boolean, depth = 0): Inline[] => {
  if (depth > MAX_INLINE_DEPTH) return [{ type: 'text', value: flatText(parent) }]
  const out: Inline[] = []
  let buffer = ''
  const flush = (): void => {
    if (!buffer) return
    if (literals) linkLiterals(buffer, out)
    else out.push({ type: 'text', value: buffer })
    buffer = ''
  }
  for (let c = parent.first; c; c = c.next) {
    if (c.type === 'text') {
      buffer += c.value
      continue
    }
    flush()
    switch (c.type) {
      case 'emphasis':
      case 'strong':
      case 'delete':
        out.push({ type: c.type, children: toMdast(c, literals, depth + 1) })
        break
      case 'link':
        out.push({ type: 'link', url: c.url!, title: c.title ?? null, children: toMdast(c, false, depth + 1) })
        break
      case 'image':
        out.push({ type: 'image', url: c.url!, title: c.title ?? null, alt: plain(toMdast(c, false, depth + 1)) })
        break
      case 'inlineCode':
      case 'html':
        out.push({ type: c.type, value: c.value! })
        break
      case 'break':
        out.push({ type: 'break' })
        break
      case 'footnoteReference':
        out.push({ type: 'footnoteReference', identifier: c.identifier!, label: c.value! })
        break
    }
  }
  flush()
  return out
}

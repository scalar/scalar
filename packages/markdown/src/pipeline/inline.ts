/**
 * Inline parser: CommonMark's delimiter-run and bracket algorithms (ported
 * from commonmark.js), plus GFM strikethrough, autolink literals and footnote
 * calls. Produces mdast-shaped nodes.
 */
import { decodeEntity } from './entities'
import { trimEnd } from './text'

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'emphasis' | 'strong' | 'delete'; children: Inline[] }
  | { type: 'inlineCode'; value: string }
  /** `trailing` marks a break made by trailing spaces, which may follow a task marker; a backslash break may not. */
  | { type: 'break'; trailing?: true }
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
/** The attention markers micromark knows with GFM on: emphasis and strikethrough. */
const MARKERS = '*_~'
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
const DEST_BRACES = /<(?:[^<>\n\\\x00]|\\[^\n])*>/y
const SPNL = /[ \t]*(?:\n[ \t]*)?/y
const TICKS = /`+/g

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
  /** Characters references may still expand to in this document; the block parser sets it. */
  referenceBudget = Number.POSITIVE_INFINITY
  /** Like `noCommentAfter`, for `<?` with no `?>` and `<!X` with no `>` after it. */
  private noInstructionAfter = -1
  private noDeclarationAfter = -1
  private noCdataAfter = -1
  /** Caches that keep autolink-literal scans linear within one parse. */
  private literalMemo: LiteralMemo = newLiteralMemo()
  private literals: Literals | null = null
  /** Raw HTML is literal text when inline Markdown runs inside raw HTML. */
  htmlAsText = false
  /**
   * How destinations are stored. Rendering percent-encodes them as CommonMark asks, but mdast keeps
   * the URL as written (unescaped, references decoded), as `mdast-util-from-markdown` does.
   */
  url: (url: string) => string = normalizeUri

  constructor(
    readonly refs: Refs,
    readonly footnotes: Set<string>,
  ) {}

  parse(content: string): Inline[] {
    this.s = content
    const email = content.includes('@')
    const http = /https?:\/\//i.test(content)
    const www = /www\./i.test(content)
    this.literals = email || http || www ? { email, http, www } : null
    this.pos = 0
    this.delims = null
    this.brackets = null
    this.noTicks.clear()
    this.noCommentAfter = -1
    this.noInstructionAfter = -1
    this.noDeclarationAfter = -1
    this.noCdataAfter = -1
    this.literalMemo = newLiteralMemo()
    const root: N = { type: 'root' }
    while (this.pos < this.s.length) this.parseInline(root)
    this.processEmphasis(null)
    return toMdast(root, true, this.url)
  }

  private match(re: RegExp): string | null {
    re.lastIndex = this.pos
    const m = re.exec(this.s)
    if (!m) return null
    this.pos = re.lastIndex
    return m[0]
  }

  /** The end of the run of email characters at `i`; cached, as runs are asked about left to right. */
  private atextRun = { start: -1, end: -1 }
  private atextEnd(i: number): number {
    const run = this.atextRun
    if (i < run.start || i >= run.end) {
      run.start = i
      run.end = i
      while (isAtext(this.s[run.end])) run.end++
    }
    return run.end
  }

  private parseInline(block: N): void {
    const c = this.s[this.pos]!
    if (this.literals && isAtext(c) && this.parseLiteral(block)) return
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
        // `![^1]` is a `!` followed by a footnote call, as in micromark.
        if (this.s[this.pos] === '[' && this.s[this.pos + 1] === '^' && this.isFootnoteCall(this.pos)) {
          return append(block, text('!'))
        }
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
        const cut = this.literals
          ? literalCandidate(
              this.s,
              start + 1,
              this.pos,
              this.literals,
              this.s[this.atextEnd(this.pos)] === '@',
              this.literalMemo,
            )
          : -1
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
    const end = literalAt(this.s, this.pos, this.literals!, this.literalMemo)
    if (!end) return false
    const value = this.s.slice(this.pos, end.end)
    const link: N = { type: 'link', url: this.url(end.prefix + value), title: null }
    append(link, text(value))
    append(block, link)
    this.pos = end.end
    return true
  }

  private isFootnoteCall(at: number): boolean {
    // The label stops at `[`, as micromark's does, so it cannot run over a long series of openers.
    const m = /\[\^([^\]\s[]{1,999})\]/y
    m.lastIndex = at
    const found = m.exec(this.s)
    return !!found && this.footnotes.has(normalizeLabel(`[${found[1]}]`))
  }

  private parseNewline(block: N): void {
    this.pos++
    const last = block.last
    if (last?.type === 'text' && last.value!.endsWith(' ')) {
      const hard = last.value!.endsWith('  ')
      last.value = trimEnd(last.value!, ' ')
      append(block, hard ? { type: 'break', value: '  ' } : text('\n'))
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
      const link: N = { type: 'link', url: this.url('mailto:' + dest), title: null }
      append(link, text(dest))
      return append(block, link)
    }
    if ((m = this.match(AUTOLINK))) {
      const dest = m.slice(1, -1)
      const link: N = { type: 'link', url: this.url(dest), title: null }
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
    // An instruction or declaration that never closes is text, and so is every later one: remember
    // that, as for comments, instead of searching to the end from each.
    const next = this.s[this.pos + 1]
    // The expression matches `<![CDATA[` case-insensitively, so the memo does too.
    if (next === '!' && this.s.slice(this.pos, this.pos + 9).toUpperCase() === '<![CDATA[') {
      const unclosed =
        (this.noCdataAfter !== -1 && this.noCdataAfter <= this.pos) || this.s.indexOf(']]>', this.pos + 9) === -1
      if (unclosed) {
        this.noCdataAfter = this.pos
        this.pos++
        return append(block, text('<'))
      }
    }
    if (next === '?' || (next === '!' && isAsciiAlpha(this.s[this.pos + 2]))) {
      const instruction = next === '?'
      const after = instruction ? this.noInstructionAfter : this.noDeclarationAfter
      const unclosed =
        (after !== -1 && after <= this.pos) ||
        (instruction ? this.s.indexOf('?>', this.pos + 2) : this.s.indexOf('>', this.pos + 3)) === -1
      if (unclosed) {
        if (instruction) this.noInstructionAfter = this.pos
        else this.noDeclarationAfter = this.pos
        this.pos++
        return append(block, text('<'))
      }
    }
    const start = this.pos
    // `<![CDATA[` is case-sensitive; the expression above matches it case-insensitively.
    if ((m = this.match(HTML_TAG)) && m.startsWith('<![') && !m.startsWith('<![CDATA[')) {
      this.pos = start
      m = null
    }
    if (m) {
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
    // Like micromark, an emphasis run next to another marker run (`**_x_**y`) flanks on that
    // side whatever comes after it; commonmark.js does not. Strikethrough runs do not do this.
    const marker = cc !== '~'
    const left = (!aW && (!aP || bW || bP)) || (marker && MARKERS.includes(after))
    const right = (!bW && (!bP || aW || aP)) || (marker && MARKERS.includes(b))
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
    if (braced !== null) return this.url(unescapeString(braced.slice(1, -1)))
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
    return this.url(unescapeString(this.s.slice(start, this.pos)))
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
    // A label is at most 999 characters, as in micromark; checking that first keeps a run of `[^`
    // openers from slicing ever longer labels.
    if (!image && this.s[opener.index + 1] === '^' && start - opener.index <= 1001) {
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
        const size = ref ? ref.url.length + (ref.title?.length ?? 0) : 0
        // Past the budget a reference stays text, as in cmark: a long URL used many times
        // would otherwise turn kilobytes of input into hundreds of megabytes of output.
        if (ref && size <= this.referenceBudget) {
          this.referenceBudget -= size
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

// Character codes rather than regular expressions: these run for nearly every character of text.
const isAsciiAlpha = (c: string | undefined): boolean => {
  const n = c === undefined ? 0 : c.charCodeAt(0) | 32
  return n >= 97 && n <= 122
}
const isAsciiAlnum = (c: string | undefined): boolean => {
  const n = c === undefined ? 0 : c.charCodeAt(0)
  return (n >= 48 && n <= 57) || isAsciiAlpha(c)
}
const isAtext = (c: string | undefined): boolean => c === '+' || c === '-' || c === '.' || c === '_' || isAsciiAlnum(c)
/** Ends a URL: end of input, a space or line ending, or Unicode whitespace. */
const isBreak = (c: string | undefined): boolean => c === undefined || /\s/.test(c)
const isUnicodePunct = (c: string | undefined): boolean => c !== undefined && /[\p{P}\p{S}]/u.test(c)
const isControl = (c: string | undefined): boolean => c !== undefined && (c.charCodeAt(0) < 32 || c === '\x7f')

/** Which kinds of literal the text can contain at all, so the rest is not searched for them. */
type Literals = { email: boolean; http: boolean; www: boolean }
const PREVIOUS_WWW = /[(*_[\]~ \t\n\r]/

/**
 * Caches for one parse. `trail` remembers `isTrail` by position. `scan` remembers where the last
 * domain run ends, and the labels near its end, because every candidate inside the run stops
 * at the same place. Without them, a long run rescanned from every `.`, `_` or `www.` took
 * quadratic time.
 */
type LiteralMemo = {
  trail: Map<number, boolean>
  scan: { from: number; end: number; labels?: DomainLabels } | null
}
type DomainLabels = {
  lastDot: number
  prevDot: number
  underscore: boolean
  underscoreBefore: boolean
  lastWord: number
}
const newLiteralMemo = (): LiteralMemo => ({ trail: new Map(), scan: null })

/** Whether the rest from `i` is trailing punctuation that is not part of a URL. */
const isTrail = (s: string, i: number, memo: LiteralMemo): boolean => {
  const visited: number[] = []
  let result: boolean
  for (;;) {
    const known = memo.trail.get(i)
    if (known !== undefined) {
      result = known
      break
    }
    visited.push(i)
    const c = s[i]
    if (c === '<' || isBreak(c)) {
      result = true
      break
    }
    if (c !== undefined && '!"\')*,.:;?_~'.includes(c)) {
      i++
    } else if (c === '&') {
      i++
      if (!isAsciiAlpha(s[i])) {
        result = false
        break
      }
      while (isAsciiAlpha(s[i])) i++
      if (s[i] !== ';') {
        result = false
        break
      }
      i++
    } else if (c === ']') {
      i++
      const d = s[i]
      if (d === '(' || d === '[' || isBreak(d)) {
        result = true
        break
      }
    } else {
      result = false
      break
    }
  }
  // Every position the scan passed reaches the same end, so they share the result.
  for (const v of visited) memo.trail.set(v, result)
  return result
}

/** Where a domain starting at `i` stops: at trailing punctuation, a break, or punctuation other than `-`. */
const domainStop = (s: string, i: number, memo: LiteralMemo): number => {
  const scan = memo.scan
  if (scan && i >= scan.from && i <= scan.end) return scan.end
  let j = i
  for (;;) {
    const c = s[j]
    if (c === '.' || c === '_') {
      if (isTrail(s, j, memo)) break
      j++
      continue
    }
    if (isBreak(c) || (c !== '-' && isUnicodePunct(c))) break
    j++
  }
  memo.scan = { from: i, end: j }
  return j
}

/** The dots and underscores near the end of the cached run, computed once per run. */
const domainLabels = (s: string, memo: LiteralMemo): DomainLabels => {
  const scan = memo.scan!
  if (scan.labels) return scan.labels
  let lastDot = -1
  let prevDot = -1
  let underscore = false
  let underscoreBefore = false
  let lastWord = -1
  for (let k = scan.end - 1; k >= scan.from; k--) {
    const c = s[k]
    if (c === '.') {
      if (lastDot === -1) lastDot = k
      else if (prevDot === -1) prevDot = k
    } else if (c === '_') {
      if (lastDot === -1) underscore = true
      else if (prevDot === -1) underscoreBefore = true
    } else if (lastWord === -1) lastWord = k
    if (prevDot !== -1 && lastWord !== -1) break
  }
  scan.labels = { lastDot, prevDot, underscore, underscoreBefore, lastWord }
  return scan.labels
}

const domainEnd = (s: string, i: number, memo: LiteralMemo): number => {
  const end = domainStop(s, i, memo)
  const labels = domainLabels(s, memo)
  const seen = labels.lastWord >= i
  let underscore = labels.underscore
  let underscoreBefore = labels.underscoreBefore
  // A start inside the last two labels sees fewer of them: work it out directly, which is cheap there.
  if (labels.prevDot < i) {
    underscore = false
    underscoreBefore = false
    for (let k = i; k < end; k++) {
      const c = s[k]
      if (c === '_') underscore = true
      else if (c === '.') {
        underscoreBefore = underscore
        underscore = false
      }
    }
  }
  return underscoreBefore || underscore || !seen ? -1 : end
}

const pathEnd = (s: string, i: number, memo: LiteralMemo): number => {
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
      if (isTrail(s, i, memo)) return i
      if (c === ')') close++
      i++
    } else if (isBreak(c)) return i
    else i++
  }
}

/** The end of a `www.`, `http(s)://` or email literal starting at `i`, and the prefix its URL needs. */
const literalAt = (
  s: string,
  i: number,
  kinds: Literals,
  memo: LiteralMemo,
): { end: number; prefix: string } | null => {
  const prev = s[i - 1]
  const c = s[i]!
  // Email: tried first at every character, as in micromark.
  if (kinds.email && isAtext(c) && prev !== '/' && !isAtext(prev)) {
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
  if (kinds.http && (c === 'h' || c === 'H') && !isAsciiAlpha(prev)) {
    const m = /^https?:\/\//i.exec(s.slice(i, i + 8))
    if (m) {
      const after = i + m[0].length
      const d = s[after]
      if (!isBreak(d) && !isControl(d) && !isUnicodePunct(d)) {
        const domain = domainEnd(s, after, memo)
        if (domain !== -1) return { end: pathEnd(s, domain, memo), prefix: '' }
      }
    }
  }
  if (
    kinds.www &&
    (c === 'w' || c === 'W') &&
    (prev === undefined || PREVIOUS_WWW.test(prev)) &&
    /^www\./i.test(s.slice(i, i + 4)) &&
    s[i + 4] !== undefined
  ) {
    const domain = domainEnd(s, i, memo)
    if (domain !== -1) return { end: pathEnd(s, domain, memo), prefix: 'http://' }
  }
  return null
}

/**
 * The first position in `s[from, to)` where a literal could start, or -1. Cheap enough for every
 * text run. A literal can reach past the run: `atAfter` says an email `@` follows its last
 * email characters (`user_id@` is cut at `_`), and `http://` or `www.` ends within a few characters.
 */
const literalCandidate = (
  s: string,
  from: number,
  to: number,
  kinds: Literals,
  atAfter: boolean,
  memo: LiteralMemo,
): number => {
  if (!atAfter && !/[@:.]/.test(s.slice(from, to + 6))) return -1
  for (let i = from; i < to; i++) {
    const c = s[i]!
    if (!isAtext(c)) continue
    const prev = s[i - 1]
    const email = kinds.email && prev !== '/' && !isAtext(prev)
    const http = kinds.http && (c === 'h' || c === 'H') && !isAsciiAlpha(prev)
    const www = kinds.www && (c === 'w' || c === 'W') && PREVIOUS_WWW.test(prev ?? ' ')
    if ((email || http || www) && literalAt(s, i, kinds, memo)) return i
  }
  return -1
}

/**
 * The second half of GFM autolink literals, ported from
 * `mdast-util-gfm-autolink-literal`: a find-and-replace over text outside
 * links, for literals the tokenizer did not take.
 */

const previousOk = (input: string, index: number, email: boolean): boolean => {
  const c = input[index - 1]
  return (index === 0 || /\s/.test(c!) || isUnicodePunct(c)) && (!email || c !== '/')
}

const isCorrectDomain = (domain: string): boolean => {
  const parts = domain.split('.')
  const bad = (p: string | undefined) => p !== undefined && p !== '' && (/_/.test(p) || !/[a-zA-Z\d]/.test(p))
  return parts.length >= 2 && !bad(parts.at(-1)) && !bad(parts.at(-2))
}

/** Punctuation that ends an autolink literal's URL rather than belonging to it, as in GFM. */
const TRAILING_PUNCTUATION = '!"&\'),.:;<>?]}'

/**
 * Splits trailing punctuation off a URL, keeping each `)` that closes an open `(`.
 * Scans with indexes: slicing the trail once per `)` was quadratic on a long run of them.
 */
const splitUrl = (url: string): [string, string | undefined] => {
  const end = trimEnd(url, TRAILING_PUNCTUATION).length
  if (end === url.length) return [url, undefined]
  const head = url.slice(0, end)
  const openingParens = head.split('(').length - 1
  let closingParens = head.split(')').length - 1
  let cut = end
  while (openingParens > closingParens) {
    const paren = url.indexOf(')', cut)
    if (paren === -1) break
    cut = paren + 1
    closingParens++
  }
  return [url.slice(0, cut), url.slice(cut)]
}

const URL_START = /https?:\/\/|www(?=\.)/gi
const URL_DOMAIN = /[-.\w]+/y
const URL_PATH = /[^ \t\r\n]*/y

/**
 * URL literals in one text value, as `mdast-util-gfm-autolink-literal` finds them with
 * `/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi` and `mdast-util-find-and-replace`, which
 * retries a rejected match one character later. Each retry ran the greedy match to the end of
 * the run again, which was quadratic, so the cheap checks come first: the character before,
 * then the domain. A `www.` candidate inside a rejected domain, up to its second-to-last label,
 * shares the labels the check looks at, so it is rejected without scanning again.
 */
const findUrls = (value: string, normalize: (url: string) => string): Inline[] => {
  const out: Inline[] = []
  let start = 0
  let rejectedWwwUntil = -1
  URL_START.lastIndex = 0
  for (let m = URL_START.exec(value); m; m = URL_START.exec(value)) {
    const index = m.index
    URL_START.lastIndex = index + 1
    const www = m[0][0] === 'w' || m[0][0] === 'W'
    if ((www && index < rejectedWwwUntil) || !previousOk(value, index, false)) continue
    URL_DOMAIN.lastIndex = index + m[0].length
    const run = URL_DOMAIN.exec(value)
    if (!run) continue
    const domainEnd = URL_DOMAIN.lastIndex
    const protocol = www ? '' : m[0]
    const domain = www ? m[0] + run[0] : run[0]
    if (!isCorrectDomain(domain)) {
      // A later `www.` candidate shares the last two labels only if it starts no later than the
      // second-to-last one; one inside it sees a shorter label and gets its own check.
      if (www) {
        const lastDot = value.lastIndexOf('.', domainEnd - 1)
        rejectedWwwUntil = Math.max(value.lastIndexOf('.', lastDot - 1) + 1, index) + 1
      }
      continue
    }
    URL_PATH.lastIndex = domainEnd
    const path = URL_PATH.exec(value)![0]
    const [url, trail] = splitUrl(domain + path)
    if (!url) continue
    if (index !== start) out.push({ type: 'text', value: value.slice(start, index) })
    out.push({
      type: 'link',
      url: normalize((www ? 'http://' : '') + protocol + url),
      title: null,
      children: [{ type: 'text', value: protocol + url }],
    })
    if (trail) out.push({ type: 'text', value: trail })
    start = domainEnd + path.length
    URL_START.lastIndex = start
  }
  if (start < value.length) out.push({ type: 'text', value: value.slice(start) })
  return out
}

const isWord = (c: string | undefined): boolean => c !== undefined && /\w/.test(c)
const isEmailLocal = (c: string | undefined): boolean => isWord(c) || c === '-' || c === '.' || c === '+'
const isLabel = (c: string | undefined): boolean => isWord(c) || c === '-'

/**
 * The end of the domain after the `@` at `at`, as `/[-\w]+(?:\.[-\w]+)+/` would match it
 * greedily, or -1: labels joined by single dots, at least two of them.
 */
const emailDomainEnd = (value: string, at: number): number => {
  let j = at + 1
  if (!isLabel(value[j])) return -1
  while (isLabel(value[j])) j++
  let end = -1
  while (value[j] === '.' && isLabel(value[j + 1])) {
    j++
    while (isLabel(value[j])) j++
    end = j
  }
  return end
}

/**
 * Email literals in one text value, as `mdast-util-gfm-autolink-literal` finds them with
 * `/([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/g` and `mdast-util-find-and-replace`, which retries a
 * rejected match one character later. That search backtracked quadratically on a long
 * run of local-part characters with no domain after it, so this scans from each `@`.
 *
 * Every candidate for an `@` shares its domain, and its start can only move right within
 * the local part before it, so the first start that passes `previousOk` is the match.
 */
const findEmails = (value: string, normalize: (url: string) => string): Inline[] => {
  const out: Inline[] = []
  let start = 0
  let at = value.indexOf('@')
  while (at !== -1) {
    let local = at
    while (local > start && isEmailLocal(value[local - 1])) local--
    const end = local < at ? emailDomainEnd(value, at) : -1
    const label = end === -1 ? '' : value.slice(at + 1, end)
    let match = -1
    if (end !== -1 && !/[-\d_]$/.test(label)) {
      for (let i = local; i < at; i++) {
        if (previousOk(value, i, true)) {
          match = i
          break
        }
      }
    }
    if (match === -1) {
      at = value.indexOf('@', at + 1)
      continue
    }
    if (match !== start) out.push({ type: 'text', value: value.slice(start, match) })
    const literal = value.slice(match, end)
    out.push({
      type: 'link',
      url: normalize(`mailto:${literal}`),
      title: null,
      children: [{ type: 'text', value: literal }],
    })
    start = end
    at = value.indexOf('@', end)
  }
  if (start < value.length) out.push({ type: 'text', value: value.slice(start) })
  return out
}

const linkLiterals = (value: string, out: Inline[], normalize: (url: string) => string): void => {
  const urls = /[wW:]/.test(value) ? findUrls(value, normalize) : [{ type: 'text' as const, value }]
  for (const node of urls) {
    if (node.type === 'text' && node.value.includes('@')) out.push(...findEmails(node.value, normalize))
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

const toMdast = (parent: N, literals: boolean, normalize: (url: string) => string, depth = 0): Inline[] => {
  if (depth > MAX_INLINE_DEPTH) return [{ type: 'text', value: flatText(parent) }]
  const out: Inline[] = []
  let buffer = ''
  const flush = (): void => {
    if (!buffer) return
    if (literals) linkLiterals(buffer, out, normalize)
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
        out.push({ type: c.type, children: toMdast(c, literals, normalize, depth + 1) })
        break
      case 'link':
        out.push({
          type: 'link',
          url: c.url!,
          title: c.title ?? null,
          children: toMdast(c, false, normalize, depth + 1),
        })
        break
      case 'image':
        out.push({
          type: 'image',
          url: c.url!,
          title: c.title ?? null,
          alt: plain(toMdast(c, false, normalize, depth + 1)),
        })
        break
      case 'inlineCode':
      case 'html':
        out.push({ type: c.type, value: c.value! })
        break
      case 'break':
        out.push(c.value ? { type: 'break', trailing: true } : { type: 'break' })
        break
      case 'footnoteReference':
        out.push({ type: 'footnoteReference', identifier: c.identifier!, label: c.value! })
        break
    }
  }
  flush()
  return out
}

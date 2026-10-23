/**
 * Raw HTML handling: a small HTML tokenizer, the sanitizer allowlist, and the
 * one writer that every byte of output goes through.
 *
 * Security does not depend on tokenizing input exactly like a browser. The
 * writer never copies markup through: it re-serializes every tag from its own
 * token, emits only allowlisted tags and attributes, escapes text, and keeps a
 * single open-element stack so the output is always balanced. None of the
 * allowlisted tags have a raw-text content model, so a browser re-parsing the
 * output sees exactly the tree the writer built.
 */

const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])
const RAW_TEXT = new Set(['script', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'textarea', 'title'])
const STRIP = new Set(['script', 'style', 'object', 'embed', 'form'])
const NEEDS_TABLE = new Set(['tbody', 'td', 'th', 'thead', 'tfoot', 'tr'])
/** Start tags that close an open `<p>` in the HTML parser ("in body" insertion mode), allowed or not. */
const CLOSES_P = new Set(
  'address article aside blockquote center dd details dialog dir div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li listing main menu nav ol p plaintext pre search section summary table ul xmp'.split(
    ' ',
  ),
)
/** Tags whose direct text children get inline Markdown, matching the current pipeline. */
export const INLINE_MARKDOWN_TAGS = new Set(['dd', 'dt', 'li', 'p', 'summary', 'td', 'th'])

/** `hast-util-sanitize`'s GitHub schema, which the current pipeline uses. */
export const DEFAULT_TAGS =
  'a b blockquote br code dd del details div dl dt em h1 h2 h3 h4 h5 h6 hr i img input ins kbd li ol p picture pre q rp rt ruby s samp section source span strike strong sub summary sup table tbody td tfoot th thead tr tt ul var'.split(
    ' ',
  )

const GLOBAL_ATTRS = new Set(
  'abbr accept accept-charset accesskey action align alt axis border cellpadding cellspacing char charoff charset checked class clear colspan color cols compact coords datetime dir enctype frame hspace headers height hreflang for id ismap itemprop label lang maxlength media method multiple name nohref noshade nowrap open prompt readonly rev rowspan rows rules scope selected shape size span start summary tabindex title usemap valign value width'.split(
    ' ',
  ),
)
const ARIA = ['aria-describedby', 'aria-label', 'aria-labelledby']
const TAG_ATTRS: Record<string, string[]> = {
  a: [...ARIA, 'data-footnote-backref', 'data-footnote-ref', 'href'],
  blockquote: ['cite'],
  del: ['cite'],
  div: ['itemscope', 'itemtype'],
  dl: ARIA,
  img: [...ARIA, 'longdesc', 'src'],
  input: ['disabled', 'type'],
  ins: ['cite'],
  ol: ARIA,
  q: ['cite'],
  section: ['data-footnotes'],
  source: ['srcset'],
  summary: ARIA,
  table: ARIA,
  ul: ARIA,
}
/** Tags where `class` is restricted to specific values, as in the schema. */
const CLASS_RULES: Record<string, (c: string) => boolean> = {
  a: (c) => c === 'data-footnote-backref',
  code: (c) => /^language-./.test(c),
  h2: (c) => c === 'sr-only',
  li: (c) => c === 'task-list-item',
  ol: (c) => c === 'contains-task-list',
  ul: (c) => c === 'contains-task-list',
  section: (c) => c === 'footnotes',
}
const PROTOCOLS: Record<string, string[]> = {
  href: ['http', 'https', 'irc', 'ircs', 'mailto', 'xmpp'],
  cite: ['http', 'https'],
  longdesc: ['http', 'https'],
  src: ['http', 'https'],
}

/** Marks an `&` that starts a character reference the browser should decode. */
export const REF = '￿'

export const escapeText = (s: string): string =>
  s.replace(/[&<>￿]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&'))

export const escapeAttr = (s: string): string =>
  s.replace(/[&"<￿]/g, (c) => (c === '&' ? '&amp;' : c === '"' ? '&quot;' : c === '<' ? '&lt;' : '&'))

/** Raw HTML keeps its character references: the browser decodes them exactly like parse5 does today. */
const escapeRawText = (s: string): string => s.replace(/[<>]/g, (c) => (c === '<' ? '&lt;' : '&gt;'))
const escapeRawAttr = (s: string): string => s.replace(/["<]/g, (c) => (c === '"' ? '&quot;' : '&lt;'))

const decodeNumeric = (s: string): string =>
  s.replace(/&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));?/gi, (_, hex, dec) => {
    const cp = Number.parseInt(hex ?? dec, hex ? 16 : 10)
    return cp === 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff) ? '�' : String.fromCodePoint(cp)
  })

/**
 * Whether a URL may be used for `attr`. `raw` is the value as it will be
 * written, so character references are still encoded.
 *
 * Named references are not decoded here (that would need the entity table), so
 * any `&` before the first `/`, `?` or `#` is rejected: that is where
 * `javascript&colon;` hides a scheme, and no legitimate URL puts one there.
 */
export const isSafeUrl = (raw: string, attr: string): boolean => {
  const allowed = PROTOCOLS[attr]
  if (!allowed) return true
  const url = decodeNumeric(raw.replace(/\uffff/g, '&'))
  const end = url.search(/[/?#]/)
  // A named reference before the path could hide a scheme (`javascript&colon;`), and decoding
  // it would need the entity table, so such a URL is never safe.
  if (/&[a-zA-Z][a-zA-Z0-9]*;/.test(end === -1 ? url : url.slice(0, end))) return false
  // From here on exactly `hast-util-sanitize`: case-sensitive, nothing trimmed. That rejects
  // ` https:` and `HTTPS:` like today; a browser would accept them, so this only rejects more.
  const colon = url.indexOf(':')
  if (colon < 0 || (end !== -1 && colon > end)) return true
  return allowed.some((protocol) => colon === protocol.length && url.startsWith(protocol))
}

const isExternal = (href: string): boolean => /^https?:/i.test(href.replace(/^[\x00-\x20]+/, ''))

/** Elements the HTML parser reopens after they were closed implicitly ("active formatting elements"). */
const FORMATTING = new Set([
  'a',
  'b',
  'big',
  'code',
  'em',
  'font',
  'i',
  'nobr',
  's',
  'small',
  'strike',
  'strong',
  'tt',
  'u',
])
/** Formatting opened inside one of these is never reopened outside it (the parser's "markers"). */
const MARKERS = new Set(['applet', 'caption', 'marquee', 'object', 'table', 'td', 'template', 'th'])
/** Start tags that do not reopen formatting elements before they are inserted. */
const NO_RECONSTRUCT = new Set([...CLOSES_P, 'caption', 'col', 'colgroup', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr'])
/** The parser's "special" elements, which stop the search for an `<li>`, `<dd>` or `<dt>` to close. */
const SPECIAL = new Set(
  'address applet area article aside base basefont bgsound blockquote body br button caption center col colgroup dd details dir div dl dt embed fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html iframe img input keygen li link listing main marquee menu meta nav noembed noframes noscript object ol p param plaintext pre script search section select source style summary table tbody td template textarea tfoot th thead title tr track ul wbr xmp'.split(
    ' ',
  ),
)

type Frame = { tag: string; id: number; hidden: boolean; attrs?: string }

export type WriterOptions = {
  tags: Set<string>
  /** Renders text found directly inside `INLINE_MARKDOWN_TAGS` in raw HTML. */
  inline: (text: string, w: Writer) => void
  /** Test only: write raw HTML through untouched, to check parsing against the CommonMark spec. */
  unsafe?: boolean
}

/**
 * Accumulates the output. Generated elements (from Markdown) and raw elements
 * (from HTML in the source) share one stack, so a `<details>` opened in one
 * HTML block and closed in another wraps the Markdown between them, just as
 * when the whole document is parsed as one HTML stream.
 */
export class Writer {
  out = ''
  private stack: Frame[] = []
  private nextId = 1
  /** Generated `<p>` elements by id, to mirror the parser when one was already closed. */
  private paragraphs = new Map<number, boolean>()
  /** Formatting elements closed implicitly, to reopen before the next content, as the parser does. */
  private pending: Frame[] = []
  /** A block separator, written only if more output follows, as `mdast-util-to-hast` does at the root. */
  private separator = false
  /**
   * Skipping the contents of a stripped element such as `<script>` or `<form>`.
   * Applies to generated output too: inline `<script>` and `</script>` arrive as
   * separate nodes with Markdown text between them. It ends at the matching end
   * tag, or when the element that contained the stripped one closes.
   */
  private skip: { tag: string; depth: number; at: number } | null = null

  constructor(private readonly options: WriterOptions) {}

  private allowed(tag: string): boolean {
    if (this.options.unsafe) return true
    if (!this.options.tags.has(tag)) return false
    return !NEEDS_TABLE.has(tag) || this.stack.some((f) => f.tag === 'table' && !f.hidden)
  }

  /** A newline after a block. Deferred, because a character after the last block would reopen formatting elements. */
  newline(): void {
    this.separator = true
  }

  private flush(): void {
    if (!this.separator) return
    this.separator = false
    this.text('\n')
  }

  /** Opens a generated element. `attrs` is already serialized and safe. Returns its id for `close`. */
  open(tag: string, attrs = ''): number {
    this.flush()
    const id = this.nextId++
    if (this.skip) return id
    this.closeP(tag)
    if (!NO_RECONSTRUCT.has(tag)) this.reconstruct()
    const hidden = !this.allowed(tag)
    if (!hidden) {
      if (tag === 'a' && !this.options.unsafe && /\shref="https?:/i.test(attrs))
        attrs += ' rel="nofollow" target="_blank"'
      this.out += `<${tag}${attrs}>`
    }
    if (!VOID.has(tag)) this.stack.push({ tag, id, hidden, attrs })
    if (tag === 'p') this.paragraphs.set(id, hidden)
    return id
  }

  /** Reopens formatting elements that were closed implicitly ("reconstruct the active formatting elements"). */
  private reconstruct(): void {
    if (this.pending.length === 0) return
    const pending = this.pending
    this.pending = []
    for (const f of pending) {
      this.out += `<${f.tag}${f.attrs ?? ''}>`
      this.stack.push({ ...f, id: this.nextId++ })
    }
  }

  /** `<li>` closes an open `<li>`, and `<dd>` or `<dt>` an open `<dd>` or `<dt>`, unless a special element is in between. */
  private closeListItem(tag: string): void {
    const targets = tag === 'li' ? ['li'] : tag === 'dd' || tag === 'dt' ? ['dd', 'dt'] : null
    if (!targets) return
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const f = this.stack[i]!
      if (f.hidden) continue
      if (targets.includes(f.tag)) return this.popTo(i)
      if (SPECIAL.has(f.tag) && f.tag !== 'address' && f.tag !== 'div' && f.tag !== 'p') return
    }
  }

  /** A block start closes an open `<p>`, as the HTML parser would when it reads the output. */
  private closeP(tag: string): void {
    if (!CLOSES_P.has(tag)) return
    const at = this.stack.findLastIndex((f) => f.tag === 'p' && !f.hidden)
    if (at !== -1 && this.stack.slice(at + 1).every((f) => f.hidden || !CLOSES_P.has(f.tag))) this.popTo(at)
  }

  /** Closes a generated element, and anything raw HTML left open inside it. */
  close(id: number): void {
    this.flush()
    const at = this.stack.findLastIndex((f) => f.id === id)
    if (at !== -1) this.popTo(at)
    else if (this.paragraphs.get(id) === false && !this.skip) this.strayEnd('p')
    // Its own end tag: a formatting element waiting to be reopened is dropped instead.
    this.pending = this.pending.filter((f) => f.id !== id)
    this.paragraphs.delete(id)
  }

  /**
   * An end tag with nothing to close. The HTML parser turns `</p>` into an empty
   * paragraph and `</br>` into a line break, so the output does the same.
   */
  private strayEnd(tag: string): void {
    const open = tag === 'p' ? this.stack.findLastIndex((f) => f.tag === 'p' && !f.hidden) : -1
    // `</p>` closes whichever paragraph is open, and only creates an empty one when none is.
    if (open !== -1) this.popTo(open)
    else if (tag === 'p' && this.allowed('p')) this.out += '<p></p>'
    else if (tag === 'br' && this.allowed('br')) this.out += '<br>'
  }

  private popTo(at: number): void {
    if (this.skip && at < this.skip.at) this.skip = null
    const implicit: Frame[] = []
    for (let i = this.stack.length - 1; i >= at; i--) {
      const f = this.stack[i]!
      if (!f.hidden) this.out += `</${f.tag}>`
      if (MARKERS.has(f.tag)) implicit.length = 0
      else if (i > at && !f.hidden && FORMATTING.has(f.tag)) implicit.unshift(f)
    }
    if (MARKERS.has(this.stack[at]?.tag ?? '')) this.pending = []
    this.stack.length = at
    this.pending.push(...implicit)
  }

  text(escaped: string): void {
    this.flush()
    if (this.skip) return
    if (escaped) this.reconstruct()
    this.out += escaped
  }

  /** Closes everything still open, so the output can never leak out of its container. */
  finish(): string {
    if (this.options.unsafe) this.stack.length = 0
    this.popTo(0)
    this.pending = []
    return this.out
  }

  /** Sanitizes and writes a raw HTML fragment. */
  raw(html: string): void {
    this.flush()
    if (this.options.unsafe) this.out += html
    else tokenize(html, this)
  }

  /** @internal Called by the tokenizer. */
  onText(text: string): void {
    if (this.skip) return
    const top = this.stack.at(-1)
    if (top && !top.hidden && INLINE_MARKDOWN_TAGS.has(top.tag) && /[`*_[~]/.test(text)) {
      this.options.inline(text, this)
    } else {
      this.reconstruct()
      this.out += escapeRawText(text)
    }
  }

  /** @internal */
  onRawText(tag: string, text: string): void {
    if (this.skip) return
    // Only reachable when the caller allowed a raw-text tag such as `script`.
    if (this.options.tags.has(tag)) this.out += text
    else if (!STRIP.has(tag)) this.out += escapeRawText(text)
  }

  /** @internal */
  onStart(tag: string, attrs: [string, string | null][]): void {
    if (this.skip) {
      if (tag === this.skip.tag && !VOID.has(tag)) this.skip.depth++
      return
    }
    // Before the allowlist: the browser does this even for a tag the sanitizer then drops.
    this.closeListItem(tag)
    this.closeP(tag)
    if (!NO_RECONSTRUCT.has(tag)) this.reconstruct()
    if (!this.allowed(tag)) {
      if (STRIP.has(tag) && !VOID.has(tag)) this.skip = { tag, depth: 1, at: this.stack.length }
      return
    }
    let s = ''
    const seen = new Set<string>()
    const tagAttrs = TAG_ATTRS[tag]
    for (const [name, value] of attrs) {
      if (seen.has(name)) continue
      seen.add(name)
      if (!GLOBAL_ATTRS.has(name) && !tagAttrs?.includes(name)) continue
      if (tag === 'input' && (name === 'type' || name === 'disabled')) continue
      let v = value ?? ''
      if (name === 'class' && CLASS_RULES[tag]) {
        v = v
          .split(/[ \t\n\f\r]+/)
          .filter(CLASS_RULES[tag]!)
          .join(' ')
      }
      if (PROTOCOLS[name] && !isSafeUrl(v, name)) continue
      // Not in the schema's protocol list, but every candidate is a URL, so check them like `src`.
      if (name === 'srcset' && !v.split(',').every((c) => isSafeUrl(c.trim().split(/\s+/)[0] ?? '', 'src'))) continue
      s += value === null ? ` ${name}` : ` ${name}="${escapeRawAttr(v)}"`
    }
    if (tag === 'input') s = ' type="checkbox"' + s + ' disabled'
    if (tag === 'a') {
      const href = attrs.find(([n]) => n === 'href')?.[1]
      if (href && s.includes(' href=') && isExternal(href)) s += ' rel="nofollow" target="_blank"'
    }
    this.out += `<${tag}${s}>`
    if (!VOID.has(tag)) this.stack.push({ tag, id: this.nextId++, hidden: false, attrs: s })
  }

  /** @internal */
  onEnd(tag: string): void {
    if (this.skip) {
      if (tag === this.skip.tag && --this.skip.depth === 0) this.skip = null
      return
    }
    const at = this.stack.findLastIndex((f) => f.tag === tag && !f.hidden)
    if (at !== -1) return this.popTo(at)
    const waiting = this.pending.findLastIndex((f) => f.tag === tag)
    if (waiting !== -1) this.pending.splice(waiting, 1)
    else this.strayEnd(tag)
  }
}

const ATTR_NAME = /[^\t\n\f\r />][^\t\n\f\r /=>]*/y
const WS = /[\t\n\f\r ]*/y

/**
 * Splits HTML into text, tags and raw text, following the HTML tokenizer's
 * rules closely enough for well-formed input. Comments, doctypes and
 * processing instructions are dropped, as the sanitizer drops them today.
 */
export const tokenize = (s: string, w: Writer): void => {
  let i = 0
  const n = s.length
  while (i < n) {
    const lt = s.indexOf('<', i)
    if (lt === -1) {
      w.onText(s.slice(i))
      return
    }
    if (lt > i) w.onText(s.slice(i, lt))
    i = lt
    const c = s.charCodeAt(i + 1)
    if (c === 33 /* ! */) {
      if (s.startsWith('<!--', i)) {
        if (s.startsWith('<!-->', i)) i += 5
        else if (s.startsWith('<!--->', i)) i += 6
        else {
          const end = s.indexOf('-->', i + 4)
          i = end === -1 ? n : end + 3
        }
      } else {
        const end = s.indexOf('>', i)
        i = end === -1 ? n : end + 1
      }
      continue
    }
    if (c === 63 /* ? */) {
      const end = s.indexOf('>', i)
      i = end === -1 ? n : end + 1
      continue
    }
    const isEnd = c === 47 /* / */
    const nameStart = isEnd ? i + 2 : i + 1
    const first = s.charCodeAt(nameStart)
    if (!((first >= 65 && first <= 90) || (first >= 97 && first <= 122))) {
      if (isEnd && first === 62 /* </> */) {
        i = nameStart + 1
        continue
      }
      w.onText('<')
      i++
      continue
    }
    let j = nameStart
    while (j < n && !/[\t\n\f\r />]/.test(s[j]!)) j++
    const tag = s.slice(nameStart, j).toLowerCase()
    // Attributes
    const attrs: [string, string | null][] = []
    let closed = false
    while (j < n) {
      WS.lastIndex = j
      WS.test(s)
      j = WS.lastIndex
      const ch = s[j]
      if (ch === '>') {
        closed = true
        j++
        break
      }
      if (ch === '/') {
        j++
        continue
      }
      ATTR_NAME.lastIndex = j
      const m = ATTR_NAME.exec(s)
      if (!m) break
      j = ATTR_NAME.lastIndex
      const name = m[0].toLowerCase()
      WS.lastIndex = j
      WS.test(s)
      if (s[WS.lastIndex] !== '=') {
        attrs.push([name, null])
        continue
      }
      WS.lastIndex += 1
      WS.test(s)
      j = WS.lastIndex
      const q = s[j]
      if (q === '"' || q === "'") {
        const end = s.indexOf(q, j + 1)
        if (end === -1) {
          j = n
          break
        }
        attrs.push([name, s.slice(j + 1, end)])
        j = end + 1
      } else {
        let k = j
        while (k < n && !/[\t\n\f\r >]/.test(s[k]!)) k++
        attrs.push([name, s.slice(j, k)])
        j = k
      }
    }
    // A tag cut off by the end of input is dropped, as browsers do.
    if (!closed) return
    i = j
    if (isEnd) {
      w.onEnd(tag)
      continue
    }
    w.onStart(tag, attrs)
    if (RAW_TEXT.has(tag)) {
      const re = new RegExp(`</${tag}[\\t\\n\\f\\r />]`, 'ig')
      re.lastIndex = i
      const m = re.exec(s)
      const end = m ? m.index : n
      w.onRawText(tag, s.slice(i, end))
      i = end
      if (m) {
        const gt = s.indexOf('>', end)
        i = gt === -1 ? n : gt + 1
        w.onEnd(tag)
      }
    }
  }
}

/**
 * Escaping for the serializer, ported from `mdast-util-to-markdown` (`unsafe.js`, `util/safe.js`)
 * and the GFM extensions that `remark-gfm` adds. A pattern names a character that would start
 * Markdown syntax in some context. `safe` escapes every such character in text, so the output parses
 * back to the same text instead of turning into emphasis, links, raw HTML or block syntax.
 */

/** Where the serializer is, as the stack of constructs it is inside. */
export type ConstructName =
  | 'autolink'
  | 'blockquote'
  | 'codeFenced'
  | 'codeFencedLangGraveAccent'
  | 'codeFencedLangTilde'
  | 'codeFencedMetaGraveAccent'
  | 'codeFencedMetaTilde'
  | 'destinationLiteral'
  | 'destinationRaw'
  | 'emphasis'
  | 'footnoteDefinition'
  | 'footnoteReference'
  | 'headingAtx'
  | 'headingSetext'
  | 'image'
  | 'label'
  | 'link'
  | 'list'
  | 'listItem'
  | 'paragraph'
  | 'phrasing'
  | 'reference'
  | 'strikethrough'
  | 'strong'
  | 'table'
  | 'tableCell'
  | 'tableRow'
  | 'titleApostrophe'
  | 'titleQuote'

/**
 * A character that is unsafe in some context. `before` and `after` are regular expression sources
 * for what must surround it; `atBreak` means only at the start of a line, after indentation.
 */
export type UnsafePattern = {
  character: string
  before?: string
  after?: string
  atBreak?: boolean
  inConstruct?: ConstructName | ConstructName[]
  notInConstruct?: ConstructName[]
}

/** Constructs whose content is not phrasing, so emphasis and the like cannot start inside them. */
const fullPhrasingSpans: ConstructName[] = [
  'autolink',
  'destinationLiteral',
  'destinationRaw',
  'reference',
  'titleQuote',
  'titleApostrophe',
]

/** `mdast-util-gfm-autolink-literal`: text that would otherwise become a link. */
const literalAutolink: Pick<UnsafePattern, 'inConstruct' | 'notInConstruct'> = {
  inConstruct: 'phrasing',
  notInConstruct: ['autolink', 'link', 'image', 'label'],
}

export const UNSAFE: UnsafePattern[] = [
  // mdast-util-to-markdown
  { character: '\t', after: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: '\t', before: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: '\t', inConstruct: ['codeFencedLangGraveAccent', 'codeFencedLangTilde'] },
  {
    character: '\r',
    inConstruct: [
      'codeFencedLangGraveAccent',
      'codeFencedLangTilde',
      'codeFencedMetaGraveAccent',
      'codeFencedMetaTilde',
      'destinationLiteral',
      'headingAtx',
    ],
  },
  {
    character: '\n',
    inConstruct: [
      'codeFencedLangGraveAccent',
      'codeFencedLangTilde',
      'codeFencedMetaGraveAccent',
      'codeFencedMetaTilde',
      'destinationLiteral',
      'headingAtx',
    ],
  },
  { character: ' ', after: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: ' ', before: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: ' ', inConstruct: ['codeFencedLangGraveAccent', 'codeFencedLangTilde'] },
  // An exclamation mark followed by a link would make an image.
  { character: '!', after: '\\[', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  { character: '"', inConstruct: 'titleQuote' },
  { atBreak: true, character: '#' },
  { character: '#', inConstruct: 'headingAtx', after: '(?:[\r\n]|$)' },
  // A character reference.
  { character: '&', after: '[#A-Za-z]', inConstruct: 'phrasing' },
  { character: "'", inConstruct: 'titleApostrophe' },
  { character: '(', inConstruct: 'destinationRaw' },
  // `](` would make a link.
  { before: '\\]', character: '(', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  // An ordered list item, or the end of a destination.
  { atBreak: true, before: '\\d+', character: ')' },
  { character: ')', inConstruct: 'destinationRaw' },
  // A thematic break, a list item, emphasis or strong.
  { atBreak: true, character: '*', after: '(?:[ \t\r\n*])' },
  { character: '*', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  { atBreak: true, character: '+', after: '(?:[ \t\r\n])' },
  { atBreak: true, character: '-', after: '(?:[ \t\r\n-])' },
  { atBreak: true, before: '\\d+', character: '.', after: '(?:[ \t\r\n]|$)' },
  // Raw HTML or an autolink.
  { atBreak: true, character: '<', after: '[!/?A-Za-z]' },
  { character: '<', after: '[!/?A-Za-z]', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  { character: '<', inConstruct: 'destinationLiteral' },
  // A setext heading underline.
  { atBreak: true, character: '=' },
  // A block quote, or the end of a destination.
  { atBreak: true, character: '>' },
  { character: '>', inConstruct: 'destinationLiteral' },
  // A definition, a reference or a link label.
  { atBreak: true, character: '[' },
  { character: '[', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  { character: '[', inConstruct: ['label', 'reference'] },
  // A hard break. Other escapes are handled in `safe`.
  { character: '\\', after: '[\\r\\n]', inConstruct: 'phrasing' },
  { character: ']', inConstruct: ['label', 'reference'] },
  { atBreak: true, character: '_' },
  { character: '_', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  // Code, or the end of a code fence's info string.
  { atBreak: true, character: '`' },
  { character: '`', inConstruct: ['codeFencedLangGraveAccent', 'codeFencedMetaGraveAccent'] },
  { character: '`', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  { atBreak: true, character: '~' },
  // mdast-util-gfm-autolink-literal
  { character: '@', before: '[+\\-.\\w]', after: '[\\-.\\w]', ...literalAutolink },
  { character: '.', before: '[Ww]', after: '[\\-.\\w]', ...literalAutolink },
  { character: ':', before: '[ps]', after: '\\/', ...literalAutolink },
  // mdast-util-gfm-footnote
  { character: '[', inConstruct: ['phrasing', 'label', 'reference'] },
  // mdast-util-gfm-strikethrough
  { character: '~', inConstruct: 'phrasing', notInConstruct: fullPhrasingSpans },
  // mdast-util-gfm-table
  { character: '\r', inConstruct: 'tableCell' },
  { character: '\n', inConstruct: 'tableCell' },
  // A pipe followed by padding or a delimiter could start a table.
  { atBreak: true, character: '|', after: '[\t :-]' },
  { character: '|', inConstruct: 'tableCell' },
  // A colon followed by a dash could start a delimiter row.
  { atBreak: true, character: ':', after: '-' },
  { atBreak: true, character: '-', after: '[:|-]' },
  // mdast-util-gfm-task-list-item
  { atBreak: true, character: '-', after: '[:|-]' },
]

const compiled = new Map<UnsafePattern, RegExp>()

/** The pattern as a global regular expression, whose first group (if any) is what precedes the character. */
export const compilePattern = (pattern: UnsafePattern): RegExp => {
  let expression = compiled.get(pattern)
  if (!expression) {
    const before = (pattern.atBreak ? '[\\r\\n][\\t ]*' : '') + (pattern.before ? `(?:${pattern.before})` : '')
    expression = new RegExp(
      (before ? `(${before})` : '') +
        (/[|\\{}()[\]^$+*?.-]/.test(pattern.character) ? '\\' : '') +
        pattern.character +
        (pattern.after ? `(?:${pattern.after})` : ''),
      'g',
    )
    compiled.set(pattern, expression)
  }
  return expression
}

const listInScope = (stack: ConstructName[], list: ConstructName | ConstructName[] | undefined, none: boolean) => {
  if (list === undefined) return none
  const names = typeof list === 'string' ? [list] : list
  if (names.length === 0) return none
  return names.some((name) => stack.includes(name))
}

/** Whether the pattern applies inside the constructs on the stack. */
export const patternInScope = (stack: ConstructName[], pattern: UnsafePattern): boolean =>
  listInScope(stack, pattern.inConstruct, true) && !listInScope(stack, pattern.notInConstruct, false)

/** `&#xHEX;`, which works where a backslash escape does not (before a letter, or for whitespace). */
export const encodeCharacterReference = (code: number): string => `&#x${code.toString(16).toUpperCase()};`

/**
 * Doubles a backslash that would otherwise escape the punctuation after it, including the first
 * character of `after`, which is what follows `value` in the output.
 */
const escapeBackslashes = (value: string, after: string): string => {
  const expression = /\\(?=[!-/:-@[-`{-~])/g
  const whole = value + after
  const results: string[] = []
  let start = 0
  let match: RegExpExecArray | null
  while ((match = expression.exec(whole))) {
    if (start !== match.index) results.push(value.slice(start, match.index))
    results.push('\\')
    start = match.index
  }
  results.push(value.slice(start))
  return results.join('')
}

/** What surrounds the text in the output, so patterns that depend on it match. */
export type SafeConfig = { before: string; after: string; encode?: string[] }

/**
 * Escapes `input` for the constructs on `stack`. Every unsafe character gets a backslash if it is
 * ASCII punctuation, or a character reference otherwise (`encode` forces the latter, for code fence
 * info strings, where backslashes are not escapes).
 *
 * Positions are kept in a map rather than the array `mdast-util-to-markdown` searches, which made
 * a long run of unsafe characters quadratic. The result is the same.
 */
export const safe = (stack: ConstructName[], input: string, config: SafeConfig): string => {
  const value = config.before + input + config.after
  const infos = new Map<number, { before: boolean; after: boolean }>()
  for (const pattern of UNSAFE) {
    if (!patternInScope(stack, pattern)) continue
    const expression = compilePattern(pattern)
    const before = pattern.before !== undefined || pattern.atBreak === true
    const after = pattern.after !== undefined
    let match: RegExpExecArray | null
    while ((match = expression.exec(value))) {
      const position = match.index + (before ? match[1]!.length : 0)
      const info = infos.get(position)
      if (info) {
        // Unconditional wins: a character that is unsafe anyhow is escaped whatever surrounds it.
        if (info.before && !before) info.before = false
        if (info.after && !after) info.after = false
      } else infos.set(position, { before, after })
    }
  }
  const positions = [...infos.keys()].sort((a, b) => a - b)
  const result: string[] = []
  let start = config.before.length
  const end = value.length - config.after.length
  for (let index = 0; index < positions.length; index++) {
    const position = positions[index]!
    if (position < start || position >= end) continue
    const info = infos.get(position)!
    const next = infos.get(position + 1)
    const previous = infos.get(position - 1)
    // A character that is unsafe only because of its neighbour needs no escape when that
    // neighbour is escaped unconditionally.
    if (
      (position + 1 < end &&
        positions[index + 1] === position + 1 &&
        info.after &&
        next &&
        !next.before &&
        !next.after) ||
      (positions[index - 1] === position - 1 && info.before && previous && !previous.before && !previous.after)
    ) {
      continue
    }
    if (start !== position) result.push(escapeBackslashes(value.slice(start, position), '\\'))
    start = position
    const character = value.charAt(position)
    if (/[!-/:-@[-`{-~]/.test(character) && !config.encode?.includes(character)) {
      result.push('\\')
    } else {
      result.push(encodeCharacterReference(value.charCodeAt(position)))
      start++
    }
  }
  result.push(escapeBackslashes(value.slice(start, end), config.after))
  return result.join('')
}

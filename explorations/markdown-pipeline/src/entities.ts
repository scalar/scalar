/**
 * Character references, without the HTML entity table: numeric references and a few common names
 * are decoded here, and every other valid name is written through for the browser to decode.
 */
import { REF } from './html'

/**
 * Named references the parser decodes itself, so heading text and URLs
 * read naturally. Every other valid name is written through for the browser to
 * decode, which renders identically without shipping the 2,125-name table.
 */
export const COMMON: Record<string, string> = {
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
export const LEGACY =
  'AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml'.split(
    ' ',
  )
export const LEGACY_PREFIXED = new Set(
  'GTGT LTLT ampersand angmsd angmsdaa angmsdab angmsdac angmsdad angmsdae angmsdaf angmsdag angmsdah angst gtcc gtcir gtdot gtlPar gtquest gtrapprox gtrarr gtrdot gtreqless gtreqqless gtrless gtrsim ltcc ltcir ltdot lthree ltimes ltlarr ltquest ltrPar ltri ltrie ltrif notin notinE notindot notinva notinvb notinvc notni notniva notnivb notnivc parallel parsim parsl part times timesb timesbar timesd'.split(
    ' ',
  ),
)

/** micromark's rule: controls, surrogates, noncharacters and out-of-range code points become U+FFFD. */
export const fromCodePoint = (cp: number): string =>
  cp < 9 ||
  cp === 11 ||
  (cp > 13 && cp < 32) ||
  (cp > 126 && cp < 160) ||
  (cp > 55_295 && cp < 57_344) ||
  (cp > 64_975 && cp < 65_008) ||
  (cp & 65_535) === 65_535 ||
  (cp & 65_535) === 65_534 ||
  cp > 1_114_111
    ? '\ufffd'
    : String.fromCodePoint(cp)

/**
 * A reference in Markdown text. Numeric ones and common names decode here; other names are kept
 * for the browser behind the `REF` marker, unless HTML would read them differently from
 * CommonMark (`&notit;`), in which case they stay literal.
 */
export const decodeEntity = (ref: string): string => {
  if (ref[1] === '#') {
    const hex = ref[2] === 'x' || ref[2] === 'X'
    return fromCodePoint(Number.parseInt(ref.slice(hex ? 3 : 2, -1), hex ? 16 : 10))
  }
  const name = ref.slice(1, -1)
  const common = COMMON[name]
  if (common) return common
  if (LEGACY.includes(name) || LEGACY_PREFIXED.has(name) || !LEGACY.some((p) => name.startsWith(p))) {
    return REF + ref.slice(1)
  }
  return ref
}

/**
 * What a named reference decodes to, as far as a URL check needs: the character for common
 * names, a stand-in for the Latin-1 legacy names (never ASCII, so never part of a scheme), and
 * `null` when it is not known here.
 */
export const knownEntity = (name: string): string | null =>
  COMMON[name] ?? (LEGACY.includes(name) || LEGACY_PREFIXED.has(name) ? '\u00ff' : null)

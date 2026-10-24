/**
 * Character references. Named ones are decoded with `decode-named-character-reference`, the
 * decoder micromark uses today: in a browser it asks the DOM, so no entity table is shipped.
 */
import { decodeNamedCharacterReference } from 'decode-named-character-reference'

/**
 * Names HTML decodes even without a trailing `;`, and as a prefix of a longer name: a browser
 * reads `&notit;` as `¬it;`. Only needed where raw HTML is decoded here rather than by the browser.
 */
const LEGACY =
  'AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 frac34 gt iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3 szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml'.split(
    ' ',
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
    ? '�'
    : String.fromCodePoint(cp)

/** A reference in Markdown text, decoded as micromark does; an unknown name stays literal. */
export const decodeEntity = (ref: string): string => {
  if (ref[1] === '#') {
    const hex = ref[2] === 'x' || ref[2] === 'X'
    return fromCodePoint(Number.parseInt(ref.slice(hex ? 3 : 2, -1), hex ? 16 : 10))
  }
  return decodeNamedCharacterReference(ref.slice(1, -1)) || ref
}

/** What the HTML parser makes of `&#128;` to `&#159;`: the windows-1252 characters. */
const WINDOWS_1252 = '€\x81‚ƒ„…†‡ˆ‰Š‹Œ\x8dŽ\x8f\x90‘’“”•–—˜™š›œ\x9džŸ'

const HTML_REFERENCE = /&(?:#(?:[xX]([0-9a-fA-F]+)|([0-9]+));?|([a-zA-Z][a-zA-Z0-9]*)(;?))/g

/**
 * Character references in raw HTML, decoded as the HTML parser does. In an attribute value, a
 * legacy name followed by an alphanumeric or `=` stays literal (`?a=1&copy=2`).
 */
export const decodeHtml = (s: string, attribute = false): string =>
  s.replace(HTML_REFERENCE, (m, hex, dec, name, semi, at: number) => {
    if (name === undefined) {
      const cp = Number.parseInt(hex ?? dec, hex ? 16 : 10)
      if (cp === 0 || cp > 0x10_ff_ff || (cp >= 0xd8_00 && cp <= 0xdf_ff)) return '�'
      return cp >= 0x80 && cp <= 0x9f ? WINDOWS_1252[cp - 0x80]! : String.fromCodePoint(cp)
    }
    if (semi) {
      const value = decodeNamedCharacterReference(name)
      if (value) return value
    }
    // The longest legacy name the reference starts with, if any.
    const legacy = LEGACY.reduce((best, l) => (name.startsWith(l) && l.length > best.length ? l : best), '')
    if (!legacy) return m
    const rest = m.slice(1 + legacy.length)
    if (attribute && /^[a-zA-Z0-9=]/.test(rest || s.slice(at + m.length, at + m.length + 1))) return m
    return decodeNamedCharacterReference(legacy) + rest
  })

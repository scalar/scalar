/**
 * Reading text back out of the HTML the renderer produced.
 *
 * Every suite needs the same assertion — highlight, strip the markup, and get
 * the source back — so the walk lives here once rather than in each file.
 *
 * This is a test utility for our own output, not a sanitizer. It never sees
 * untrusted HTML: the input is always a string this package just rendered,
 * where every `<` from the source has already been escaped to `&lt;`, so the
 * only bare `<` left is the start of a tag we wrote. Scanning for those tags
 * explicitly rather than with a `/<[^>]*>/` replace keeps that distinction
 * legible — a tag-stripping regex reads like a sanitizer and is a poor one.
 */

/** Skips the tags the renderer emitted, keeping the text between them. */
const stripTags = (html: string): string => {
  let text = ''
  let at = 0

  while (at < html.length) {
    const open = html.indexOf('<', at)
    if (open === -1) {
      text += html.slice(at)
      break
    }

    text += html.slice(at, open)

    const close = html.indexOf('>', open)
    // An unclosed `<` means the renderer emitted something malformed. Keep the
    // rest verbatim so the assertion fails loudly on the real output.
    if (close === -1) {
      text += html.slice(open)
      break
    }

    at = close + 1
  }

  return text
}

/**
 * Resolves the entities either serializer produces.
 *
 * Ours emits only the four named forms; the lowlight pipeline the compat tests
 * differ against also emits numeric ones, so both are handled here and the
 * comparison stays symmetric.
 *
 * `&amp;` goes last: doing it first would turn `&amp;lt;` into `&lt;` and then
 * into `<`, inventing a character the source never had.
 */
const decodeEntities = (html: string): string => {
  return html
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

/** The text a reader sees: markup removed, entities resolved. */
export const textFromHtml = (html: string): string => {
  return decodeEntities(stripTags(html))
}

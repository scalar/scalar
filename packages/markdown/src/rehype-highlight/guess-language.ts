/** Markup opens with a doctype, an XML prolog, a comment or a tag name. */
const MARKUP_START = /^<(?:!doctype\b|\?xml\b|!--|[a-z][\w:-]*[\s/>])/i

/** A closing or self-closing tag, which a TypeScript generic such as `<T>(x: T) => T` never has. */
const MARKUP_TAG = /<\/[a-z][\w:-]*\s*>|\/>/i

const CURL = /^(?:\$\s+)?curl\s/

/** JSON is the only guess we can confirm, so it is the only one that runs a parser. */
const isJson = (code: string): boolean => {
  const first = code[0]
  const last = code[code.length - 1]

  if (!((first === '{' && last === '}') || (first === '[' && last === ']'))) {
    return false
  }

  try {
    JSON.parse(code)
    return true
  } catch {
    return false
  }
}

const isMarkup = (code: string): boolean =>
  MARKUP_START.test(code) && code.endsWith('>') && (/^<(?:!doctype|\?xml|!--)/i.test(code) || MARKUP_TAG.test(code))

/**
 * Guesses the language of a code block that does not name one, or returns `undefined`.
 *
 * highlight.js scored every grammar against the text and almost always picked
 * one, so shell commands came out as CSS and C# as Dart. This only answers when
 * the text can hardly be anything else: JSON that parses, markup that opens and
 * closes like markup, and a curl command. Everything else stays plain, which is
 * a better result than confident colours in the wrong language.
 */
export const guessLanguage = (code: string): string | undefined => {
  const trimmed = code.trim()

  if (trimmed === '') {
    return undefined
  }
  if (isJson(trimmed)) {
    return 'json'
  }
  if (CURL.test(trimmed)) {
    return 'curl'
  }
  if (isMarkup(trimmed)) {
    return 'html'
  }

  return undefined
}

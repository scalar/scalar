import { canonicalName, grammarFor } from '@scalar/highlight/compat'
import { type Emit, tokenizeWith } from '@scalar/highlight/core'

type AddFold = (start: number, end: number) => void

const voidElements = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '))
// Common paragraph boundaries with optional HTML end tags, as defined by the HTML Standard.
const paragraphEndTags = new Set(
  'address article aside blockquote details dialog div dl fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre search section table ul'.split(
    ' ',
  ),
)
const closingBrackets = { '}': '{', ']': '[' } as const

/** Fold YAML block mappings, sequences and scalars using their indentation. */
const addIndentationFolds = (code: string, addFold: AddFold): void => {
  const parents: { line: number; indent: number }[] = []
  let previous: { line: number; indent: number } | undefined

  code.split('\n').forEach((text, line) => {
    const indent = text.search(/\S/)
    if (indent === -1) {
      return
    }

    while (previous && parents.at(-1) && parents.at(-1)!.indent >= indent) {
      addFold(parents.pop()!.line, previous.line)
    }
    if (previous && previous.indent < indent) {
      parents.push(previous)
    }
    previous = { line, indent }
  })

  for (const parent of parents) {
    addFold(parent.line, previous!.line)
  }
}

/** Collects folds during the same grammar scan used for syntax highlighting. */
export const createCodeFoldCollector = (
  code: string,
  lang: string,
): { ranges: ReadonlyMap<number, number>; onToken: Emit } => {
  const folds = new Map<number, number>()
  const grammar = grammarFor(canonicalName(lang))
  const addFold: AddFold = (start, end) => {
    if (end > start) {
      folds.set(start, Math.max(end, folds.get(start) ?? start))
    }
  }
  if (grammar?.name === 'yaml') {
    addIndentationFolds(code, addFold)
  }

  // The highlighter already distinguishes structural punctuation from strings and comments.
  const brackets: { value: string; line: number }[] = []
  const openTags: { name: string; line: number }[] = []
  const isHtml = lang.trim().toLowerCase() === 'html'
  let tagStart: '<' | '</' | undefined
  let tagName: string | undefined
  let tagLine = 0
  let endBeforeTag = 0
  let line = 0
  let lineStart = 0
  let newline = code.indexOf('\n')

  // Keep a dedicated closing line visible. A mixed closing line belongs to
  // the body being folded, so hide it together with the other body lines.
  const lineBefore = (offset: number): number => {
    let before = offset - 1
    while (before >= lineStart && (code[before] === ' ' || code[before] === '\t')) {
      before--
    }
    return before >= lineStart ? line : line - 1
  }

  const onToken: Emit = (scope, start, end) => {
    while (newline !== -1 && newline < start) {
      line += 1
      lineStart = newline + 1
      newline = code.indexOf('\n', lineStart)
    }

    if (scope === 'tag' && tagStart && !tagName) {
      const name = code.slice(start, end)
      tagName = isHtml ? name.toLowerCase() : name
      return
    }
    if (scope !== 'punctuation.bracket') {
      return
    }

    const value = code.slice(start, end)
    switch (value) {
      case '{':
      case '[':
        brackets.push({ value, line })
        break
      case '}':
      case ']': {
        const open = brackets.at(-1)
        if (open?.value === closingBrackets[value]) {
          brackets.pop()
          if (open.line < line) {
            addFold(open.line, lineBefore(start))
          }
        }
        break
      }
      case '<':
      case '</':
        tagStart = value
        tagName = undefined
        tagLine = line
        endBeforeTag = lineBefore(start)
        break
      case '>':
      case '/>': {
        if (tagName && tagStart === '<') {
          const previous = openTags.at(-1)
          if (
            isHtml &&
            previous &&
            ((previous.name === 'li' && tagName === 'li') || (previous.name === 'p' && paragraphEndTags.has(tagName)))
          ) {
            openTags.pop()
            addFold(previous.line, endBeforeTag)
          }
          if (value === '>' && (!isHtml || !voidElements.has(tagName))) {
            openTags.push({ name: tagName, line: tagLine })
          }
        } else if (value === '>' && tagName && tagStart === '</') {
          let opening = openTags.length - 1
          while (opening >= 0 && openTags[opening]?.name !== tagName) {
            opening--
          }
          if (opening !== -1) {
            if (isHtml) {
              for (let index = opening + 1; index < openTags.length; index++) {
                const child = openTags[index]!
                if (child.name === 'p' || child.name === 'li') {
                  addFold(child.line, endBeforeTag)
                }
              }
            }
            addFold(openTags[opening]!.line, endBeforeTag)
            openTags.length = opening
          }
        }
        tagStart = undefined
        tagName = undefined
        break
      }
    }
  }

  return { ranges: folds, onToken }
}

/** Maps a zero-based opening line to the last line hidden by folding it. */
export const getCodeFoldRanges = (code: string, lang: string): ReadonlyMap<number, number> => {
  const grammar = grammarFor(canonicalName(lang))
  if (!grammar || !code.includes('\n')) {
    return new Map()
  }
  const { ranges, onToken } = createCodeFoldCollector(code, lang)
  tokenizeWith(code, grammar, onToken)
  return ranges
}

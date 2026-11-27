import { canonicalName, grammarFor } from '@scalar/highlight/compat'
import { type Emit, tokenizeWith } from '@scalar/highlight/core'

type AddFold = (start: number, end: number) => void

const voidElements = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '))
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
  const openTags = new Map<string, number[]>()
  const isHtml = lang.trim().toLowerCase() === 'html'
  let tagStart: '<' | '</' | undefined
  let tagName: string | undefined
  let line = 0
  let newline = code.indexOf('\n')

  const onToken: Emit = (scope, start, end) => {
    while (newline !== -1 && newline < start) {
      line += 1
      newline = code.indexOf('\n', newline + 1)
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
          addFold(open.line, line - 1)
        }
        break
      }
      case '<':
      case '</':
        tagStart = value
        tagName = undefined
        break
      case '>':
      case '/>': {
        if (value === '>' && tagName && (!isHtml || !voidElements.has(tagName))) {
          const openings = openTags.get(tagName) ?? []
          if (tagStart === '<') {
            openings.push(line)
            openTags.set(tagName, openings)
          } else {
            const open = openings.pop()
            if (open !== undefined) {
              addFold(open, line - 1)
            }
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

/* ---------------------------------------------------------------------
   Syntax highlighting
   A small tokenizer, not a parser — enough for the samples on this page,
   with no dependency to load. Rules are tried left to right, so the order
   inside each list matters: comments and strings claim their text first.
   --------------------------------------------------------------------- */

const KEYWORDS =
  'import|from|export|default|const|let|var|new|function|return|await|async|for|of|in|if|else|while|do|end|def|class|module|require|package|func|range|public|private|static|void|final|implementation|puts|print'

const BUILTINS = 'true|false|nil|None|null|self|this|err|panic'

/** Line-comment syntax differs by target; everything else is shared. */
const HASH_COMMENT_TARGETS = ['python', 'ruby', 'cli']

export const codeRules = (target) => {
  const comment = HASH_COMMENT_TARGETS.includes(target) ? '#[^\\n]*' : '//[^\\n]*'

  const rules = [
    ['comment', comment],
    ['string', '"(?:[^"\\\\\\n]|\\\\.)*"|\x27(?:[^\x27\\\\\\n]|\\\\.)*\x27'],
  ]

  /* Shell flags read as their own thing, not an operator plus a word. */
  if (target === 'cli') {
    rules.push(['flag', '--[\\w-]+'])
  }

  rules.push(
    ['keyword', `\\b(?:${KEYWORDS})\\b`],
    ['builtin', `\\b(?:${BUILTINS})\\b`],
    ['type', '\\b[A-Z][A-Za-z0-9_]*\\b'],
    ['number', '\\b\\d+(?:\\.\\d+)?\\b'],
    ['fn', '\\b[a-zA-Z_]\\w*(?=\\()'],
  )

  return rules
}

/*
 * api.md and SKILL.md are markdown, so they get their own rule set — and a
 * deliberately narrow one. Prose is full of capitalised words and words
 * followed by brackets, so the code rules for types and calls would paint
 * half of every sentence. These match structure instead: frontmatter,
 * headings, inline code, and the signature lines api.md is made of.
 */
export const MARKDOWN_RULES = [
  ['meta', '^---$'],
  ['heading', '^#{1,6} [^\n]*'],
  ['string', '`[^`\n]*`'],
  ['keyword', '\\b(?:GET|POST|PUT|PATCH|DELETE)\\b'],
  ['fn', '\\b[a-z]\\w*(?:\\.\\w+)+(?=\\()'],
  ['type', '->\\s*[A-Za-z][\\w<>\\[\\],. ]*'],
  ['bullet', '^\\s*-(?= )'],
]

/* The OpenAPI document behind "View API". Keys carry the structure, so they
 * are what gets picked out; a bare URL must not read as one. */
export const YAML_RULES = [
  ['comment', '#[^\n]*'],
  ['string', '"(?:[^"\\\\\n]|\\\\.)*"|\x27(?:[^\x27\\\\\n]|\\\\.)*\x27'],
  ['key', '^[ \t]*(?:- )?[\\w$][\\w.-]*(?=:)'],
  ['builtin', '\\b(?:true|false|null)\\b'],
  ['number', '\\b\\d+(?:\\.\\d+)?\\b'],
  ['bullet', '^[ \t]*-(?= )'],
]

/**
 * Turn source text into highlighted React children.
 *
 * Returns elements rather than markup, so the sample text is never parsed as
 * HTML no matter what it contains.
 */
export const highlight = (text, rules) => {
  const pattern = new RegExp(rules.map(([name, re]) => `(?<${name}>${re})`).join('|'), 'gm')

  const nodes = []
  let index = 0

  for (const match of text.matchAll(pattern)) {
    if (match.index > index) {
      nodes.push(text.slice(index, match.index))
    }

    const name = Object.keys(match.groups).find((key) => match.groups[key] !== undefined)
    nodes.push(
      <span
        className={`sdk-demo-tok-${name}`}
        key={`${match.index}-${name}`}>
        {match[0]}
      </span>,
    )
    index = match.index + match[0].length
  }

  if (index < text.length) {
    nodes.push(text.slice(index))
  }

  return nodes
}

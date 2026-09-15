/**
 * The colour `code.css` gives each highlight.js class.
 *
 * A class-name diff is not the question anyone is really asking — several
 * highlight.js classes resolve to the same CSS variable, so swapping one for
 * another changes nothing on screen. This models the stylesheet well enough to
 * answer the real question: for what share of the characters in a code block
 * does the rendered colour change?
 *
 * Transcribed from `packages/code-highlight/src/css/code.css`. Every rule
 * there is a single class except the two `.hljs-title` compounds, and no class
 * is styled twice, so a flat map plus a compound check reproduces the cascade.
 */
const COLORS: Record<string, string> = {
  'hljs-comment': 'color-3',
  'hljs-quote': 'color-3',
  'hljs-number': 'orange',
  'hljs-regexp': 'blue',
  'hljs-string': 'blue',
  'hljs-built_in': 'blue',
  'hljs-keyword': 'purple',
  'hljs-subst': 'blue',
  'hljs-name': 'blue',
  'hljs-attr': 'color-1',
  'hljs-attribute': 'color-1',
  'hljs-addition': 'green',
  'hljs-literal': 'green',
  'hljs-selector-tag': 'green',
  'hljs-type': 'green',
  'hljs-selector-attr': 'orange',
  'hljs-selector-pseudo': 'orange',
  'hljs-doctag': 'blue',
  'hljs-section': 'blue',
  'hljs-title': 'blue',
  'hljs-selector-id': 'color-1',
  'hljs-template-variable': 'color-1',
  'hljs-variable': 'color-1',
  'hljs-bullet': 'blue',
  'hljs-link': 'blue',
  'hljs-meta': 'blue',
  'hljs-symbol': 'blue',
  'hljs-deletion': 'red',
}

/** Text with no class of its own takes the colour `code.hljs` sets. */
const DEFAULT_COLOR = 'color-2'

/**
 * Resolves one `class` attribute to a colour.
 *
 * `.hljs-title.function_` and `.hljs-title.class_` outrank the bare
 * `.hljs-title` rule on specificity, so they are checked first. Anything
 * unstyled returns `null`, meaning "inherit from the enclosing span".
 */
function colorForClass(className: string): string | null {
  const names = className.split(/\s+/)

  if (names.includes('hljs-title')) {
    if (names.includes('function_')) return 'orange'
    if (names.includes('class_')) return 'color-1'
  }

  for (const name of names) {
    const color = COLORS[name]
    if (color) return color
  }

  return null
}

function decodeEntities(html: string): string {
  return html
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

/**
 * Flattens highlighted HTML to one colour name per character of visible text.
 *
 * Spans nest in the lowlight output and do not in ours, so this walks a stack
 * and takes the innermost span that actually sets a colour — which is what the
 * browser does.
 */
export function colorPerCharacter(html: string): { char: string; color: string }[] {
  const inner = html.replace(/^.*?<code[^>]*>/s, '').replace(/<\/code>.*$/s, '')
  const stack: string[] = [DEFAULT_COLOR]
  const out: { char: string; color: string }[] = []

  const token = /<span class="([^"]*)">|<\/span>|[^<]+/g
  let match: RegExpExecArray | null

  while ((match = token.exec(inner)) !== null) {
    const [text, className] = match

    if (className !== undefined) {
      stack.push(colorForClass(className) ?? stack[stack.length - 1]!)
    } else if (text === '</span>') {
      if (stack.length > 1) stack.pop()
    } else {
      const color = stack[stack.length - 1]!
      for (const char of decodeEntities(text)) out.push({ char, color })
    }
  }

  return out
}

/**
 * Share of characters rendered in the same colour by both pipelines.
 *
 * Whitespace is skipped: a run of indentation has a colour, but nobody can
 * see it, and counting it would flatter the number.
 */
export function colorAgreement(
  before: string,
  after: string,
): { agreement: number; compared: number; differing: number } {
  const a = colorPerCharacter(before)
  const b = colorPerCharacter(after)

  let compared = 0
  let differing = 0

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (/\s/.test(a[i]!.char)) continue
    compared++
    if (a[i]!.color !== b[i]!.color) differing++
  }

  return {
    agreement: compared === 0 ? 1 : (compared - differing) / compared,
    compared,
    differing,
  }
}

/**
 * Block splitting and keying helpers for `ChatMarkdown`.
 *
 * Streaming re-renders an entire message through one markdown parse per
 * token, which destroys the DOM of already-final prose — killing text
 * selection mid-stream and re-announcing everything to screen readers.
 * Splitting the source into stable top-level blocks lets the component
 * memoize every completed block and confine churn to the trailing one.
 */

/** An open fenced code block the splitter is currently inside. */
type OpenFence = {
  /** The fence character, backtick or tilde. */
  char: '`' | '~'
  /** The opening run length; a closer must be at least this long. */
  length: number
}

/**
 * Matches a fence opening: up to three spaces of indentation, then a run of
 * three or more backticks or tildes, then an optional info string.
 */
const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/

/**
 * Matches a fence closing candidate: only whitespace may follow the run —
 * a closing fence cannot carry an info string.
 */
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/

const parseFenceOpening = (line: string): OpenFence | undefined => {
  const match = line.match(FENCE_OPEN_RE)

  if (!match || !match[1]) {
    return undefined
  }

  const run = match[1]
  const char = run[0] as '`' | '~'

  // A backtick fence cannot carry backticks in its info string — such a
  // line is inline code, not a fence opening.
  if (char === '`' && (match[2] ?? '').includes('`')) {
    return undefined
  }

  return { char, length: run.length }
}

const closesFence = (line: string, fence: OpenFence): boolean => {
  const match = line.match(FENCE_CLOSE_RE)

  if (!match || !match[1]) {
    return false
  }

  return match[1][0] === fence.char && match[1].length >= fence.length
}

/**
 * Matches a line that may CONTINUE a container across the blank line before
 * it: list items (`-`, `*`, `+`, `1.`, `1)`) — a loose list's next item;
 * blockquotes; and any indented line — list-item continuation paragraphs,
 * indented code blocks and indented fences (CommonMark continuation indent
 * can be as small as the marker width, so any leading whitespace counts).
 * A bare marker at the end of a line counts too: an empty list item is
 * valid CommonMark, and mid-stream a chunk boundary can land right after
 * the marker — splitting there would re-mount the previous block a moment
 * later when the item's text arrives.
 */
const CONTINUATION_LINE_RE = /^(\s+\S|\s*([-*+]|\d{1,9}[.)])(\s|$)|\s*>)/

/**
 * CommonMark HTML blocks of types 1–5 continue across blank lines until
 * their closing marker, so splitting them on a blank line changes what the
 * parser sees: a whole-document parse swallows `<!-- … -->` entirely, while
 * a split renders the tail (`… -->`) as a visible paragraph. Types 6–7
 * (plain block tags like `<details>`) end AT the blank line, so splitting
 * them is parser-equivalent and needs no handling here.
 */
const HTML_BLOCK_MARKERS: { open: RegExp; close: RegExp }[] = [
  {
    open: /^ {0,3}<(?:pre|script|style|textarea)\b/i,
    close: /<\/(?:pre|script|style|textarea)>/i,
  },
  // `--!>` is an (invalid but accepted) comment close in both the HTML
  // spec and micromark — verified empirically: micromark ends the comment
  // block there, so gluing past it would diverge from the parser.
  { open: /^ {0,3}<!--/, close: /--!?>/ },
  { open: /^ {0,3}<\?/, close: /\?>/ },
  { open: /^ {0,3}<!\[CDATA\[/, close: /\]\]>/ },
  { open: /^ {0,3}<![A-Za-z]/, close: />/ },
]

/**
 * Matches a footnote definition (`[^1]: text`) at the start of a line.
 * Footnote definitions render VISIBLE content wherever they are parsed, so a
 * source containing one can never be split: usages in other blocks would
 * lose their footnote, and copying the definition into each block would
 * duplicate the visible footnote section. A false positive (the pattern
 * inside a code fence) only costs memoization, never correctness.
 */
const FOOTNOTE_DEFINITION_RE = /^ {0,3}\[\^[^\]]+\]:/m

/**
 * Matches a link reference definition line (`[label]: destination`),
 * excluding footnotes. Link definitions bind to usages anywhere in the
 * document but render to NOTHING themselves — so the splitter collects them
 * and appends them to every block, letting each block resolve its own
 * usages with no visible trace of the appendix.
 */
const LINK_DEFINITION_LINE_RE = /^ {0,3}\[(?!\^)[^\]]+\]:/

/**
 * A definition line whose destination sits on the SAME line. CommonMark
 * also permits `[label]:` with the destination on the following line — that
 * first line alone is not a valid definition, and appending it to every
 * block would render as literal text everywhere. Such a source bails to a
 * whole-document parse instead (see the collection site). A definition
 * whose title continues on the next line still collects: the appendix copy
 * loses only the title, and the link itself resolves in every block.
 */
const LINK_DEFINITION_WITH_DESTINATION_RE = /^ {0,3}\[(?!\^)[^\]]+\]:\s*\S/

/**
 * Matches any line that OPENS like a definition. The glue decision must be
 * stable from a streaming line's very first character — a decision that
 * flips when `]:`, or the line after it, arrives would retroactively
 * re-merge (and so tear down) a block the live log already announced. So
 * every bracket-opening line glues to the block before it: for a real
 * definition that prevents an empty-rendering definition-only block, and
 * for a plain link-opening paragraph it merely coarsens memoization —
 * the blank line is preserved inside the block, so rendering is identical.
 */
const BRACKET_LINE_RE = /^ {0,3}\[/

type SplitMarkdownOptions = {
  /**
   * The source is final, so its last line counts as terminated. While
   * streaming, the still-growing last line is excluded from definition
   * collection — otherwise every token of an arriving `[1]: …` citation
   * line would re-key (and re-mount) every completed block above it.
   */
  complete?: boolean
}

/**
 * Split markdown into top-level blocks on blank lines.
 *
 * Blank lines inside fenced code blocks never split: a fence opens with
 * three or more backticks or tildes and only a matching closer (same
 * character, at least as long, nothing else on the line) ends it. A fence
 * still open at the end of the source keeps everything from its opening
 * line in one trailing block, so a code block streaming in token by token
 * stays whole.
 *
 * A blank line also does not split when the line after it could continue a
 * container — a loose list's next item, a list-item continuation paragraph,
 * indented code, an indented fence, a blockquote. Splitting those would
 * change what the markdown parser sees (a loose list becomes several tight
 * lists; an indented continuation becomes a code block), so such runs stay
 * in one block at the cost of coarser memoization.
 *
 * Raw HTML blocks that continue across blank lines (`<script>`, `<!-- -->`
 * and friends — CommonMark types 1–5) glue until their closing marker.
 * Bracket-opening lines glue to the block before them (see
 * `BRACKET_LINE_RE`), and link reference definitions are additionally
 * appended to every block (they render to nothing, so the appendix is
 * invisible while every block resolves its usages); a source containing a
 * footnote definition is never split at all. A plain unindented line after
 * a blank otherwise always starts a fresh block — that split is render-safe
 * for every remaining construct.
 */
export const splitMarkdownBlocks = (source: string, options: SplitMarkdownOptions = {}): string[] => {
  const { complete = true } = options

  // A footnote definition renders visible content in whichever block parses
  // it, so no split is safe — render the whole source as one block.
  if (FOOTNOTE_DEFINITION_RE.test(source)) {
    return source.length > 0 ? [source] : []
  }

  const blocks: string[] = []
  const definitions: string[] = []
  let current: string[] = []
  let fence: OpenFence | undefined
  let htmlBlockClose: RegExp | undefined
  let pendingBlanks: string[] = []
  let previousWasDefinition = false

  const flush = (): void => {
    if (current.length > 0) {
      blocks.push(current.join('\n'))
      current = []
    }

    pendingBlanks = []
  }

  const lines = source.split('\n')
  const lastIndex = lines.length - 1

  for (const [index, line] of lines.entries()) {
    if (fence) {
      current.push(line)

      if (closesFence(line, fence)) {
        fence = undefined
      }

      continue
    }

    if (htmlBlockClose) {
      current.push(line)

      if (htmlBlockClose.test(line)) {
        htmlBlockClose = undefined
      }

      continue
    }

    if (line.trim() === '') {
      if (current.length > 0) {
        pendingBlanks.push(line)
      }

      continue
    }

    // A definition is only real at a block start: CommonMark forbids a
    // definition from interrupting a paragraph, so `Foo\n[bar]: /x` is
    // plain paragraph text — collecting it would fabricate working links
    // in other blocks that the whole-document parse never grants.
    const isDefinition: boolean =
      LINK_DEFINITION_LINE_RE.test(line) && (pendingBlanks.length > 0 || current.length === 0 || previousWasDefinition)

    // A line is terminated once a later line exists; while streaming, the
    // still-growing last line must not collect — appending a partial
    // `[1]: …` would re-key every completed block on each of its tokens.
    const isTerminated = complete || index < lastIndex

    if (pendingBlanks.length > 0) {
      if (CONTINUATION_LINE_RE.test(line) || BRACKET_LINE_RE.test(line)) {
        current.push(...pendingBlanks)
        pendingBlanks = []
      } else {
        flush()
      }
    }

    if (isDefinition && isTerminated) {
      // A terminated definition line with no destination continues onto the
      // next line — the fragment is not a valid definition on its own, so
      // appending it would render literal text in every block. Bail to a
      // whole-document parse, exactly like footnotes. Stable while
      // streaming: an unterminated line never reaches this branch, and once
      // the line is final the decision can never flip back.
      if (!LINK_DEFINITION_WITH_DESTINATION_RE.test(line)) {
        return source.length > 0 ? [source] : []
      }

      definitions.push(line)
    }

    previousWasDefinition = isDefinition
    current.push(line)
    fence = parseFenceOpening(line)

    if (!fence) {
      const marker = HTML_BLOCK_MARKERS.find((m) => m.open.test(line))

      // A marker that opens and closes on the same line needs no gluing.
      if (marker && !marker.close.test(line)) {
        htmlBlockClose = marker.close
      }
    }
  }

  flush()

  if (definitions.length === 0) {
    return blocks
  }

  return blocks.map((block, index) => {
    // Never append inside an unterminated fence or HTML block (only ever
    // the trailing block): the definitions would render as literal code.
    if ((fence || htmlBlockClose) && index === blocks.length - 1) {
      return block
    }

    // Always append — a duplicate definition renders to nothing, while any
    // containment check could be fooled by decoy text inside a code fence
    // into skipping an appendix the block genuinely needs.
    return `${block}\n\n${definitions.join('\n')}`
  })
}

/**
 * A cheap stable key for a markdown block, for use as a `v-for` key.
 *
 * Uses the djb2 string hash — collisions are astronomically unlikely for
 * chat-sized prose and a false collision only costs a skipped re-mount of
 * an identical block. The index is part of the key so two blocks with
 * identical content do not collide with each other.
 */
export const hashMarkdownBlock = (block: string, index: number): string => {
  let hash = 5381

  for (let i = 0; i < block.length; i++) {
    hash = ((hash << 5) + hash + block.charCodeAt(i)) >>> 0
  }

  return `${index}:${hash.toString(36)}`
}

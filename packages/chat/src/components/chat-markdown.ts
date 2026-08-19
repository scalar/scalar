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
 * Split markdown into top-level blocks on blank lines.
 *
 * Blank lines inside fenced code blocks never split: a fence opens with
 * three or more backticks or tildes and only a matching closer (same
 * character, at least as long, nothing else on the line) ends it. A fence
 * still open at the end of the source keeps everything from its opening
 * line in one trailing block, so a code block streaming in token by token
 * stays whole. Lists, blockquotes and tables stay grouped by construction —
 * their lines are consecutive, so no blank line splits them.
 */
export const splitMarkdownBlocks = (source: string): string[] => {
  const blocks: string[] = []
  let current: string[] = []
  let fence: OpenFence | undefined

  const flush = (): void => {
    if (current.length > 0) {
      blocks.push(current.join('\n'))
      current = []
    }
  }

  for (const line of source.split('\n')) {
    if (fence) {
      current.push(line)

      if (closesFence(line, fence)) {
        fence = undefined
      }

      continue
    }

    if (line.trim() === '') {
      flush()
      continue
    }

    current.push(line)
    fence = parseFenceOpening(line)
  }

  flush()

  return blocks
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

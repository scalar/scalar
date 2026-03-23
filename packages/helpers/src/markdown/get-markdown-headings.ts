/**
 * Strips inline Markdown formatting to extract plain text.
 *
 * Handles: links, images, bold/italic, inline code, strikethrough, and HTML tags.
 */
function stripInlineMarkdown(text: string): string {
  return (
    text
      // Images: ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Links: [text](url) → text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Bold/italic combos: ***text*** or ___text___
      .replace(/(\*{3}|_{3})(.+?)\1/g, '$2')
      // Bold: **text** or __text__
      .replace(/(\*{2}|_{2})(.+?)\1/g, '$2')
      // Italic: *text* or _text_
      .replace(/(\*|_)(.+?)\1/g, '$2')
      // Strikethrough: ~~text~~
      .replace(/~~(.+?)~~/g, '$1')
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '$1')
      // HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove any remaining angle brackets to avoid partial/malformed HTML fragments
      .replace(/[<>]/g, '')
      .trim()
  )
}

/**
 * Extract all headings from a Markdown string without any library dependencies.
 *
 * Correctly skips headings inside fenced code blocks (``` or ~~~) and
 * indented code blocks (4+ spaces or tab).
 */
export function getMarkdownHeadings(markdown: string): {
  depth: number
  value: string
}[] {
  const lines = markdown.split('\n')
  const headings: { depth: number; value: string }[] = []

  let inFencedBlock = false
  let fenceChar = ''
  let fenceLength = 0

  for (const line of lines) {
    const trimmed = line.trimStart()

    if (!inFencedBlock) {
      const fence = /^(`{3,}|~{3,})/.exec(trimmed)?.[1]
      if (fence) {
        inFencedBlock = true
        fenceChar = fence.charAt(0)
        fenceLength = fence.length
        continue
      }
    } else {
      const closeFence = /^(`{3,}|~{3,})\s*$/.exec(trimmed)?.[1]
      if (closeFence && closeFence[0] === fenceChar && closeFence.length >= fenceLength) {
        inFencedBlock = false
      }
      continue
    }

    // Skip indented code blocks (4 spaces or 1 tab)
    if (/^(?: {4}|\t)/.test(line)) {
      continue
    }

    // Match ATX headings: 1-6 # characters followed by a space
    const headingMatch = /^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/.exec(trimmed)
    const hashes = headingMatch?.[1]
    const rawText = headingMatch?.[2]
    if (hashes && rawText) {
      const value = stripInlineMarkdown(rawText)
      if (value) {
        headings.push({
          depth: hashes.length,
          value,
        })
      }
    }
  }

  return headings
}

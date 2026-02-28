import * as monaco from 'monaco-editor'

import { parseJsonPointerPath } from './json-pointer-path'

const JSON_POINTER_LINK_SCHEME = 'scalar-json-pointer'

/**
 * Checks if the quote at the given index in the text is an unescaped double quote.
 * An unescaped quote is one not preceded by an odd number of backslashes.
 *
 * @param text - The text string to check within.
 * @param index - The index of the character in text to check.
 * @returns True if the quote is unescaped, false otherwise.
 */
const isUnescapedQuote = (text: string, index: number): boolean => {
  if (text[index] !== '"') {
    return false
  }

  let backslashes = 0
  // Count consecutive backslashes immediately before the quote
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) {
    backslashes++
  }
  // If even number of backslashes, quote is unescaped
  return backslashes % 2 === 0
}

/**
 * Finds the bounds (indices) of the nearest quoted string around a given index on the same line.
 * Only considers unescaped double quotes (").
 * Returns the left (opening) and right (closing) quote indices if both are found, or null otherwise.
 *
 * @param line - The string line in which to search.
 * @param index - The index around which to search for the quoted string.
 * @returns An object with `left` and `right` indices, or null if not found.
 */
const findQuotedStringBounds = (line: string, index: number): { left: number; right: number } | null => {
  // Find the nearest unescaped quote to the left (including the current index)
  let left = -1
  for (let i = index; i >= 0; i--) {
    if (isUnescapedQuote(line, i)) {
      left = i
      break
    }
  }
  if (left === -1) {
    // No opening quote found
    return null
  }

  // Find the nearest unescaped quote to the right after the opening quote
  let right = -1
  for (let i = Math.max(left + 1, index); i < line.length; i++) {
    if (isUnescapedQuote(line, i)) {
      right = i
      break
    }
  }
  // If there is no closing quote or it appears before the opening, return null
  if (right === -1 || right <= left) {
    return null
  }

  return { left, right }
}

/**
 * Enables clickable JSON Pointer links in Monaco JSON editor.
 *
 * - Scans for "#/" inside JSON string values, but only within properly quoted, unescaped strings.
 * - When a valid JSON Pointer is found, highlights it (excluding quotes) as a clickable link.
 * - Clicking the link invokes the provided `navigate` function with the decoded pointer.
 *
 * @param navigate Callback to execute on pointer link click.
 */
export const ensureJsonPointerLinkSupport = (navigate: (pointer: string) => Promise<void> | void): void => {
  monaco.languages.registerLinkProvider('json', {
    provideLinks(textModel) {
      const links: monaco.languages.ILink[] = []

      const lineCount = textModel.getLineCount()
      for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
        const line = textModel.getLineContent(lineNumber)
        let fromIndex = 0

        while (true) {
          // Look for JSON Pointer prefix in the line starting from fromIndex
          const idx = line.indexOf('#/', fromIndex)
          if (idx === -1) {
            break
          }

          // Try to find quoted string bounds around found #/
          const bounds = findQuotedStringBounds(line, idx)
          if (!bounds) {
            fromIndex = idx + 2
            continue
          }

          // Extract the value inside quotes
          const value = line.slice(bounds.left + 1, bounds.right)
          // Only create a link if this is a valid JSON Pointer
          if (!parseJsonPointerPath(value)) {
            fromIndex = bounds.right + 1
            continue
          }

          // Exclude string quotes when creating the link's range
          const range = new monaco.Range(lineNumber, bounds.left + 2, lineNumber, bounds.right + 1)

          // Add the link to the collection
          links.push({
            range,
            url: monaco.Uri.parse(`${JSON_POINTER_LINK_SCHEME}:${encodeURIComponent(value)}`),
            tooltip: 'Go to JSON Pointer',
          })

          // Advance search past the string we just handled
          fromIndex = bounds.right + 1
        }
      }

      return { links }
    },
  })

  monaco.editor.registerLinkOpener({
    open(resource) {
      // Only handle our special JSON pointer link scheme
      if (resource.scheme !== JSON_POINTER_LINK_SCHEME) {
        return false
      }

      // Remove leading slash from resource path, if any
      const encoded = (resource.path || '').replace(/^\//, '')
      const pointer = decodeURIComponent(encoded)
      if (!pointer) {
        return false
      }

      // Invoke the navigate callback, resolve to true on successful navigation
      return Promise.resolve(navigate(pointer)).then(() => true)
    },
  })
}

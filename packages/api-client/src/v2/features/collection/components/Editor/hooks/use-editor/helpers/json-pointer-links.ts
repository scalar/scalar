import * as monaco from 'monaco-editor'

import { parseJsonPointerPath } from './json-pointer-path'

const JSON_POINTER_LINK_SCHEME = 'scalar-json-pointer'

const isUnescapedQuote = (text: string, index: number): boolean => {
  if (text[index] !== '"') {
    return false
  }

  let backslashes = 0
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i--) {
    backslashes++
  }
  return backslashes % 2 === 0
}

const findQuotedStringBounds = (line: string, index: number): { left: number; right: number } | null => {
  // Find the nearest unescaped quotes around `index` on the same line.
  let left = -1
  for (let i = index; i >= 0; i--) {
    if (isUnescapedQuote(line, i)) {
      left = i
      break
    }
  }
  if (left === -1) {
    return null
  }

  let right = -1
  for (let i = Math.max(left + 1, index); i < line.length; i++) {
    if (isUnescapedQuote(line, i)) {
      right = i
      break
    }
  }
  if (right === -1 || right <= left) {
    return null
  }

  return { left, right }
}

let isRegistered = false
let navigateHandler: ((pointer: string) => Promise<void> | void) | null = null

export const ensureJsonPointerLinkSupport = (navigate: (pointer: string) => Promise<void> | void): void => {
  navigateHandler = navigate

  if (isRegistered) {
    return
  }
  isRegistered = true

  monaco.languages.registerLinkProvider('json', {
    provideLinks(textModel) {
      const links: monaco.languages.ILink[] = []

      const lineCount = textModel.getLineCount()
      for (let lineNumber = 1; lineNumber <= lineCount; lineNumber++) {
        const line = textModel.getLineContent(lineNumber)
        let fromIndex = 0

        while (true) {
          const idx = line.indexOf('#/', fromIndex)
          if (idx === -1) {
            break
          }

          const bounds = findQuotedStringBounds(line, idx)
          if (!bounds) {
            fromIndex = idx + 2
            continue
          }

          const value = line.slice(bounds.left + 1, bounds.right)
          if (!parseJsonPointerPath(value)) {
            fromIndex = bounds.right + 1
            continue
          }

          // Range excludes the quotes.
          const range = new monaco.Range(lineNumber, bounds.left + 2, lineNumber, bounds.right + 1)

          links.push({
            range,
            url: monaco.Uri.parse(`${JSON_POINTER_LINK_SCHEME}:${encodeURIComponent(value)}`),
            tooltip: 'Go to JSON Pointer',
          })

          fromIndex = bounds.right + 1
        }
      }

      return { links }
    },
  })

  monaco.editor.registerLinkOpener({
    open(resource) {
      if (resource.scheme !== JSON_POINTER_LINK_SCHEME) {
        return false
      }

      const encoded = (resource.path || '').replace(/^\//, '')
      const pointer = decodeURIComponent(encoded)
      if (!pointer) {
        return false
      }

      const handler = navigateHandler
      if (!handler) {
        return false
      }

      return Promise.resolve(handler(pointer)).then(() => true)
    },
  })
}

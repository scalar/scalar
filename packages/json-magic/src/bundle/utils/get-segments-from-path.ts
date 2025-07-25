import { unescapeJsonPointer } from './unescape-json-pointer'

/**
 * Translate `/paths/~1test` to `['paths', '/test']`
 */
export function getSegmentsFromPath(path: string) {
  return (
    // /paths/~1test
    path
      // ['', 'paths', '~1test']
      .split('/')
      // ['paths', '~test']
      .slice(1)
      // ['paths', '/test']
      .map(unescapeJsonPointer)
  )
}

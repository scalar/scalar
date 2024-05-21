import type { ContentType } from './types'

export function normalizeMimeType(contentType: string) {
  return (
    contentType
      // Remove '; charset=utf-8'
      .replace(/;.*$/, '')
      // Remove 'problem+'
      .replace(/\/.+\+/, '/')
      // Remove whitespace
      .trim() as ContentType
  )
}

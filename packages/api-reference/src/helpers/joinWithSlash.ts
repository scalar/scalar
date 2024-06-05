/**
 * Joins two strings and ensures there's a slash in the middle
 */
export const joinWithSlash = (left: string, right: string) =>
  left.replace(/\/$/, '') + '/' + right.replace(/^\//, '')

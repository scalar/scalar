/**
 * For any URL segments bounded by encoded brackets, turn them into unencoded brackets.
 */
export const getUrlPathnameWithRestoredBrackets = (url: URL): string => {
  if (!url) {
    return '/'
  }
  return getStringPathnameWithRestoredBrackets(url.pathname)
}

/**
 * For any URL segments bounded by encoded brackets, turn them into unencoded brackets.
 */
export const getStringPathnameWithRestoredBrackets = (pathname: string): string => {
  if (!pathname) {
    return '/'
  }
  if (pathname === '/' || pathname === '') {
    return pathname
  }

  // Looking for a forward slash followed by a escaped opening bracket (curly or square)
  const hasBrackets = new RegExp('/%[57]B', 'i').test(pathname)
  if (!hasBrackets) {
    return pathname
  }

  const encodedPathWithBracketsReinstated = pathname
    .split('/')
    .map((segment) => {
      if (/^%5B.*%5D$/i.test(segment)) {
        return '[' + segment.slice(3, -3) + ']'
      }
      if (/^%7B.*%7D$/i.test(segment)) {
        return '{' + segment.slice(3, -3) + '}'
      }
      return segment
    })
    .join('/')
  return encodedPathWithBracketsReinstated
}

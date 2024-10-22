export type ParsedUrl = {
  protocol: string
  hostname: string
  port: string
}

/**
 * Parses a URL string into its component parts.
 */
function parseUrl(urlString: string): any {
  const url = new URL(urlString)
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  }
}

/**
 * Extracts the domain (including protocol and port if present) from a given URL.
 */
export function getDomainFromUrl(url: string): string {
  const { protocol, hostname, port } = parseUrl(url)
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}

/**
 * Extracts the path from a given URL, removing any Postman variables.
 */
export function extractPathFromUrl(url: string | undefined): string {
  if (!url) return '/'

  const parsedUrl = new URL(
    url.replace(/\{\{[^}]+\}\}/g, ''),
    'http://dummy.com',
  )
  return parsedUrl.pathname || '/'
}

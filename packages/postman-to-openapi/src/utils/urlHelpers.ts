/**
 * Calculates the domain URL string from protocol, hosts, and port.
 */
export function calculateDomains(
  protocol: string,
  hosts: string[],
  port: string,
): string {
  return `${protocol}://${hosts.join('.')}${port ? `:${port}` : ''}`
}

/**
 * Calculates the OpenAPI path from an array of path segments.
 */
export function calculatePath(paths: string[], pathDepth: number): string {
  const slicedPaths = paths.slice(pathDepth)
  return `/${slicedPaths
    .map((path) => path.replace(/([{}])\1+/g, '$1').replace(/^:(.*)/g, '{$1}'))
    .join('/')}`
}

/**
 * Scrapes the URL to extract its components.
 */
export function scrapeURL(
  url: string | { raw: string; query?: any[]; variable?: any[] },
) {
  if (!url || url === '' || (typeof url === 'object' && url.raw === '')) {
    return { valid: false }
  }

  const rawUrl = typeof url === 'string' ? url : url.raw
  const fixedUrl = rawUrl.startsWith('{{') ? `http://${rawUrl}` : rawUrl

  try {
    const objUrl = new URL(fixedUrl)
    return {
      raw: rawUrl,
      path: decodeURIComponent(objUrl.pathname).slice(1).split('/'),
      query: compoundQueryParams(objUrl.searchParams, url.query),
      protocol: objUrl.protocol.slice(0, -1),
      host: decodeURIComponent(objUrl.hostname).split('.'),
      port: objUrl.port,
      valid: true,
      pathVars: url.variable
        ? url.variable.reduce(
            (obj, { key, value, description }) => {
              obj[key] = { value, description, type: inferType(value) }
              return obj
            },
            {} as Record<
              string,
              { value: string; description: string; type: string }
            >,
          )
        : {},
    }
  } catch {
    return { valid: false }
  }
}

function compoundQueryParams(
  searchParams: URLSearchParams,
  queryCollection: any[] = [],
): any[] {
  return queryCollection // Keeping as is unless further processing is needed
}

function inferType(value: string): string {
  if (/^\d+$/.test(value)) return 'integer'
  if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) return 'number'
  if (/^(true|false)$/.test(value)) return 'boolean'
  return 'string'
}

import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

const HOST = process.env.HOST || 'localhost'
const PORT = process.env.PORT || 3000

/**
 * URL creation helper to pass a configuration and a local scalar.js URL
 *
 * @example
 * ```ts
 * const url = createExampleWithLocalBundle({ hiddenClients: ['fetch', 'axios'] })
 *
 * await page.goto(url)
 * ```
 */
export function createExample(configuration?: AnyApiReferenceConfiguration) {
  const baseUrl = `http://${HOST}:${PORT}`
  const searchParams = new URLSearchParams()

  // Always use the local scalar.js file
  searchParams.set('SCALAR_CDN_URL', '/scalar.js')

  // Add configuration if provided
  if (configuration) {
    const DEFAULT_CONFIGURATION: AnyApiReferenceConfiguration = {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      proxyUrl: 'https://proxy.scalar.com',
    }

    const mergedConfiguration = {
      ...DEFAULT_CONFIGURATION,
      ...configuration,
    }

    searchParams.set('SCALAR_CONFIGURATION', JSON.stringify(mergedConfiguration))
  }

  const queryString = searchParams.toString()

  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl

  return url
}

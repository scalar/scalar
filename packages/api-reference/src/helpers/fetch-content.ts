import { fetchSpecFromUrl, isValidUrl, prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { SpecConfiguration } from '@scalar/types/api-reference'

/**
 * Get the spec content from the provided configuration:
 *
 * 1. If the URL is provided, fetch the spec from the URL.
 * 2. If the content is a string, return it.
 * 3. If the content is an object, stringify it.
 * 4. If the content is a function, call it and get the content.
 * 5. Otherwise, return an empty string.
 */
export const fetchContent = async (
  { url, content }: SpecConfiguration,
  proxyUrl?: string,
): Promise<string | undefined> => {
  // If the URL is provided, fetch the API definition from the URL
  if (url) {
    const start = performance.now()

    try {
      // TODO: Use the resolved URL, not the given URL for the download link.
      // If the url is not valid, we can assume its a path and
      // if it’s a path we can skip the proxy.
      const result = !isValidUrl(url) ? await fetchSpecFromUrl(url) : await fetchSpecFromUrl(url, proxyUrl)

      const end = performance.now()
      console.log(`fetch: ${Math.round(end - start)} ms (${url})`)
      console.log('size:', Math.round(result.length / 1024), 'kB')

      return result
    } catch (error) {
      console.error(`Failed to fetch content from URL (${url}):`, error)
    }
  }

  // Callback
  const activeContent = typeof content === 'function' ? content() : content

  // Strings are fine
  if (typeof activeContent === 'string') {
    return activeContent
  }

  // Pretty print objects
  if (typeof activeContent === 'object') {
    return prettyPrintJson(activeContent)
  }

  return undefined
}

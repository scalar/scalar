import { normalize, traverse } from '@scalar/openapi-parser'
type UnknownObject = Record<string, unknown>

type ExternalReference = {
  url: string
  status: 'idle' | 'pending' | 'fetched' | 'failed'
  errors: Error[]
  content: Record<string, unknown>
  references: string[]
}

type CreateExternalReferenceFetcherOptions = {
  url: string
  /**
   * Whether to load external references right-away or only when they are accessed.
   *
   * - `eager` is great for SSR/SSG.
   * - `lazy` is great for client-side rendering.
   */
  strategy?: 'eager' | 'lazy'
}

export const createExternalReferenceFetcher = ({ url, strategy = 'eager' }: CreateExternalReferenceFetcherOptions) => {
  let numberOfRequests = 0
  const files = new Map<string, ExternalReference>()

  // Add initial URL to files Map immediately
  files.set(url, {
    content: {},
    status: 'idle',
    references: [],
    url,
    errors: [],
  })

  const fetchUrl = async (url: string) => {
    // Set status to pending before starting the fetch
    const entry = files.get(url)!
    files.set(url, {
      ...entry,
      status: 'pending',
    })

    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()

      const content = normalize(text) as UnknownObject
      const references = findExternalReferences(content)

      files.set(url, {
        content,
        references,
        status: 'fetched',
        url,
        errors: [], // Initialize empty errors array for successful fetches
      })

      numberOfRequests++
      console.log(`✅ #${numberOfRequests} ${url}`)

      // Fetch references in chunks of 5
      const chunks = chunkArray(references, 5)

      for (const chunk of chunks) {
        await Promise.all(chunk.map((reference) => addUrl(reference)))
      }
    } catch (error) {
      // Update the entry with failed status and the error
      files.set(url, {
        ...entry,
        status: 'failed',
        errors: [error instanceof Error ? error : new Error(String(error))],
      })
      console.error(`❌ Failed to fetch ${url}:`, error)
    }
  }

  // Helper function to chunk array into smaller arrays
  const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  // Start fetching immediately
  const startFetching = async () => {
    // Always fetch the initial URL immediately, regardless of strategy
    await fetchUrl(url)

    // If strategy is eager, fetch all references as well
    if (strategy === 'eager') {
      const entry = files.get(url)!
      const chunks = chunkArray(entry.references, 5)
      for (const chunk of chunks) {
        await Promise.all(chunk.map((reference) => addUrl(reference)))
      }
    }
  }

  // Start fetching right away
  startFetching()

  // isReady now just checks if any files are still pending
  const isReady = async () => {
    // Wait until no files are in pending state
    while (true) {
      const hasPendingFiles = Array.from(files.values()).some(
        (file) => file.status === 'pending' || file.status === 'idle',
      )

      if (!hasPendingFiles) {
        break
      }

      // Wait a bit before checking again to avoid tight polling
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  // Get the content of a file
  const addUrl = async (url: string) => {
    if (files.has(url)) {
      const entry = files.get(url)!

      // If the entry is idle and we're accessing it, fetch it now
      if (entry.status === 'idle') {
        await fetchUrl(url)
      }

      return
    }

    // Add to files map immediately with idle status
    files.set(url, {
      content: {},
      status: 'idle',
      references: [],
      url,
      errors: [],
    })

    // If strategy is eager, fetch immediately
    if (strategy === 'eager') {
      await fetchUrl(url)
    }
  }

  const findExternalReferences = (content: UnknownObject) => {
    const references: string[] = []

    traverse(content, (value: any) => {
      if (!value.$ref || typeof value.$ref !== 'string' || value.$ref.startsWith('#')) {
        return value
      }

      const reference = value.$ref.split('#')[0]
      const absoluteUrl = getAbsoluteUrl(url, reference)

      references.push(absoluteUrl)

      return value
    })

    return references
  }

  return { isReady, files }
}

/**
 * Combines the source URL with a relative URL to return an absolute URL.
 *
 * @example
 * getAbsoluteUrl('https://example.com/openapi.yaml', 'components.yaml')
 * // => 'https://example.com/components.yaml'
 *
 * getAbsoluteUrl('/foobar/openapi.yaml', 'components.yaml')
 * // => '/foobar/components.yaml'
 *
 * getAbsoluteUrl('/foobar/openapi.yaml', '/components.yaml')
 * // => '/components.yaml'
 */
export function getAbsoluteUrl(source: string, url: string) {
  // If source is an absolute URL, use URL constructor
  if (source.startsWith('http://') || source.startsWith('https://')) {
    return new URL(url, source).toString()
  }

  // If url starts with '/', treat it as absolute path relative to root
  if (url.startsWith('/')) {
    return url
  }

  // For relative paths, handle path joining manually
  const base = source.substring(0, source.lastIndexOf('/') + 1)

  return `${base}${url}`
}

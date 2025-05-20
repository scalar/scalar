import { normalize, traverse } from '@scalar/openapi-parser'

// Defaults
const DEFAULT_CONCURRENCY_LIMIT = 5
const DEFAULT_STRATEGY = 'eager'
const POLL_INTERVAL = 1

/**
 * Represents the state of an external reference file.
 * Tracks loading status, content, and any errors that occurred during fetching.
 */
type ExternalReference = {
  /** The URL of the external reference */
  url: string
  /** Current loading status of the reference */
  status: 'idle' | 'pending' | 'fetched' | 'failed'
  /** Any errors that occurred during fetching */
  errors: Error[]
  /** The parsed content of the reference */
  content: Record<string, unknown>
  /** URLs of other references found within this file */
  references: string[]
}

/**
 * Options for creating an external reference fetcher.
 */
type CreateExternalReferenceFetcherOptions = {
  /** The initial URL to fetch */
  url: string
  /**
   * Whether to load external references right-away or only when they are accessed.
   *
   * - `eager` is great for SSR/SSG.
   * - `lazy` is great for client-side rendering.
   */
  strategy?: 'eager' | 'lazy'
  /**
   * Maximum number of concurrent requests when fetching references.
   * Defaults to 5 if not specified.
   */
  concurrencyLimit?: number
}

/**
 * Creates a new external reference fetcher with the specified options.
 * Handles fetching and caching of external references with rate limiting.
 */
export const createExternalReferenceFetcher = ({
  url,
  strategy = DEFAULT_STRATEGY,
  concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT,
}: CreateExternalReferenceFetcherOptions) => {
  let numberOfRequests = 0
  const files = new Map<string, ExternalReference>()

  // Initialize with the first URL
  files.set(url, {
    content: {},
    status: 'idle',
    references: [],
    url,
    errors: [],
  })

  /**
   * Updates the status and optional properties of a file in the files map.
   */
  const updateFileStatus = (
    url: string,
    status: ExternalReference['status'],
    updates: Partial<ExternalReference> = {},
  ) => {
    const entry = files.get(url)!
    files.set(url, { ...entry, status, ...updates })
  }

  /**
   * Splits an array into chunks of specified size.
   */
  const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Finds all external references in a parsed OpenAPI document.
   */
  const findExternalReferences = (content: Record<string, unknown>): string[] => {
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

  /**
   * Fetches a URL and updates its state in the files map.
   * Handles errors and recursively fetches references.
   */
  const fetchUrl = async (url: string): Promise<void> => {
    updateFileStatus(url, 'pending')

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      const content = normalize(text) as Record<string, unknown>

      let references: string[] = []

      if (strategy === 'eager') {
        console.log('findExternalReferences', url)
        references = findExternalReferences(content)

        // Fetch references in chunks
        const chunks = chunkArray(references, concurrencyLimit)
        for (const chunk of chunks) {
          await Promise.all(chunk.map((reference) => addUrl(reference)))
        }
      }

      updateFileStatus(url, 'fetched', {
        content,
        references,
        errors: [],
      })

      numberOfRequests++
      console.log(`✅ #${numberOfRequests} ${url}`)
    } catch (error) {
      updateFileStatus(url, 'failed', {
        errors: [error instanceof Error ? error : new Error(String(error))],
      })
      console.error(`❌ Failed to fetch ${url}:`, error)
    }
  }

  /**
   * Adds a new URL to be tracked and optionally fetches it immediately.
   */
  const addUrl = async (url: string): Promise<void> => {
    if (files.has(url)) {
      const entry = files.get(url)!

      if (entry.status === 'idle') {
        await fetchUrl(url)
      }

      return
    }

    files.set(url, {
      content: {},
      status: 'idle',
      references: [],
      url,
      errors: [],
    })

    // if (strategy === 'eager') {
    await fetchUrl(url)
    // }
  }

  /**
   * Starts the initial fetch and handles eager loading if configured.
   */
  const startFetching = async (): Promise<void> => {
    // Always fetch the initial URL immediately, regardless of strategy
    await fetchUrl(url)

    // If strategy is eager, fetch all references as well
    if (strategy === 'eager') {
      const entry = files.get(url)!
      const chunks = chunkArray(entry.references, concurrencyLimit)
      for (const chunk of chunks) {
        await Promise.all(chunk.map((reference) => addUrl(reference)))
      }
    }
  }

  // Start fetching immediately
  startFetching()

  /**
   * Returns a promise that resolves when all pending fetches are complete.
   */
  const isReady = async (): Promise<void> => {
    // TODO: Use @vue/reactivity to track file status changes
    while (true) {
      const hasPendingFiles = Array.from(files.values()).some(
        (file) => file.status === 'pending',
        // idle is fine, we’ll fetch them later
        //  || file.status === 'idle',
      )

      if (!hasPendingFiles) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
    }
  }

  return { isReady, files, addUrl }
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

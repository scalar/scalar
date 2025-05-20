import type { UnknownObject } from '@/types'
import { normalize, traverse } from '@scalar/openapi-parser'
import { type Ref, ref, watchEffect } from 'vue'

// Defaults
const DEFAULT_CONCURRENCY_LIMIT = 5
const DEFAULT_STRATEGY = 'eager'

/**
 * Represents the state of an external reference file.
 * Tracks loading status, content, and any errors that occurred during fetching.
 */
type ExternalReference = {
  /** The URL of the external reference */
  url: string
  /**
   * Current loading status of the reference
   *
   * - `idle`: it is there, but nothing happens yet
   * - `pending`: it is being fetched right now
   * - `fetched`: it was fetched successfully
   * - `failed`: it failed to be fetched
   **/
  status: 'idle' | 'pending' | 'fetched' | 'failed'
  /** Any errors that occurred during fetching */
  errors: Error[]
  /** The content of the reference */
  content: UnknownObject
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
  const references: Ref<Map<string, ExternalReference>> = ref(new Map())

  // Initialize with the first URL
  references.value.set(url, {
    url,
    status: 'pending',
    errors: [],
    content: {},
  })

  /**
   * Updates the status and optional properties of a reference in the references map.
   */
  const updateReference = (url: string, updates: Partial<ExternalReference> = {}) => {
    if (!references.value.has(url)) {
      throw new Error(`Reference ${url} not found`)
    }

    const entry = references.value.get(url)!

    references.value.set(url, { ...entry, ...updates })
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
   * Fetches a URL and updates its state in the references map.
   * Handles errors and recursively fetches references.
   */
  const fetchUrl = async (url: string): Promise<void> => {
    updateReference(url, { status: 'pending' })

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      const content = normalize(text) as Record<string, unknown>

      updateReference(url, {
        content,
        errors: [],
        status: 'fetched',
      })

      numberOfRequests++
      console.log(`✅ fetched #${numberOfRequests}: ${url}`)

      if (strategy === 'eager') {
        const references = findExternalReferences(content)

        // Fetch references in chunks
        const chunks = chunkArray(references, concurrencyLimit)

        for (const chunk of chunks) {
          await Promise.all(chunk.map((reference) => addReference(reference)))
        }
      }
    } catch (error) {
      updateReference(url, {
        status: 'failed',
        errors: [error instanceof Error ? error : new Error(String(error))],
      })

      console.error(`❌ Failed to fetch ${url}:`, error)
    }
  }

  /**
   * Adds a new URL to be tracked and optionally fetches it immediately.
   */
  const addReference = async (url: string): Promise<void> => {
    if (references.value.has(url)) {
      const entry = references.value.get(url)!

      if (entry.status === 'idle') {
        await fetchUrl(url)
      }

      return
    }

    references.value.set(url, {
      url,
      status: 'idle',
      errors: [],
      content: {},
    })

    await fetchUrl(url)
  }

  // Start fetching immediately
  fetchUrl(url)

  /**
   * Resolves when all pending fetches are complete.
   */
  const isReady = async (): Promise<void> => {
    return new Promise((resolve) => {
      watchEffect(() => {
        const hasPendingRequests = Array.from(references.value.values()).some(
          (reference) => reference.status === 'pending',
        )

        if (!hasPendingRequests) {
          resolve()
        }
      })
    })
  }

  /**
   * Alias to access an entry in the references map.
   */
  function getReference(url: string) {
    return references.value.get(url)
  }

  return { isReady, references, addReference, getReference }
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

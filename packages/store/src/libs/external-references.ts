import type { UnknownObject } from '@/types'
import { traverse, upgrade } from '@scalar/openapi-parser'
import { type Ref, ref, watchEffect } from 'vue'

// Defaults
const DEFAULT_CONCURRENCY_LIMIT = 5
const DEFAULT_STRATEGY = 'eager'
const NO_URL_PROVIDED = 'UNKNOWN_URL'

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
  readonly url?: string
  /** Directly pass the content of the OpenAPI document */
  readonly content?: string | UnknownObject
  /**
   * Whether to load external references right-away or only when they are accessed.
   *
   * - `eager` is great for SSR/SSG.
   * - `lazy` is great for client-side rendering.
   */
  readonly strategy?: 'eager' | 'lazy'
  /**
   * Maximum number of concurrent requests when fetching references.
   * Defaults to 5 if not specified.
   */
  readonly concurrencyLimit?: number
}

/**
 * Defines the structure of the external reference fetcher returned by createExternalReferenceFetcher.
 */
type ExternalReferenceFetcher = {
  isReady: () => Promise<void>
  references: Ref<Map<string, ExternalReference>>
  addReference: (url: string) => Promise<void>
  getReference: (url?: string) => ExternalReference | undefined
}

/**
 * Creates a new external reference fetcher with the specified options.
 * Handles fetching and caching of external references with rate limiting.
 */
export const createExternalReferenceFetcher = ({
  url,
  content: providedContent,
  strategy = DEFAULT_STRATEGY,
  concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT,
}: CreateExternalReferenceFetcherOptions): ExternalReferenceFetcher => {
  let numberOfRequests = 0
  const references: Ref<Map<string, ExternalReference>> = ref(new Map())

  /**
   * Updates the status and optional properties of a reference in the references map.
   */
  const updateReference = (referenceUrl: string, updates: Partial<ExternalReference> = {}): void => {
    if (!references.value.has(referenceUrl)) {
      throw new Error(`Reference ${referenceUrl} not found`)
    }

    const entry = references.value.get(referenceUrl)!

    references.value.set(referenceUrl, { ...entry, ...updates })
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
   * Fetches a URL and updates its state in the references map.
   * Handles errors and recursively fetches references.
   */
  const fetchUrl = async (fetchTargetUrl: string): Promise<void> => {
    updateReference(fetchTargetUrl, { status: 'pending' })

    try {
      const response = await fetch(fetchTargetUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const text = await response.text()
      const { specification: fetchedContent } = upgrade(text)

      // Add validation to ensure we got a proper OpenAPI document
      if (!fetchedContent || typeof fetchedContent !== 'object' || Object.keys(fetchedContent).length === 0) {
        throw new Error('Invalid OpenAPI document: Failed to parse the content')
      }

      updateReference(fetchTargetUrl, {
        content: fetchedContent,
        errors: [],
        status: 'fetched',
      })

      numberOfRequests++
      // console.log(`✅ fetched #${numberOfRequests}: ${fetchTargetUrl}`)

      fetchReferences(fetchedContent, fetchTargetUrl)
    } catch (error) {
      updateReference(fetchTargetUrl, {
        status: 'failed',
        errors: [error instanceof Error ? error : new Error(String(error))],
      })

      console.error(`[external-references] [${fetchTargetUrl}]`, error)
    }
  }

  /**
   * Fetches all references in a parsed OpenAPI document.
   */
  const fetchReferences = async (specContent: UnknownObject, origin?: string): Promise<void> => {
    if (strategy === 'eager') {
      const foundReferences = findReferences(specContent, origin)

      // Fetch references in chunks
      const chunks = chunkArray(foundReferences, concurrencyLimit)

      for (const chunk of chunks) {
        await Promise.all(chunk.map((reference) => addReference(reference)))
      }
    }
  }

  /**
   * Adds a new URL to be tracked and optionally fetches it immediately.
   */
  const addReference = async (newUrl: string): Promise<void> => {
    if (references.value.has(newUrl)) {
      const entry = references.value.get(newUrl)!

      if (entry.status === 'idle') {
        await fetchUrl(newUrl)
      }

      return
    }

    references.value.set(newUrl, {
      url: newUrl,
      status: 'idle',
      errors: [],
      content: {},
    })

    await fetchUrl(newUrl)
  }

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
  function getReference(targetUrl?: string): ExternalReference | undefined {
    if (!targetUrl) {
      return references.value.get(NO_URL_PROVIDED)
    }

    return references.value.get(targetUrl)
  }

  // Initialize with the base document
  if (url) {
    references.value.set(url, {
      url,
      status: 'pending',
      errors: [],
      content: {},
    })

    // Start fetching immediately
    fetchUrl(url)
  } else if (providedContent) {
    const { specification: initialContent } = upgrade(providedContent)

    references.value.set(NO_URL_PROVIDED, {
      url: NO_URL_PROVIDED,
      status: 'fetched',
      errors: [],
      content: initialContent,
    })

    fetchReferences(initialContent)
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
export function getAbsoluteUrl(origin: string | undefined, relativeOrAbsoluteUrl: string): string {
  if (!origin) {
    return relativeOrAbsoluteUrl
  }

  // If origin is an absolute URL, use URL constructor
  if (origin.startsWith('http://') || origin.startsWith('https://')) {
    return new URL(relativeOrAbsoluteUrl, origin).toString()
  }

  // If url starts with '/', treat it as absolute path relative to root
  if (relativeOrAbsoluteUrl.startsWith('/')) {
    return relativeOrAbsoluteUrl
  }

  // For relative paths, handle path joining manually
  const base = origin.substring(0, origin.lastIndexOf('/') + 1)

  return `${base}${relativeOrAbsoluteUrl}`
}

/**
 * Finds all external references in a parsed OpenAPI document.
 */
const findReferences = (specContent: UnknownObject, origin?: string): string[] => {
  const foundReferences: string[] = []

  traverse(specContent, (value: unknown) => {
    // Check if value is an object and has a $ref property that is a string
    if (typeof value === 'object' && value !== null && '$ref' in value) {
      const refValue = (value as { $ref: unknown }).$ref
      if (typeof refValue === 'string' && !refValue.startsWith('#')) {
        const reference = refValue.split('#')[0]
        const absoluteUrl = getAbsoluteUrl(origin, reference)
        foundReferences.push(absoluteUrl)
      }
    }
    // traverse expects the value to be returned, potentially modified.
    // Here we don't modify, so return as is.
    return value
  })

  return foundReferences
}

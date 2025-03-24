import type { NavState } from '@/hooks/useNavState'
import { isDefined } from '@scalar/oas-utils/helpers'
import {
  type AnyApiReferenceConfiguration,
  type SpecConfiguration,
  apiReferenceConfigurationSchema,
  isConfigurationWithSources,
} from '@scalar/types/api-reference'
import GithubSlugger from 'github-slugger'

import { type Ref, computed, ref, watch } from 'vue'

/** URL parameter name for the selected API document */
const QUERY_PARAMETER = 'api'

type UseMultipleDocumentsProps = {
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration: Ref<AnyApiReferenceConfiguration | undefined>
  /** The initial index to pre-select a document, if there is no query parameter available */
  initialIndex?: number
} & NavState

const slugger = new GithubSlugger()

/** Process a single spec configuration so that it has a title and a slug */
const addSlugAndTitle = (source: SpecConfiguration, index = 0): SpecConfiguration | undefined => {
  if (!source?.url && !source?.content) {
    return undefined
  }

  // Reset slugger to avoid duplicate handling
  slugger.reset()

  // Case 1: Title exists, generate slug from it
  if (source.title) {
    return {
      ...source,
      slug: source.slug || slugger.slug(source.title),
      title: source.title,
    }
  }

  // Case 2: Slug exists but no title, use slug as title
  if (source.slug) {
    return {
      ...source,
      title: source.slug,
    }
  }

  // Case 3: Neither exists, use index
  return {
    ...source,
    slug: `api-${index + 1}`,
    title: `API #${index + 1}`,
  }
}

export const useMultipleDocuments = ({
  configuration,
  initialIndex,
  isIntersectionEnabled,
  hash,
  hashPrefix,
}: UseMultipleDocumentsProps) => {
  /**
   * All available API definitions that can be selected
   */
  const availableDocuments = computed((): SpecConfiguration[] => {
    if (!configuration.value) {
      return []
    }

    // Map the sources down to an array of specs
    const sources = isConfigurationWithSources(configuration.value)
      ? // This IFFE is needed for the type guard as it doens't persist into the callback scope
        (() => {
          const { sources, ...rest } = configuration.value
          return sources?.map((source) => ({ ...rest, ...source })) ?? []
        })()
      : [configuration.value].flat()

    // Process them
    return sources.map((source, index) => source && addSlugAndTitle(source, index)).filter(isDefined)
  })

  /**
   * Updates the URL with the selected API definition
   * We only want to update the URL if we have more than one document
   */
  const updateUrlParameter = (value: number) => {
    // Skip URL updates during SSR
    if (typeof window === 'undefined') {
      return
    }

    // If there is only one document, don't add the query parameter.
    if (availableDocuments.value.length === 1) {
      return
    }

    const url = new URL(window.location.href)
    const selectedDefinition = availableDocuments.value[value]

    // Use slug if available, then fallback to index
    const parameterValue = selectedDefinition?.slug ?? value.toString()

    // Switch document
    url.searchParams.set(QUERY_PARAMETER, parameterValue)

    // Reset location on the page
    url.hash = ''
    window.history.replaceState({}, '', url.toString())

    // Reset all global state
    hash.value = ''
    hashPrefix.value = ''
    isIntersectionEnabled.value = false

    // Scroll to the top of the page
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }

  /**
   * Determines the initially selected API definition from the URL
   */
  const getInitialSelection = (): number => {
    // During SSR or if window is not available, use initial index or default to 0
    if (typeof window === 'undefined') {
      return typeof initialIndex === 'number' ? initialIndex : 0
    }

    const url = new URL(window.location.href)
    const parameter = url.searchParams.get(QUERY_PARAMETER)

    // If there’s a query parameter, try to find the matching document
    if (parameter) {
      // Try finding by slug first
      const indexBySlug = availableDocuments.value.findIndex((option) => option.slug === parameter)
      if (indexBySlug !== -1) {
        return indexBySlug
      }

      // Try parsing as numeric index if slug lookup fails
      const numericIndex = Number.parseInt(parameter, 10)
      if (!isNaN(numericIndex) && numericIndex >= 0 && numericIndex < availableDocuments.value.length) {
        return numericIndex
      }
    }

    // If no query parameter is set, look for a default source
    const defaultIndex = availableDocuments.value.findIndex((doc) => 'default' in doc && doc.default === true)
    if (defaultIndex !== -1) {
      return defaultIndex
    }

    // Allow the user to hard-code the initial index
    if (typeof initialIndex === 'number') {
      return initialIndex
    }

    // Default to first item if no match found
    return 0
  }

  /**
   * The index of the currently selected API definition
   */
  const selectedDocumentIndex = ref(getInitialSelection())

  /**
   * The currently selected API configuration
   * we also add the source options (slug, title, etc) to the configuration
   */
  const selectedConfiguration = computed(() => {
    // Multiple sources
    if (configuration.value && isConfigurationWithSources(configuration.value)) {
      return apiReferenceConfigurationSchema.parse({
        ...configuration.value,
        ...configuration.value?.sources?.[selectedDocumentIndex.value],
        ...availableDocuments.value[selectedDocumentIndex.value],
      })
    }

    const flattenedConfig = [configuration.value].flat()[selectedDocumentIndex.value] ?? {}
    return apiReferenceConfigurationSchema.parse({
      ...flattenedConfig,
      ...availableDocuments.value[selectedDocumentIndex.value],
    })
  })

  // Update URL when selection changes
  watch(selectedDocumentIndex, updateUrlParameter, { flush: 'sync' })

  return {
    selectedConfiguration,
    availableDocuments,
    selectedDocumentIndex,
    isIntersectionEnabled,
    hash,
    hashPrefix,
  }
}

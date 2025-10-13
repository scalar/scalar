import { isDefined } from '@scalar/oas-utils/helpers'
import {
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfiguration,
  type SourceConfiguration,
  apiReferenceConfigurationWithSourceSchema,
  isConfigurationWithSources,
} from '@scalar/types/api-reference'
import GithubSlugger from 'github-slugger'
import { type ComputedRef, type Ref, computed, ref, watch } from 'vue'
import type { z } from 'zod'

/** URL parameter name for the selected API document */
const QUERY_PARAMETER = 'api'

type UseMultipleDocumentsProps = {
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration: Ref<AnyApiReferenceConfiguration | undefined>
  /** Configuration options to apply over the currently selected configuration */
  configurationOverrides?: Ref<Partial<ApiReferenceConfiguration> | undefined>
  /** The initial index to pre-select a document, if there is no query parameter available */
  initialIndex?: number
  isIntersectionEnabled: Ref<boolean>
  hash: Ref<string>
  hashPrefix: Ref<string>
}

const slugger = new GithubSlugger()

/**
 * Take any configuration and return a flat array of configurations.
 */
export const normalizeConfigurations = (
  configuration: AnyApiReferenceConfiguration | undefined,
): SourceConfiguration[] => {
  if (!configuration) {
    return []
  }

  // Make it an array, even if it's a single configuration
  const configs = Array.isArray(configuration) ? configuration : [configuration]

  // Flatten all configurations and their sources into a single array

  // Process each configuration to extract and normalize sources
  const sources = configs.flatMap((config) => {
    // Check if this config has a 'sources' array property
    if (isConfigurationWithSources(config)) {
      // Destructure to separate sources array from other config properties
      const { sources: configSources, ...rest } = config

      // For each source in the array:
      // - Merge the source with the parent config properties
      // - Handle undefined sources by returning empty array via ?? []
      return configSources?.map((source) => ({ ...rest, ...source })) ?? []
    }

    // If config doesn't have sources array, treat the config itself as a source
    return [config]
  })

  // Process them
  return sources.map((source, index) => source && addSlugAndTitle(source, index)).filter(isDefined)
}

/** Process a single spec configuration so that it has a title and a slug */
const addSlugAndTitle = (_source: SourceConfiguration, index = 0): SourceConfiguration | undefined => {
  const source = {
    ..._source,
    // this is before parsing so we transform the old style
    ...(_source.spec ?? {}),
  }

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

/**
 * DEPRECATED: This is a temporary state solution while we migrate to the new workspace store
 *
 * @deprecated
 */
export const useMultipleDocuments = ({
  configuration,
  configurationOverrides,
  initialIndex,
  isIntersectionEnabled,
  hash,
  hashPrefix,
}: UseMultipleDocumentsProps): {
  selectedConfiguration: ComputedRef<z.infer<typeof apiReferenceConfigurationWithSourceSchema>>
  availableDocuments: Ref<SourceConfiguration[]>
  selectedDocumentIndex: Ref<number>
  isIntersectionEnabled: Ref<boolean>
  hash: Ref<string>
  hashPrefix: Ref<string>
} => {
  /**
   * All available documents that can be selected
   */
  const availableDocuments = computed((): SourceConfiguration[] => normalizeConfigurations(configuration.value))

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

    // If there's a query parameter, try to find the matching document
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
  const selectedConfiguration = computed((): z.infer<typeof apiReferenceConfigurationWithSourceSchema> => {
    const overrides = configurationOverrides?.value ?? {}
    // Multiple sources
    if (configuration.value && isConfigurationWithSources(configuration.value)) {
      return apiReferenceConfigurationWithSourceSchema.parse({
        ...configuration.value,
        ...configuration.value?.sources?.[selectedDocumentIndex.value],
        ...availableDocuments.value[selectedDocumentIndex.value],
        ...overrides,
      })
    }

    const flattenedConfig = [configuration.value].flat()[selectedDocumentIndex.value] ?? {}
    return apiReferenceConfigurationWithSourceSchema.parse({
      ...flattenedConfig,
      ...availableDocuments.value[selectedDocumentIndex.value],
      ...overrides,
    })
  })

  // Update URL when selection changes, also clear global state
  watch(
    selectedDocumentIndex,
    (value: number) => {
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

      // Clear path if pathRouting is enabled
      if (selectedConfiguration.value.pathRouting) {
        url.pathname = selectedConfiguration.value.pathRouting?.basePath ?? ''
      }

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

      // Fire the onDocumentSelect event
      if (typeof selectedConfiguration.value.onDocumentSelect === 'function') {
        selectedConfiguration.value.onDocumentSelect?.()
      }
    },
    { flush: 'sync' },
  )

  return {
    selectedConfiguration,
    availableDocuments,
    selectedDocumentIndex,
    isIntersectionEnabled,
    hash,
    hashPrefix,
  }
}

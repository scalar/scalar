import { isDefined } from '@scalar/oas-utils/helpers'
import {
  apiReferenceConfigurationSchema,
  isConfigurationWithSources,
  type ApiReferenceConfiguration,
  type ApiReferenceConfigurationWithSources,
  type SpecConfiguration,
} from '@scalar/types/api-reference'
import GithubSlugger from 'github-slugger'

import { computed, ref, watch, type Ref } from 'vue'

/** URL parameter name for the selected API document */
const QUERY_PARAMETER = 'api'

type UseMultipleDocumentsProps = {
  /**
   * Configuration for the API reference.
   * Can be a single configuration or an array of configurations for multiple documents.
   */
  configuration: Ref<
    | Partial<ApiReferenceConfiguration>
    | Partial<ApiReferenceConfiguration>[]
    | Partial<ApiReferenceConfigurationWithSources>
    | undefined
  >
  /** The initial index to pre-select a document, if there is no query parameter available */
  initialIndex?: number
}

const slugger = new GithubSlugger()

/** Process a single spec configuration so that it has a title and a slug */
const addSlugAndTitle = (spec: SpecConfiguration, index = 0): SpecConfiguration | undefined => {
  if (!spec?.url && !spec?.content) {
    return undefined
  }

  // Reset slugger to avoid duplicate handling
  slugger.reset()

  // Case 1: Title exists, generate slug from it
  if (spec.title) {
    return {
      ...spec,
      slug: spec.slug || slugger.slug(spec.title),
      title: spec.title,
    }
  }

  // Case 2: Slug exists but no title, use slug as title
  if (spec.slug) {
    return {
      ...spec,
      title: spec.slug,
    }
  }

  // Case 3: Neither exists, use index
  return {
    ...spec,
    slug: `api-${index + 1}`,
    title: `API #${index + 1}`,
  }
}

export const useMultipleDocuments = ({ configuration, initialIndex }: UseMultipleDocumentsProps) => {
  /**
   * All available API definitions that can be selected
   */
  const availableDocuments = computed((): SpecConfiguration[] => {
    if (!configuration.value) {
      return []
    }

    // Map the sources down to an array of specs
    const sources = isConfigurationWithSources(configuration.value)
      ? (configuration.value.spec?.sources ?? [])
      : [configuration.value].flat().map((config) => config.spec)

    // Process them
    return sources.map((source, index) => source && addSlugAndTitle(source, index)).filter(isDefined)
  })

  /**
   * Updates the URL with the selected API definition
   */
  const updateUrlParameter = (value: number) => {
    const url = new URL(window.location.href)
    const selectedDefinition = availableDocuments.value[value]

    // Use slug if available, then fallback to index
    const parameterValue = selectedDefinition?.slug ?? value.toString()

    // Switch document
    url.searchParams.set(QUERY_PARAMETER, parameterValue)

    // Reset location on the page
    url.hash = ''

    window.history.replaceState({}, '', url.toString())
  }

  /**
   * Determines the initially selected API definition from the URL
   */
  const getInitialSelection = (): number => {
    const url = new URL(window.location.href)
    const parameter = url.searchParams.get(QUERY_PARAMETER) || '0'

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

    // Allow the user to hard-code the initial index
    if (typeof initialIndex === 'number') return initialIndex

    // Default to first item if no match found
    return 0
  }

  /**
   * The index of the currently selected API definition
   */
  const selectedDocumentIndex = ref(getInitialSelection())

  /**
   * The currently selected API configuration
   */
  const selectedConfiguration = computed(() => {
    // Multiple sources
    if (configuration.value && isConfigurationWithSources(configuration.value)) {
      return apiReferenceConfigurationSchema.parse({
        ...configuration.value,
        spec: configuration.value.spec?.sources[selectedDocumentIndex.value],
      })
    }

    return apiReferenceConfigurationSchema.parse([configuration.value].flat()[selectedDocumentIndex.value] ?? {})
  })

  // Update URL when selection changes
  watch(selectedDocumentIndex, updateUrlParameter, { flush: 'sync', immediate: true })

  return {
    selectedConfiguration,
    availableDocuments,
    selectedDocumentIndex,
  }
}

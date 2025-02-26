import type { ReferenceConfiguration, ReferenceConfigurationWithSources } from '@/types'
import { isDefined } from '@scalar/oas-utils/helpers'
import GithubSlugger from 'github-slugger'
import { computed, ref, watch } from 'vue'

/** URL parameter name for the selected API document */
const QUERY_PARAMETER = 'api'

interface UseMultipleDocumentsProps {
  configuration: Ref<ReferenceConfiguration | ReferenceConfiguration[] | ReferenceConfigurationWithSources | undefined>
}

const slugger = new GithubSlugger()

const processSpec = (spec: any, index: number) => {
  if (!spec) return undefined

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

export const useMultipleDocuments = ({ configuration }: UseMultipleDocumentsProps) => {
  /**
   * All available API definitions that can be selected
   */
  const availableDocuments = computed(() => {
    // Multiple configurations
    if (Array.isArray(configuration.value)) {
      return configuration.value
        .map((config, index) => config.spec && processSpec(config.spec, index))
        .filter(isDefined)
    }

    // Multiple sources
    if (
      configuration.value?.spec &&
      'sources' in configuration.value.spec &&
      Array.isArray(configuration.value.spec.sources)
    ) {
      return configuration.value.spec.sources
        .map((source, index) => source && processSpec(source, index))
        .filter(isDefined)
    }

    return configuration.value?.spec ? [processSpec(configuration.value.spec, 0)] : []
  })

  /**
   * Updates the URL with the selected API definition
   */
  const updateUrlParameter = (value: number) => {
    const url = new URL(window.location.href)
    const selectedDefinition = availableDocuments.value[value]

    // Use slug if available, then name, then fallback to index
    const parameterValue = selectedDefinition?.slug ?? selectedDefinition?.name ?? value.toString()

    url.searchParams.set(QUERY_PARAMETER, parameterValue)
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

    // Try finding by name if slug lookup fails
    const indexByName = availableDocuments.value.findIndex((option) => option.name === parameter)
    if (indexByName !== -1) {
      return indexByName
    }

    // Try parsing as numeric index if name lookup fails
    const numericIndex = Number.parseInt(parameter, 10)
    if (!isNaN(numericIndex) && numericIndex >= 0 && numericIndex < availableDocuments.value.length) {
      return numericIndex
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
   */
  const selectedConfiguration = computed((): ReferenceConfiguration => {
    // Multiple configurations
    if (Array.isArray(configuration.value)) {
      return configuration.value[selectedDocumentIndex.value]
    }

    // Multiple sources
    if (
      configuration.value?.spec &&
      'sources' in configuration.value.spec &&
      Array.isArray(configuration.value.spec.sources)
    ) {
      return {
        ...configuration.value,
        spec: configuration.value.spec.sources[selectedDocumentIndex.value],
      }
    }

    return configuration.value as ReferenceConfiguration
  })

  // Update URL when selection changes
  watch(selectedDocumentIndex, updateUrlParameter, { flush: 'sync', immediate: true })

  return {
    selectedConfiguration,
    availableDocuments,
    selectedDocumentIndex,
  }
}

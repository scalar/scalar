import type { ReferenceConfiguration } from '@/types'
import { isDefined } from '@scalar/oas-utils/helpers'
import { type Ref, computed, ref, watch } from 'vue'

/** URL parameter name for the selected API document */
const QUERY_PARAMETER = 'api'

interface UseMultipleDocumentsProps {
  configuration: Ref<ReferenceConfiguration | ReferenceConfiguration[] | undefined>
}

export const useMultipleDocuments = ({ configuration }: UseMultipleDocumentsProps) => {
  /**
   * All available API definitions that can be selected
   */
  const availableDocuments = computed(() => {
    if (Array.isArray(configuration.value)) {
      return configuration.value.map((config) => config.spec).filter(isDefined)
    }

    return configuration.value?.spec ? [configuration.value.spec] : []
  })

  /**
   * Updates the URL with the selected API definition
   */
  const updateUrlParameter = (value: number) => {
    const url = new URL(window.location.href)
    const selectedDefinition = availableDocuments.value[value]
    const parameterValue = selectedDefinition?.name ?? value.toString()

    url.searchParams.set(QUERY_PARAMETER, parameterValue)
    window.history.replaceState({}, '', url.toString())
  }

  /**
   * Determines the initially selected API definition from the URL
   */
  const getInitialSelection = (): number => {
    const url = new URL(window.location.href)
    const parameter = url.searchParams.get(QUERY_PARAMETER) || '0'

    // Try parsing as numeric index first
    const numericIndex = Number.parseInt(parameter, 10)
    if (!isNaN(numericIndex) && availableDocuments.value[numericIndex]) {
      return numericIndex
    }

    // Try finding by name if numeric index fails
    const indexByName = availableDocuments.value.findIndex((option) => option.name === parameter)
    if (indexByName !== -1) {
      return indexByName
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
  const selectedConfiguration = computed(() => {
    if (Array.isArray(configuration.value)) {
      return configuration.value[selectedDocumentIndex.value]
    }
    return configuration.value
  })

  // Update URL when selection changes
  watch(selectedDocumentIndex, updateUrlParameter, { immediate: true })

  return {
    selectedConfiguration,
    availableDocuments,
    selectedDocumentIndex,
  }
}

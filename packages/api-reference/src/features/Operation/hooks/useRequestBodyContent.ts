import type { Operation } from '@scalar/oas-utils/entities/spec'
import { type ComputedRef, computed, ref, unref } from 'vue'

/**
 * Composable for handling request body content types in OpenAPI operations
 */
export function useRequestBodyContent(operation: Operation | ComputedRef<Operation | undefined> | undefined) {
  // Track the currently selected content type
  const selectedContentType = ref<string>('')

  /**
   * Get all available content types from the operation's requestBody
   * Preserves the order from the OpenAPI document
   */
  const availableContentTypes = computed(() => {
    const unwrappedOperation = unref(operation)
    if (!unwrappedOperation?.requestBody?.content) {
      return []
    }
    return Object.keys(unwrappedOperation.requestBody.content)
  })

  /**
   * Get the default content type - uses the first content type from the document
   */
  const defaultContentType = computed(() => {
    const unwrappedOperation = unref(operation)
    if (!unwrappedOperation?.requestBody?.content || availableContentTypes.value.length === 0) {
      return ''
    }

    return availableContentTypes.value[0]
  })

  /**
   * Set the selected content type, with validation
   */
  const setContentType = (contentType: string) => {
    if (availableContentTypes.value.includes(contentType)) {
      selectedContentType.value = contentType
    } else {
      // Fallback to default if invalid type provided
      selectedContentType.value = defaultContentType.value
    }
  }

  // Initialize with default content type
  selectedContentType.value = defaultContentType.value

  return {
    selectedContentType,
    availableContentTypes,
    defaultContentType,
    setContentType,
  }
}

import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'
import { computed } from 'vue'

/**
 * Check if a RequestExampleParameter has any of the following properties:
 * - description
 * - type
 * - default
 * - format
 * - minimum
 * - maximum
 */
export const hasItemProperties = (item: RequestExampleParameter) =>
  Boolean(item.description || item.type || item.default || item.format || item.minimum || item.maximum)

/**
 * Checks if the value of a RequestExampleParameter is the expected type or format
 * Returns an alert message if the value is not in the correct type or format, otherwise false
 */
export const parameterIsInvalid = (item: RequestExampleParameter) => {
  return computed(() => {
    if (item.value === undefined || item.value === '') {
      return false
    }

    // Type validation
    if (item.type) {
      if (item.type === 'integer') {
        const value = Number(item.value)
        if (isNaN(value) || !Number.isInteger(value)) {
          return 'Value must be a whole number (e.g., 42)'
        }
        if (item.minimum !== undefined && value < item.minimum) {
          return `Value must be ${item.minimum} or greater`
        }
        if (item.maximum !== undefined && value > item.maximum) {
          return `Value must be ${item.maximum} or less`
        }
      }

      if (item.type === 'number') {
        const value = Number(item.value)
        if (isNaN(value)) {
          return 'Value must be a number (e.g., 42.5)'
        }
        if (item.minimum !== undefined && value < item.minimum) {
          return `Value must be ${item.minimum} or greater`
        }
        if (item.maximum !== undefined && value > item.maximum) {
          return `Value must be ${item.maximum} or less`
        }
      }

      if (item.type === 'string' && item.format) {
        if (item.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(item.value)) {
          return 'Please enter a valid date in YYYY-MM-DD format (e.g., 2024-03-20)'
        }
        if (
          item.format === 'date-time' &&
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(item.value)
        ) {
          return 'Please enter a valid date and time in RFC 3339 format (e.g., 2024-03-20T13:45:30Z)'
        }
        if (item.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.value)) {
          return 'Please enter a valid email address (e.g., user@example.com)'
        }
        if (item.format === 'uri' && !/^[a-zA-Z][a-zA-Z0-9+.-]*:.+$/.test(item.value)) {
          return 'Please enter a valid URI (e.g., https://example.com)'
        }
      }
    }

    return false
  })
}

/**
 * Checks if a RequestExampleParameter is required and has an empty value
 */
export const hasEmptyRequiredParameter = (item: RequestExampleParameter) => Boolean(item.required && item.value === '')

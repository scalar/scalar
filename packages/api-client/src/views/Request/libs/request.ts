import type { RequestExampleParameter } from '@scalar/oas-utils/entities/spec'

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
  Boolean(
    item.description ||
      item.type ||
      item.default ||
      item.format ||
      item.minimum ||
      item.maximum,
  )

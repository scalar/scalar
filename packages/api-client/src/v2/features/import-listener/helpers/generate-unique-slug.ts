import { generateUniqueValue } from '@scalar/workspace-store/helpers/generate-unique-value'

import { slugify } from '@/v2/helpers/slugify'

/**
 * Generates a unique slug for an imported document based on its title.
 *
 * This ensures the imported document does not conflict with existing documents
 * by appending a number suffix if necessary (e.g., "my-api", "my-api-1", "my-api-2").
 *
 * The function will retry up to 100 times to find a unique slug. If all attempts fail,
 * it returns null, which should be handled as an import error.
 *
 * @param defaultValue - The original document title to base the slug on
 * @param currentDocuments - Set of existing document slugs to check against
 *
 * @returns Promise resolving to a unique slug, or null if unable to generate one
 */
export const generateUniqueSlug = async (defaultValue: string | undefined, currentDocuments: Set<string>) => {
  return await generateUniqueValue({
    defaultValue: defaultValue ?? 'default',
    validation: (value) => !currentDocuments.has(value),
    maxRetries: 100,
    transformation: slugify,
  })
}

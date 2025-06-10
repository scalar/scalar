import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/**
 * Gets or creates a tag in the tags dictionary.
 * If the tag doesn't exist, it creates a new tag object with the given name.
 *
 * @param tagsDict - Map of tag names to tag objects
 * @param name - Name of the tag to get or create
 * @returns The tag object for the given name
 */
export const getTag = (tagsDict: Map<string, OpenAPIV3_1.TagObject>, name: string) => {
  if (!tagsDict.get(name)) {
    tagsDict.set(name, { name })
  }

  return tagsDict.get(name)! // We can safely assert non-null since we just set the value if it didn't exist
}

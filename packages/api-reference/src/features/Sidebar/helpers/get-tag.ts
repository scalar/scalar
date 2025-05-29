import type { OpenAPIV3_1 } from '@scalar/openapi-types'

/** Grabs the tag from the dict or creates one if it doesn't exist */
export const getTag = (tagsDict: Map<string, OpenAPIV3_1.TagObject>, name: string) => {
  // Ensure the tag exists in the spec
  let tag = tagsDict.get(name)

  // If not we add it
  if (!tag) {
    tag = { name }
    tagsDict.set(name, tag)
  }

  return tag
}

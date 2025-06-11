import type { TagsMap } from '@/navigation/types'

type TagMapValue = NonNullable<TagsMap extends Map<string, infer V> ? V : never>

/**
 * Gets or creates a tag in the tags dictionary.
 * If the tag doesn't exist, it creates a new tag object with the given name.
 *
 * @param tagsDict - Map of tag names to tag objects
 * @param name - Name of the tag to get or create
 * @returns The tag object for the given name
 */
export const getTag = (tagsMap: TagsMap, name: string): TagMapValue => {
  if (!tagsMap.get(name)) {
    tagsMap.set(name, { entries: [], tag: { name } })
  }

  return tagsMap.get(name)! // We can safely assert non-null since we just set the value if it didn't exist
}

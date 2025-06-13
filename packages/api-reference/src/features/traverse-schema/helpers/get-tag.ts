import type { TagsMap } from '@/features/traverse-schema/types'

type TagMapValue = NonNullable<TagsMap extends Map<string, infer V> ? V : never>

/** Grabs the tag from the dict or creates one if it doesn't exist */
export const getTag = (tagsMap: TagsMap, name: string): TagMapValue => {
  // Ensure the tag exists in the spec
  let tag = tagsMap.get(name)

  // If not we add it
  if (!tag) {
    tag = { entries: [], tag: { name } }
    tagsMap.set(name, tag)
  }

  return tag
}

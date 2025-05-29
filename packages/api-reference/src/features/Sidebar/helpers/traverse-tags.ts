import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { TagGroup } from '@scalar/types/legacy'

type Options = Pick<UseNavState, 'getTagId'> & Pick<ApiReferenceConfiguration, 'tagsSorter' | 'operationsSorter'>

/** Handles creating entries for tags */
const createTagEntry = (
  tag: OpenAPIV3_1.TagObject,
  getTagId: UseNavState['getTagId'],
  children: SidebarEntry[],
): SidebarEntry => ({
  id: getTagId(tag),
  title: tag['x-displayName'] || tag.name || 'Untitled Tag',
  children,
})

/** Grabs the tag from the dict or creates one if it doesn't exist */
const getTag = (tagsDict: Record<string, OpenAPIV3_1.TagObject>, key: string) => tagsDict[key] ?? { name: key }

/** Sorts tags and returns entries */
const getSortedTagEntries = (
  keys: string[],
  tagsMap: Map<string, SidebarEntry[]>,
  tagsDict: Record<string, OpenAPIV3_1.TagObject>,
  { getTagId, tagsSorter, operationsSorter }: Options,
) => {
  // Alpha sort
  if (tagsSorter === 'alpha') {
    keys.sort((a, b) => {
      const nameA = getTag(tagsDict, a)['x-displayName'] || a || 'Untitle Tag'
      const nameB = getTag(tagsDict, b)['x-displayName'] || b || 'Untitled Tag'
      return nameA.localeCompare(nameB)
    })
  }
  // Custom sort
  else if (typeof tagsSorter === 'function') {
    keys.sort((a, b) => tagsSorter(getTag(tagsDict, a), getTag(tagsDict, b)))
  }

  // Loop on tags and add to array if entries
  return keys.flatMap((key) => {
    const tag = getTag(tagsDict, key)
    const entries = tagsMap.get(key) ?? []

    // Skip if the tag is internal or scalar-ignore
    if (tag['x-internal'] || tag['x-scalar-ignore']) {
      return []
    }

    // Alpha sort
    if (operationsSorter === 'alpha') {
      entries.sort((a, b) => a.title.localeCompare(b.title))
    }
    // Method sort
    else if (operationsSorter === 'method') {
      entries.sort((a, b) => a.httpVerb?.localeCompare(b.httpVerb ?? '') ?? 0)
    }
    // Custom sort
    else if (typeof operationsSorter === 'function') {
      entries.sort(operationsSorter)
    }

    return entries.length ? createTagEntry(tag, getTagId, entries) : []
  })
}

/** Traverses our tags map creates entries, also handles sorting and tagGroups */
export const traverseTags = (
  content: OpenAPIV3_1.Document,
  tagsMap: Map<string, SidebarEntry[]>,
  tagsDict: Record<string, OpenAPIV3_1.TagObject>,
  { getTagId, tagsSorter, operationsSorter }: Options,
): SidebarEntry[] => {
  // x-tagGroups
  if (content['x-tagGroups']) {
    const tagGroups = content['x-tagGroups'] as TagGroup[]

    return tagGroups.flatMap((tagGroup) => {
      const entries = getSortedTagEntries(tagGroup.tags ?? [], tagsMap, tagsDict, {
        getTagId,
        tagsSorter,
        operationsSorter,
      })
      return entries.length ? createTagEntry(tagGroup, getTagId, entries) : []
    })
  }

  // Ungrouped regular tags
  const keys = Object.keys(tagsMap)
  const tags = getSortedTagEntries(keys, tagsMap, tagsDict, { getTagId, tagsSorter, operationsSorter })

  // Flatten if we only have default tag
  if (tags.length === 1 && tags[0].title === 'default') {
    return tags[0].children ?? []
  }
  return tags
}

import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { TagGroup } from '@scalar/types/legacy'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import type { SidebarEntry } from '@/features/Sidebar/types'
import type { UseNavState } from '@/hooks/useNavState'
import { getTag } from './get-tag'

type Options = Pick<UseNavState, 'getTagId'> & Pick<ApiReferenceConfiguration, 'tagsSorter' | 'operationsSorter'>

/** Handles creating entries for tags */
const createTagEntry = (
  tag: OpenAPIV3_1.TagObject,
  titlesMap: Map<string, string>,
  getTagId: UseNavState['getTagId'],
  children: SidebarEntry[],
  isGroup = false,
): SidebarEntry => {
  const id = getTagId(tag)
  const title = tag['x-displayName'] || tag.name || 'Untitled Tag'
  titlesMap.set(id, title)

  return {
    id,
    title,
    tag,
    children,
    isGroup,
  }
}

/** Sorts tags and returns entries */
const getSortedTagEntries = (
  _keys: string[],
  /** Map of tags and their entries */
  tagsMap: Map<string, SidebarEntry[]>,
  /** Dictionary of tags from the spec */
  tagsDict: Map<string, OpenAPIV3_1.TagObject>,
  /** Map of titles for the mobile header */
  titlesMap: Map<string, string>,
  { getTagId, tagsSorter, operationsSorter }: Options,
) => {
  // Ensure that default is last if it exists
  const hasDefault = _keys.includes('default')
  const keys = hasDefault ? _keys.filter((key) => key !== 'default') : _keys

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

  if (hasDefault) {
    keys.push('default')
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
      entries.sort((a, b) =>
        operationsSorter(
          { summary: a.title, method: a.httpVerb ?? '', path: a.path ?? '', operationId: a.operationId },
          { summary: b.title, method: b.httpVerb ?? '', path: b.path ?? '', operationId: b.operationId },
        ),
      )
    }

    return entries.length ? createTagEntry(tag, titlesMap, getTagId, entries) : []
  })
}

/** Traverses our tags map creates entries, also handles sorting and tagGroups */
export const traverseTags = (
  content: OpenAPIV3_1.Document,
  /** Map of tags and their entries */
  tagsMap: Map<string, SidebarEntry[]>,
  /** Dictionary of tags from the spec */
  tagsDict: Map<string, OpenAPIV3_1.TagObject>,
  /** Map of titles for the mobile title */
  titlesMap: Map<string, string>,
  { getTagId, tagsSorter, operationsSorter }: Options,
): SidebarEntry[] => {
  // x-tagGroups
  if (content['x-tagGroups']) {
    const tagGroups = content['x-tagGroups'] as TagGroup[]

    return tagGroups.flatMap((tagGroup) => {
      const entries = getSortedTagEntries(tagGroup.tags ?? [], tagsMap, tagsDict, titlesMap, {
        getTagId,
        tagsSorter,
        operationsSorter,
      })
      return entries.length ? createTagEntry(tagGroup, titlesMap, getTagId, entries, true) : []
    })
  }

  // Ungrouped regular tags
  const keys = Array.from(tagsMap.keys())
  const tags = getSortedTagEntries(keys, tagsMap, tagsDict, titlesMap, { getTagId, tagsSorter, operationsSorter })

  // Flatten if we only have default tag
  if (tags.length === 1 && tags[0].title === 'default') {
    return tags[0].children ?? []
  }
  return tags
}

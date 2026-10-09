import { getTagKind } from '@/helpers/get-tag-kind'
import type { TagsMap } from '@/navigation/types'
import type { OpenApiDocument } from '@/schemas/v3.2/strict/openapi-document'

/** Label tags must not create operation groups, but undeclared tags still do. */
export const getNavigationTagNames = (
  document: OpenApiDocument,
  names: string[] | undefined,
  tagsMap: TagsMap,
): string[] => names?.filter((name) => getTagKind(document, tagsMap.get(name)?.tag) === 'nav') ?? []

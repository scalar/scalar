import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import { getAsyncApiEntryTags, getAsyncApiTags } from '@/components/Content/AsyncApi/helpers/get-async-api-tags'

/** Only index rendered entries so hidden operations and messages cannot leak their tags. */
export const getAsyncApiTagOptions = (
  document: AsyncApiDocument,
  entries: TraversedEntry[],
): { id: string; label: string }[] => {
  // Application tags describe the API, not the content readers can narrow down.
  const names = new Set<string>()
  for (const server of Object.values(document.servers ?? {})) {
    for (const tag of getAsyncApiTags(getResolvedRef(server)?.tags)) {
      names.add(tag.name)
    }
  }
  const visit = (entry: TraversedEntry): void => {
    for (const tag of getAsyncApiTags(getAsyncApiEntryTags(entry, document))) {
      names.add(tag.name)
    }
    if ('children' in entry) {
      entry.children?.forEach(visit)
    }
  }
  entries.forEach(visit)
  return [
    { id: '', label: 'All tags' },
    ...Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ id: name, label: name })),
  ]
}

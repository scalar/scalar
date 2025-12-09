import { createSidebarState } from '@scalar/sidebar'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

export const useSidebarState = (document: MaybeRefOrGetter<WorkspaceDocument | undefined>) => {
  const entries = computed(() => {
    const doc = toValue(document)
    return doc?.['x-scalar-navigation']?.children ?? []
  })

  const state = createSidebarState(entries)

  state.setExpanded(entries.value[0]?.id ?? '', true)

  return {
    state,
  }
}

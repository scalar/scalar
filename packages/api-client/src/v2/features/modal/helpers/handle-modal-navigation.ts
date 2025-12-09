import { type SidebarState, getChildEntry } from '@scalar/sidebar'
import { getParentEntry } from '@scalar/workspace-store/navigation'
import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

import type { RoutePayload } from '@/v2/features/modal/helpers/create-api-client-modal'

export const handleModalNavigation = ({
  id,
  route,
  sidebarState,
}: {
  id: string
  route: (payload: RoutePayload) => void
  sidebarState: SidebarState<TraversedEntry>
}) => {
  const toggleExpansion = (id: string) => {
    sidebarState.setExpanded(id, !sidebarState.isExpanded(id))
  }

  const entry = sidebarState.getEntryById(id)

  if (!entry) {
    console.warn(`Could not find sidebar entry with id ${id} to navigate to`)
    return
  }

  // For example and operation, navigate to the example page, operation page
  if (entry.type === 'operation' || entry.type === 'example') {
    // If we are already in the operation, just toggle expansion
    if (sidebarState.isSelected(id)) {
      toggleExpansion(id)
      return
    }

    const operation = getParentEntry('operation', entry)
    const example = getChildEntry('example', entry)

    sidebarState.setSelected(entry.id)

    route({
      path: operation?.path ?? '',
      method: operation?.method ?? 'get',
      example: example?.name ?? 'default',
    })
  }

  toggleExpansion(id)
}

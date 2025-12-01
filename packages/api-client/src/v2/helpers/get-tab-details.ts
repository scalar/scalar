import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { GetEntryByLocation } from '@/v2/hooks/use-sidebar-state'

export const getTabDetails = ({
  workspace,
  document,
  path,
  method,
  getEntryByLocation,
}: {
  workspace?: string
  document?: string
  path?: string
  method?: HttpMethod
  getEntryByLocation: GetEntryByLocation
}): { title: string; icon?: string } => {
  if (!workspace) {
    return {
      title: 'Untitled Tab',
    }
  }

  if (document && path && method) {
    const entry = getEntryByLocation({
      document,
      path,
      method,
    })

    if (!entry) {
      return {
        title: 'Untitled Tab',
      }
    }

    if (entry.type === 'document') {
      return {
        title: entry.title,
        icon: 'interface-content-folder',
      }
    }

    return {
      title: entry.title,
      // TODO: add the icon for request/example entries
    }
  }

  return {
    title: 'Workspace',
  }
}

import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import type { Tab } from '@scalar/workspace-store/schemas/extensions/workspace/x-sclar-tabs'

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
}): { title: string; icon?: Tab['icon'] } => {
  if (!workspace) {
    return {
      title: 'Untitled Tab',
    }
  }

  if (document) {
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
        icon: 'document',
      }
    }

    return {
      title: entry.title,
      icon: 'request',
    }
  }

  return {
    title: 'Workspace',
  }
}

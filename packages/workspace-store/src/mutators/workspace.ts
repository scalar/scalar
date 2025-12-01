import type { WorkspaceEvents } from '@/events/definitions/workspace'
import type { Workspace } from '@/schemas'

export const updateActiveProxy = (
  workspace: Workspace | null,
  payload: WorkspaceEvents['workspace:update:active-proxy'],
) => {
  if (!workspace) {
    return
  }
  workspace['x-scalar-active-proxy'] = payload ?? undefined
}

export const updateColorMode = (
  workspace: Workspace | null,
  payload: WorkspaceEvents['workspace:update:color-mode'],
) => {
  if (!workspace) {
    return
  }
  workspace['x-scalar-color-mode'] = payload
}

export const updateTheme = (workspace: Workspace | null, payload: WorkspaceEvents['workspace:update:theme']) => {
  if (!workspace) {
    return
  }
  workspace['x-scalar-theme'] = payload
}

export const updateTabs = (workspace: Workspace | null, payload: WorkspaceEvents['workspace:update:tabs']) => {
  if (!workspace) {
    return
  }
  workspace['x-scalar-tabs'] = payload['x-scalar-tabs']
  workspace['x-scalar-active-tab'] = payload['x-scalar-active-tab']
}

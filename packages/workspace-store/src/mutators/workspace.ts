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

/**
 * Updates the selected http client on the workspace
 *
 * @param workspace - The workspace to update the selected http client in
 * @param payload - The payload to update the selected client with
 * @returns
 */
export const updateSelectedClient = (
  workspace: Workspace | undefined,
  payload: WorkspaceEvents['workspace:update:selected-client'],
) => {
  if (!workspace) {
    return
  }
  workspace['x-scalar-default-client'] = payload
}

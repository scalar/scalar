import type { WorkspaceEvents } from '@/events/definitions/workspace'
import type { Workspace } from '@/schemas'

/**
 * Updates the active proxy for the given workspace.
 *
 * @param workspace - The workspace to update
 * @param payload - The new active proxy value
 */
export const updateActiveProxy = (
  workspace: Workspace | null,
  payload: WorkspaceEvents['workspace:update:active-proxy'],
) => {
  // If workspace is null, exit early
  if (!workspace) {
    return
  }
  // Set or clear the active proxy in the workspace object
  workspace['x-scalar-active-proxy'] = payload ?? undefined
}

/**
 * Updates the color mode for the given workspace.
 *
 * @param workspace - The workspace to update
 * @param payload - The new color mode value
 */
export const updateColorMode = (
  workspace: Workspace | null,
  payload: WorkspaceEvents['workspace:update:color-mode'],
) => {
  // If workspace is null, do nothing
  if (!workspace) {
    return
  }
  // Set the color mode in the workspace object
  workspace['x-scalar-color-mode'] = payload
}

/**
 * Updates the theme for the given workspace.
 *
 * @param workspace - The workspace to update
 * @param payload - The new theme value
 */
export const updateTheme = (workspace: Workspace | null, payload: WorkspaceEvents['workspace:update:theme']) => {
  // If workspace is null, exit early
  if (!workspace) {
    return
  }
  // Set the theme in the workspace object
  workspace['x-scalar-theme'] = payload
}

/**
 * Updates the active environment for the given workspace.
 *
 * @param workspace - The workspace to update
 * @param payload - The new active environment value
 */
export const updateActiveEnvironment = (
  workspace: Workspace | null,
  payload: WorkspaceEvents['workspace:update:active-environment'],
) => {
  // If workspace is null, exit early
  if (!workspace) {
    return
  }
  // Set the active environment in the workspace object
  workspace['x-scalar-active-environment'] = payload ?? undefined
}

/**
 * Updates the selected http client on the workspace
 *
 * @param workspace - The workspace to update the selected http client in
 * @param payload - The payload to update the selected client with
 * @returns
 */
export const updateSelectedClient = (
  workspace: Workspace | null,
  payload: WorkspaceEvents['workspace:update:selected-client'],
) => {
  if (!workspace) {
    return
  }
  workspace['x-scalar-default-client'] = payload
}

export const workspaceMutatorsFactory = ({ workspace }: { workspace: Workspace | null }) => {
  return {
    updateActiveProxy: (payload: WorkspaceEvents['workspace:update:active-proxy']) =>
      updateActiveProxy(workspace, payload),
    updateColorMode: (payload: WorkspaceEvents['workspace:update:color-mode']) => updateColorMode(workspace, payload),
    updateTheme: (payload: WorkspaceEvents['workspace:update:theme']) => updateTheme(workspace, payload),
    updateSelectedClient: (payload: WorkspaceEvents['workspace:update:selected-client']) =>
      updateSelectedClient(workspace, payload),
    updateActiveEnvironment: (payload: WorkspaceEvents['workspace:update:active-environment']) =>
      updateActiveEnvironment(workspace, payload),
  }
}

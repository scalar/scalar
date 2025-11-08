/** Event definitions to control the worksapce */
export type WorkspaceEvents = {
  /**
   * Create a new workspace and select it
   */
  'workspace:create:workspace': {
    /** The name of the workspace to create */
    workspaceName: string
  }
}

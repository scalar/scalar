export type ImportEventData = {
  type: 'url' | 'file' | 'raw'
  source: string
  companyLogo?: string | null
}

export type CreateWorkspacePayload = {
  /** The name of the workspace */
  name: string
}

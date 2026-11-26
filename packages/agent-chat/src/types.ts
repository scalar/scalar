export type ChatMode = 'preview' | 'full'

/** Identifies the selected API description within the documents authorized for a chat. */
export type SelectedDocument = {
  source: string
  title: string
  format: 'OpenAPI' | 'AsyncAPI'
  /** The API's info.version, rather than the OpenAPI or AsyncAPI specification version. */
  version: string
}

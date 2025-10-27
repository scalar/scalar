import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/** Event definitions to control the ui */
export type UIEvents = {
  /**
   * Download the document from the store
   */
  'download:document': {
    /** Format to download the document in */
    format: 'json' | 'yaml' | 'direct'
  }
  /**
   * Open the Api Client modal to a specific operation
   */
  'open:client': {
    /** The HTTP method of the operation to load */
    method: HttpMethod
    /** The path of the operation to load */
    path: string
  }
  /**
   * Open our command palette
   */
  'open:command-palette':
    | 'import'
    | 'addServer'
    | 'addCollection'
    | 'addTag'
    | 'addExample'
    | 'addOperation'
    | undefined
}

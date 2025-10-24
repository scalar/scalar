import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/** Event definitions to control the ui */
export type UIEvents = {
  /**
   * Download the document from the store
   *
   * @param format - The format to download the document in
   */
  'download:document': {
    format: 'json' | 'yaml' | 'direct'
  }
  /**
   * Open the Api Client modal
   *
   * @param method - The HTTP method of the client
   * @param path - The path of the client
   */
  'open:client': {
    method: HttpMethod
    path: string
  }
}

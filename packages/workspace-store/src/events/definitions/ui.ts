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

  /** Set a navigation item's (such as a tag or operation) expanded state */
  'toggle:nav-item': {
    /** The name of the nav item to toggle */
    id: string
    /** Optional defined state for the nav item. */
    open?: boolean
  }

  /** Select a navigation item. Run on sidebar clicks where a scroll handler would typically be expected */
  'select:nav-item': {
    /** The id of the nav item to select */
    id: string
  }

  /** Fired when a navigation item intersects with the viewport */
  'intersecting:nav-item': {
    /** The id of the nav item that is intersecting */
    id: string
  }

  /** Explicity scroll to a navigation item */
  'scroll-to:nav-item': {
    /** The id of the nav item to scroll to */
    id: string
  }

  /** Copy the url including anchor details for a navigation item */
  'copy-url:nav-item': {
    /** The id of the nav item to copy the anchor url for */
    id: string
  }
}

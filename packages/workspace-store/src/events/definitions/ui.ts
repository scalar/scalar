import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/** Event definitions to control the ui */
export type UIEvents = {
  /**
   * Download the document from the store
   */
  'ui:download:document': {
    /** Format to download the document in */
    format: 'json' | 'yaml' | 'direct'
  }
  /**
   * Focus the address bar
   */
  'ui:focus:address-bar': {
    event: KeyboardEvent
  }
  /**
   * Focus the send button
   */
  'ui:focus:send-button': {
    event: KeyboardEvent
  }
  /**
   * Focus the search
   */
  'ui:focus:search': {
    event: KeyboardEvent
  }
  /**
   * Toggle the sidebar
   */
  'ui:toggle:sidebar': {
    event: KeyboardEvent
  }
  /**
   * Open the Api Client modal to a specific operation
   */
  'ui:open:client-modal': {
    /** The HTTP method of the operation to load */
    method: HttpMethod
    /** The path of the operation to load */
    path: string
    /** The example name to load */
    exampleName?: string
  }
  /**
   * Close the client modal
   */
  'ui:close:client-modal': {
    event: KeyboardEvent
  }
  /**
   * Open the command palette
   */
  'ui:open:command-palette':
    | {
        action?: 'import' | 'addServer' | 'addCollection' | 'addTag' | 'addExample' | 'addOperation' | undefined
        event?: KeyboardEvent
      }
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

  /** On modal mode hide the modal */
  'hide:modal': undefined

  'import:curl': {
    value: string
  }
}

import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

export type ServerEvents<T extends keyof ServerObject = keyof ServerObject> = {
  /**
   * Add a new server to the document
   */
  'server:add': {
    /** The new server payload to add */
    server: ServerObject
  }
  /**
   * Delete a server from the document
   */
  'server:delete': {
    /** The URL of the server to delete */
    url: string
  }
  /**
   * Update the selected server via URL
   */
  'server:update:selected': {
    /** The new selected server URL */
    url: string
  }
  /**
   * Update the selected server variable for the document
   */
  'server:update:variables': {
    /** The key of the variable to update */
    key: string
    /** The new value of the variable */
    value: string
  }
  /**
   * Update the selected server properties for the document
   */
  'server:update:selected-properties': {
    /** The key of the property to update */
    key: T
    /** The new value of the property */
    value: ServerObject[T]
  }
  /**
   * Update the servers array on the document
   */
  // 'servers:update:document-servers': {
  //   /** The URL of the server to update */
  //   serverUrl: string
  //   /** The name of the property to update */
  //   name: string
  //   /** The new value of the property */
  //   value: string
  // }
}

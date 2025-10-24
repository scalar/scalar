import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

export type ServerEvents<T extends keyof ServerObject = keyof ServerObject> = {
  /**
   * Add a new server to the document
   */
  'add:server': {
    /** The new server payload to add */
    server: ServerObject
  }
  /**
   * Delete a server from the document
   */
  'delete:server': {
    /** The URL of the server to delete */
    url: string
  }
  /**
   * Update the selected server via URL
   */
  'update:selected-server': {
    /** The new selected server URL */
    url: string
  }
  /**
   * Update the selected server variable for the document
   */
  'update:selected-server-variables': {
    /** The key of the variable to update */
    key: string
    /** The new value of the variable */
    value: string
  }
  /**
   * Update the selected server properties for the document
   */
  'update:selected-server-properties': {
    /** The key of the property to update */
    key: T
    /** The new value of the property */
    value: ServerObject[T]
  }
  /**
   * Replace all servers in the document
   */
  'update:all-servers': {
    /** The new servers to replace the current servers with */
    servers: ServerObject[]
  }
}

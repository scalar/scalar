import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

export type ServerEvents<T extends keyof ServerObject = keyof ServerObject> = {
  /**
   * Add a new server to the document
   *
   * @param server - The new server to add
   */
  'add:server': {
    server: ServerObject
  }
  /**
   * Delete a server from the document
   *
   * @param url - The URL of the server to delete
   */
  'delete:server': {
    url: string
  }
  /**
   * Update the selected server via URL
   *
   * @param url - The new selected server URL
   */
  'update:selected-server': {
    url: string
  }
  /**
   * Update the selected server variable for the document
   *
   * @param key - The key of the variable to update
   * @param value - The new value of the variable
   */
  'update:selected-server-variables': {
    key: string
    value: string
  }
  /**
   * Update the selected server properties for the document
   *
   * @param key - The key of the property to update
   * @param value - The new value of the property
   */
  'update:selected-server-properties': {
    key: T
    value: ServerObject[T]
  }
  /**
   * Replace all servers in the document
   *
   * @param servers - The new servers to replace the current servers with
   */
  'update:all-servers': {
    servers: ServerObject[]
  }
}

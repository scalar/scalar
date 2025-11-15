import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

export type ServerEvents = {
  /**
   * Add a new blank server to the document
   */
  'server:add:server': undefined
  /**
   * Update the entire server object
   */
  'server:update:server': {
    /** The index of the server to update */
    index: number
    /** The new server payload to update */
    server: Partial<ServerObject>
  }
  /**
   * Delete a server from the document
   */
  'server:delete:server': {
    /** The index of the server to delete */
    index: number
  }
  /**
   * Update the selected server variable for the document
   */
  'server:update:variables': {
    /** The index of the server to update */
    index: number
    /** The key of the variable to update */
    key: string
    /** The new value of the variable */
    value: string
  }
  /**
   * Update the selected server for the document
   */
  'server:update:selected': {
    /** The URL of the server to select */
    url: string
  }
}

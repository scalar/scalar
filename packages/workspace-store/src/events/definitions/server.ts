import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import type { ServerObject } from '@/schemas/v3.1/strict/openapi-document'

export type ServerMeta =
  | {
      type: 'document'
    }
  | {
      type: 'operation'
      path: string
      method: HttpMethod
    }

export type ServerEvents = {
  /**
   * Add a new blank server to the target collection
   */
  'server:add:server': {
    /** The meta information for the server */
    meta: ServerMeta
  }
  /**
   * Update the entire server object for the target collection
   */
  'server:update:server': {
    /** The index of the server to update */
    index: number
    /** The new server payload to update */
    server: Partial<ServerObject>
    /** The meta information for the server */
    meta: ServerMeta
  }
  /**
   * Update the selected server variables for the target collection
   */
  'server:update:variables': {
    /** The index of the server to update */
    index: number
    /** The key of the variable to update */
    key: string
    /** The new value of the variable */
    value: string
    /** The meta information for the server */
    meta: ServerMeta
  }
  /**
   * Update the selected server for the target collection
   */
  'server:update:selected': {
    /** The URL of the server to select */
    url: string
    /** The meta information for the server */
    meta: ServerMeta
  }
  /**
   * Delete a server from the target collection
   */
  'server:delete:server': {
    /** The index of the server to delete */
    index: number
    /** The meta information for the server */
    meta: ServerMeta
  }
  /**
   * Clear all servers from the target collection
   */
  'server:clear:servers': {
    /** The meta information for the server */
    meta: ServerMeta
  }
}

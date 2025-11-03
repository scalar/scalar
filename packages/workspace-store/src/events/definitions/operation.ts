import type { HttpMethod } from '@scalar/helpers/http/http-methods'

type Meta = {
  meta: {
    method: HttpMethod
    path: string
    exampleKey: string
  }
}

/** Event definitions for the operation */
export type OperationEvents = {
  /**
   * Update the selected example for the operation
   */
  'update:selected-example': {
    /** The name of the example to select */
    name: string
  }

  'operation:send:request': Meta

  'operation:update:method': {
    /** The new method for the operation */
    method: HttpMethod
    meta: Pick<Meta['meta'], 'method' | 'path'>
  }

  'operation:update:path': {
    /** The new path for the operation */
    path: string

    meta: Pick<Meta['meta'], 'method' | 'path'>
  }

  'operation:update:description': {
    /** The new description for the operation */
    description: string
    /** Meta information for the operation */
    meta: Pick<Meta['meta'], 'method' | 'path'>
  }

  'operation:add:parameter': {
    type: 'path' | 'query' | 'header' | 'cookie'
    payload: {
      key: string
      value: string
      isEnabled: boolean
    }
  } & Meta
  'operation:delete:parameter': {
    type: 'path' | 'query' | 'header' | 'cookie'
    index: number
  } & Meta
  'operation:delete-all:parameters': {
    type: 'path' | 'query' | 'header' | 'cookie'
  } & Meta
  'operation:update:parameter': {
    type: 'path' | 'query' | 'header' | 'cookie'
    index: number
    payload: Partial<{
      key: string
      value: string
      isEnabled: boolean
    }>
  } & Meta

  'operation:update:requestBody:contentType': {
    contentType: string
  } & Meta

  'operation:update:requestBody:value': {
    value: string | File | undefined
    contentType: string
  } & Meta

  'operation:add:requestBody:formRow': {
    payload: Partial<{ key: string; value: string | File }>
    contentType: string
  } & Meta

  'operation:update:requestBody:formRow': {
    index: number
    payload: Partial<{ key: string; value?: string | File | null }>
    contentType: string
  } & Meta

  'operation:delete:requestBody:formRow': {
    index: number
    contentType: string
  } & Meta
}

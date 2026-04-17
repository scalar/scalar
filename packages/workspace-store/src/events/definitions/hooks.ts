import type { OperationExampleMeta } from '@/events/definitions/operation'
import type { RequestPayload } from '@/request-example/builder/build-request'

/**
 * Event definitions for hooking into the API client lifecycle.
 *
 * These events allow you to monitor and respond to request state changes
 * in the API client. Useful for implementing loading states, analytics,
 * or custom behavior around HTTP requests.
 */
export type HooksEvents = {
  /**
   * Fired when a request is sent from the API client.
   *
   * Use this event to trigger loading states, track analytics,
   * or perform actions when a request begins.
   */
  'hooks:on:request:sent': {
    meta: OperationExampleMeta
  }
  /**
   * Fired when a request completes (either successfully or with an error)
   * or when the request is aborted by the user.
   *
   * Use this event to hide loading states, clean up resources,
   * or handle post-request logic regardless of the outcome.
   */
  'hooks:on:request:complete': {
    payload:
      | {
          response: Response
          requestPayload: RequestPayload
          duration: number
          timestamp: number
        }
      | undefined
    meta: OperationExampleMeta
  }
  /**
   * Fired when a document rebase operation completes.
   *
   * Use this event to perform actions when a document rebase operation completes.
   */
  'hooks:on:rebase:document:complete': {
    meta: {
      documentName: string
    }
  }
}

import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/** Event definitions for analytics/callbacks/hooks */
export type AnalyticsEvents = {
  /**
   * Fired when a request is sent through the API client
   */
  'on:send-request': {
    /** The HTTP method of the request */
    method: HttpMethod
    /** The path of the request */
    path: string
    /** The body of the request */
    body: any
  }
  /**
   * Fired when the user clicks the "Show more" button on the references
   */
  'on:show-more': {
    /** The id of the tag that was opened */
    id: string
  }
  /**
   * Fired when the references are loaded
   */
  'on:loaded': void
}

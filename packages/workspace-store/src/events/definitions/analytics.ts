import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/** Event definitions for analytics/callbacks/hooks */
export type AnalyticsEvents = {
  /**
   * Fired when a request is sent through the API client
   *
   * @param method - The HTTP method of the request
   * @param path - The path of the request
   * @param body - The body of the request
   */
  'on:send-request': {
    method: HttpMethod
    path: string
    body: any
  }
  /**
   * Fired when the user clicks the "Show more" button on the references
   *
   * @param id - The id of the tag that was opened
   */
  'on:show-more': {
    id: string
  }
  /**
   * Fired when the references are loaded
   */
  'on:loaded': void
}

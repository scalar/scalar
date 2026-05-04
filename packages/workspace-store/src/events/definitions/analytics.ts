import type { HttpMethod } from '@scalar/helpers/http/http-methods'

/** Event definitions for analytics/callbacks/hooks */
export type AnalyticsEvents = {
  /**
   * Fired when a request is sent through the API client
   */
  'analytics:on:send-request': {
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
  'analytics:on:show-more': {
    /** The id of the tag that was opened */
    id: string
  }
  /**
   * Fired when the user clicks any login button
   */
  'analytics:on:login-click': undefined
  /**
   * Fired when the user clicks the register button
   */
  'analytics:on:register-click': undefined
  /**
   * Fired when a user successfully authenticates
   */
  'analytics:on:user-login': {
    uid: string
    email?: string
    teamUid: string
  }
  /**
   * Fired when the current user logs out
   */
  'analytics:on:user-logout': undefined
}

/**
 * All related events hooking into the app lifecycle
 */
export type HooksEvents = {
  /**
   * Fired when the request is sent on the api-clint
   */
  'on:request:sent': undefined
  /**
   * Fired when the response of a request is received
   * or the request is aborted
   */
  'on:request:complete': undefined
}

/** Event definitions for analytics/callbacks/hooks */
export type AnalyticsEvents = {
  /**
   * Fired when the user clicks the "Show more" button on the references
   */
  'analytics:on:show-more': {
    /** The id of the tag that was opened */
    id: string
  }
  /**
   * Fired when the references are loaded
   */
  'analytics:on:loaded': undefined
}

/** Event definitions for all things tag related */
export type TagEvents = {
  /**
   * Create a tag
   */
  'tag:create:tag': {
    /** The name of the tag to create */
    name: string
    /** The name of the document to add the tag to */
    documentName: string
    /** The callback to call when the tag is created */
    callback?: (success: boolean) => void
  }
}

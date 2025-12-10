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
  }
  /**
   * Delete a tag from the workspace
   */
  'tag:delete:tag': {
    /** The document to delete the tag from */
    documentName: string
    /** The name of the tag to delete */
    name: string
  }
}

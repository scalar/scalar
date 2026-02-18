import type { TraversedTag } from '@/schemas/navigation'

/** Event definitions for all things tag related */
export type TagEvents = {
  /** Create a tag */
  'tag:create:tag': {
    /** The name of the tag to create */
    name: string
    /** The name of the document to add the tag to */
    documentName: string
  }

  /** Edit a tag */
  'tag:edit:tag': {
    /** The document to edit the tag in */
    documentName: string
    /** The tag to edit */
    tag: TraversedTag
    /** The new name of the tag */
    newName: string
  }

  /** Delete a tag from the document */
  'tag:delete:tag': {
    /** The document to delete the tag from */
    documentName: string
    /** The name of the tag to delete */
    name: string
  }
}

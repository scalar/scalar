import type { JSDoc, Node } from 'typescript'

/**
 * Extract items from jsDoc comments
 *
 * TODO:
 * - figure out how to narrow type using helpers
 * - return all tags
 */
export const getJSDocFromNode = (node: Node) => {
  // Set default values
  let title = 'use to set the summary'
  let description = 'use jsdoc tag to set the description'

  // Check for jsDoc - todo properly narrow type using typescript lib
  if ('jsDoc' in node && Array.isArray(node.jsDoc)) {
    const jsDoc: JSDoc = node.jsDoc[0]
    const comment = jsDoc.comment?.toString()

    // getAllJSDocTags(node, predicate, tag)

    // Check for multiple lines to set both summary and description
    if (comment) {
      const [_title, _desc] = comment.split(/\n(.*)/s)
      if (_title) {
        title = _title
      }
      if (_desc?.length) {
        description = _desc.trim()
      }
    }

    // Check jsDoc tags
    jsDoc.tags?.forEach((tag) => {
      // Summary
      if (tag.tagName.escapedText.toString().match(/^name|summary/g) && tag.comment?.toString()) {
        title = tag.comment.toString()
      }
      // Description
      if (tag.tagName.escapedText.toString().match(/^desc/) && tag.comment?.toString()) {
        description = tag.comment.toString()
      }
    })
  }

  return { title, description }
}

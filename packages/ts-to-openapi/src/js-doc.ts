import { type Node, isJSDoc } from 'typescript'

/**
 * Extract items from jsDoc comments
 *
 * TODO:
 * - return all tags
 */
export const getJSDocFromNode = (node: Node): { title: string; description: string } => {
  // Set default values
  let title = 'use to set the summary'
  let description = 'use jsdoc tag to set the description'

  const jsDoc = 'jsDoc' in node && Array.isArray(node.jsDoc) ? node.jsDoc.find(isJSDoc) : undefined
  if (jsDoc) {
    const comment = jsDoc.comment?.toString()

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

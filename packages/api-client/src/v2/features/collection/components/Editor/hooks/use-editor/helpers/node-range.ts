import * as monaco from 'monaco-editor'

/**
 * Computes a monaco.Range that spans the whole lines covering the given AST node.
 * The range starts at the beginning of the line where the node starts,
 * and ends at the end of the line where the node ends.
 *
 * @param model The Monaco editor text model
 * @param node The JSON AST node whose line range to compute
 * @returns The range from the start of the start line to the end of the end line
 */
export const nodeToWholeLineRange = (
  model: monaco.editor.ITextModel,
  node: monaco.languages.json.ASTNode,
): monaco.Range => {
  const start = model.getPositionAt(node.offset)
  const end = model.getPositionAt(node.offset + node.length)

  const startLine = Math.max(1, start.lineNumber)
  const endLine = Math.max(startLine, end.lineNumber)

  return new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))
}

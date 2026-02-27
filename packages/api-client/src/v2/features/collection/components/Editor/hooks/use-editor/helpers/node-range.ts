import * as monaco from 'monaco-editor'

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

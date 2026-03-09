import * as monaco from 'monaco-editor'

export const rangeToWholeLine = (model: monaco.editor.ITextModel, range: monaco.Range): monaco.Range => {
  const startOffset = model.getOffsetAt(range.getStartPosition())
  const endOffset = model.getOffsetAt(range.getEndPosition())
  const start = model.getPositionAt(startOffset)
  const inclusiveEndOffset = Math.max(startOffset, endOffset - 1)
  const end = model.getPositionAt(inclusiveEndOffset)
  const startLine = Math.max(1, start.lineNumber)
  const endLine = Math.max(startLine, end.lineNumber)
  return new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))
}

import * as monaco from 'monaco-editor'

/**
 * Expands a given range to cover whole lines within a Monaco editor model.
 *
 * Given a text model and an input range, this function calculates the smallest
 * and largest lines touched by the range and returns a new range that starts at
 * the beginning of the first touched line and ends at the end of the last touched line.
 *
 * @param model The Monaco editor text model.
 * @param range The Monaco Range to expand.
 * @returns A new Monaco Range covering the whole lines spanned by the given range.
 */
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

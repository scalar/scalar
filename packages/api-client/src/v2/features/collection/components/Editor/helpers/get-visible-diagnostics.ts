import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

const isVisibleDiagnostic = (marker: monaco.editor.IMarker): boolean =>
  marker.severity === monaco.MarkerSeverity.Error || marker.severity === monaco.MarkerSeverity.Warning

const compareDiagnostics = (a: monaco.editor.IMarker, b: monaco.editor.IMarker): number => {
  if (a.severity !== b.severity) {
    return b.severity - a.severity
  }
  if (a.startLineNumber !== b.startLineNumber) {
    return a.startLineNumber - b.startLineNumber
  }
  return a.startColumn - b.startColumn
}

/**
 * Returns up to `maxVisible` diagnostics from the provided markers array,
 * filtering to only errors and warnings, sorted by severity and position in the document.
 */
export const getVisibleDiagnostics = (markers: monaco.editor.IMarker[], maxVisible: number): monaco.editor.IMarker[] =>
  [...markers].filter(isVisibleDiagnostic).sort(compareDiagnostics).slice(0, maxVisible)

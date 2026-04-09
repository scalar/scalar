import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

/**
 * This function counts the number of error and warning markers in the provided array of Monaco editor markers.
 *
 * @param markers - The array of Monaco editor markers to count the errors and warnings for
 * @returns An object with the number of errors and warnings
 */
export const getDiagnosticCounts = (markers: monaco.editor.IMarker[]): { errors: number; warnings: number } => {
  let errors = 0
  let warnings = 0

  for (const marker of markers) {
    if (marker.severity === monaco.MarkerSeverity.Error) {
      errors += 1
    } else if (marker.severity === monaco.MarkerSeverity.Warning) {
      warnings += 1
    }
  }

  return { errors, warnings }
}

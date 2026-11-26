import { compile, isDiagnostic } from 'treffer'

/** Compiles a JSONPath I-Regexp and charges matcher transitions to the composition budget. */
export const compileOverlayRegExp = (
  pattern: string,
  maxStates: number,
  onTransition: () => void,
): ((text: string, fullMatch: boolean) => boolean) | null => {
  try {
    // Retain the anchor behavior expected by the JSONPath compliance suite.
    const matcher = compile(pattern, { anchors: true, maxStates, onTransition })
    return (text, fullMatch) => (fullMatch ? matcher.match(text) : matcher.search(text))
  } catch (error) {
    if (!isDiagnostic(error)) {
      throw error
    }
    if (error.code === 'TREFFER_SYNTAX') {
      // JSONPath defines an invalid I-Regexp as a non-match.
      return null
    }
    throw new Error('Overlay JSONPath regular expression exceeded its complexity limit', { cause: error })
  }
}

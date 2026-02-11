/**
 * Creates a map of parameter names to their character positions in a path.
 * Used to detect renamed path parameters by position matching.
 */
export const getParameterPositions = (path: string, parameters: readonly string[]): Record<string, number> => {
  const positions: Record<string, number> = {}

  for (const paramName of parameters) {
    const position = path.indexOf(`{${paramName}}`)
    if (position !== -1) {
      positions[paramName] = position
    }
  }

  return positions
}

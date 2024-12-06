/** Parses the active environment variables and extracts key-value pairs. */
export function parseEnvVariables(
  activeEnvVariables: { key: string; value: string; source: string }[],
) {
  return activeEnvVariables.flatMap((variable) => {
    if (variable.key === 'value') {
      try {
        const parsedValue = JSON.parse(variable.value)
        return Object.keys(parsedValue).map((key) => ({
          key,
          value: parsedValue[key],
          source: variable.source,
        }))
      } catch (e) {
        // Skip invalid environment editor JSON entries
      }
    }
    return [variable]
  })
}

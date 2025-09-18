/**
 * Checks if a string appears to be YAML content.
 * This function uses a simple heuristic: it looks for a line that starts with an optional dash,
 * followed by a key (alphanumeric or dash), a colon, and a value, and then at least one more line.
 * This is not a full YAML parser, but works for basic detection.
 *
 * @param value - The string to check
 * @returns true if the string looks like YAML, false otherwise
 *
 * @example
 * isYaml('openapi: 3.0.0\ninfo:\n  title: Example') // true
 * isYaml('{"openapi": "3.0.0", "info": {"title": "Example"}}') // false
 * isYaml('- name: value\n- name: value2') // true
 * isYaml('type: object') // false (only one line)
 */
export function isYaml(value: string): boolean {
  return /^\s*(?:-\s*)?[\w\-]+\s*:\s*.+\n.*/.test(value)
}

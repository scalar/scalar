/**
 * Escapes a string for use in Rust string literals
 * Handles quotes, backslashes, newlines, and other special characters
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
    .replace(/\0/g, '\\0') // Escape null bytes
}

/**
 * Formats and escapes a string safely for use in Rust string literals.
 * The returned value is the escaped string, surrounded by double quotes,
 * making it ready for direct insertion into Rust source code.
 */
export function wrapInDoubleQuotes(str: string): string {
  return `"${escapeString(str)}"`
}

/**
 * Produces an indented string using 4 spaces per indent level,
 * in accordance with rustfmt style guidelines.
 * Useful for code generation scenarios requiring precise formatting.
 */
export function indent(level: number, text: string): string {
  const spaces = ' '.repeat(level * 4)
  return `${spaces}${text}`
}

/**
 * Formats a Rust chained method call with standard 4-space indentation.
 * Useful for fluent API or builder patterns in generated Rust code.
 */
export function createChain(method: string, ...args: string[]): string {
  return indent(1, `.${method}(${args.join(', ')})`)
}

/**
 * Properly formats a JSON snippet for Rust's `serde_json::json!` macro,
 * applying idiomatic 4-space indentation to each line for improved readability.
 */
export function formatJson(jsonText: string): string {
  try {
    const jsonData = JSON.parse(jsonText)
    const prettyJson = JSON.stringify(jsonData, null, 4)

    // Split into lines and add proper indentation for Rust
    const lines = prettyJson.split('\n')
    const rustLines = lines.map((line, index) => {
      if (index === 0) {
        // First line (opening brace)
        return line
      }
      if (index === lines.length - 1) {
        // Last line (closing brace)
        return indent(1, line)
      }
      // Middle lines
      return indent(1, line)
    })

    return rustLines.join('\n')
  } catch {
    // If JSON parsing fails, return the original text
    return jsonText
  }
}

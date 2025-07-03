/**
 * Utilities for escaping strings in Rust code generation
 */

/**
 * Escapes a string for use in Rust string literals
 * Handles quotes, backslashes, newlines, and other special characters
 */
function escapeRustString(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
    .replace(/\0/g, '\\0') // Escape null bytes
}

/**
 * Safely formats a string for use in Rust string literals
 * Returns the escaped string wrapped in double quotes
 */
export function toRustString(str: string): string {
  return `"${escapeRustString(str)}"`
}

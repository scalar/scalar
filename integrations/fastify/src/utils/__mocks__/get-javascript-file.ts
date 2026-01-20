/**
 * Mock implementation of getJavaScriptFile for tests.
 *
 * The actual scalar.js file is only created during build (via copy:standalone),
 * but we don't need the real content for testing the plugin logic.
 */
export function getJavaScriptFile(): string {
  return '// mock scalar.js content for tests'
}

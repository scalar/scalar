/**
 * Escape a JSON string so it is safe to embed inside an inline script tag.
 * This prevents user content from closing the script tag. Apply only to JSON data,
 * because escaping executable source would change JavaScript operators.
 */
export const escapeJsonForInlineScript = (json: string): string => {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

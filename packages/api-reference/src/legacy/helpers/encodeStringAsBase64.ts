/**
 * Encodes a given string as Base64. In Node.js (Buffer) and Browser environments (btoa).
 */
export function encodeStringAsBase64(value: string) {
  // Node.js
  if (typeof window === 'undefined') {
    return Buffer.from(value).toString('base64')
  }

  // Browser
  return btoa(value)
}

/**
 * Generates a SHA-256 hexadecimal hash for the provided string input.
 *
 * This function uses the Web Crypto API, returning a lowercase hex string.
 * The resulting hash is deterministic for the same input.
 *
 * @param input - The input string to hash.
 * @returns A Promise that resolves to a hexadecimal string representing the SHA-256 hash.
 *
 * @example
 * const hash = await generateHash('hello world')
 * console.log(hash) // => 'b94d27b9934d3e08a52e52d7da7dabfadeb...'
 */
export const generateHash = async (input: string): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))

  // Convert the ArrayBuffer to a Uint8Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Convert each byte to its hexadecimal representation and join them
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

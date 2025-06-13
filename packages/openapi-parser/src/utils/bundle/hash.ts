/**
 * Generates a short SHA-1 hash from a string value.
 * This function is used to create unique identifiers for external references
 * while keeping the hash length manageable. It uses the Web Crypto API to
 * generate a SHA-1 hash and returns the first 7 characters of the hex string.
 * If the hash would be all numbers, it ensures at least one letter is included.
 *
 * @param value - The string to hash
 * @returns A 7-character hexadecimal hash with at least one letter
 * @example
 * // Returns "2ae91d7"
 * await getHash("https://example.com/schema.json")
 */
export async function getHash(value: string) {
  // Convert string to ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(value)

  // Hash the data
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  // Return first 7 characters of the hash, ensuring at least one letter
  const hash = hashHex.substring(0, 7)
  return hash.match(/^\d+$/) ? 'a' + hash.substring(1) : hash
}

/**
 * Generates a unique compressed value for a string, handling collisions by recursively compressing
 * until a unique value is found. This is used to create unique identifiers for external
 * references in the bundled OpenAPI document.
 *
 * @param compress - Function that generates a compressed value from a string
 * @param value - The original string value to compress
 * @param compressedToValue - Object mapping compressed values to their original values
 * @param prevCompressedValue - Optional previous compressed value to use as input for generating a new value
 * @param depth - Current recursion depth to prevent infinite loops
 * @returns A unique compressed value that doesn't conflict with existing values
 *
 * @example
 * const valueMap = {}
 * // First call generates compressed value for "example.com/schema.json"
 * const value1 = await generateUniqueValue("example.com/schema.json", valueMap)
 * // Returns something like "2ae91d7"
 *
 * // Second call with same value returns same compressed value
 * const value2 = await generateUniqueValue("example.com/schema.json", valueMap)
 * // Returns same value as value1
 *
 * // Call with different value generates new unique compressed value
 * const value3 = await generateUniqueValue("example.com/other.json", valueMap)
 * // Returns different value like "3bf82e9"
 */
export async function generateUniqueValue(
  compress: (value: string) => Promise<string> | string,
  value: string,
  compressedToValue: Record<string, string>,
  prevCompressedValue?: string,
  depth = 0,
) {
  // Maximum recursion depth to prevent infinite loops
  const MAX_DEPTH = 100

  if (depth >= MAX_DEPTH) {
    throw 'Can not generate unique compressed values'
  }

  // First time we check if the value is present
  if (depth === 0) {
    const result = Object.entries(compressedToValue).find(([_, originalValue]) => originalValue === value)

    if (result) {
      return result[0]
    }
  }

  // Generate compressed value using either the provided prevCompressedValue or original value
  const compressedValue = await compress(prevCompressedValue ?? value)

  // If compressed value exists and maps to a different value, recursively try again with the compressed value as input
  if (compressedToValue[compressedValue] !== undefined && compressedToValue[compressedValue] !== value) {
    return generateUniqueValue(compress, value, compressedToValue, compressedValue, depth + 1)
  }

  // Store the [compressed value] => [value] mapping and return the unique compressed value
  compressedToValue[compressedValue] = value
  return compressedValue
}

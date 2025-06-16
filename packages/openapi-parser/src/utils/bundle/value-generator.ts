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
 * const value1 = await generateUniqueValue(compress, "example.com/schema.json", valueMap)
 * // Returns something like "2ae91d7"
 *
 * // Second call with same value returns same compressed value
 * const value2 = await generateUniqueValue(compress, "example.com/schema.json", valueMap)
 * // Returns same value as value1
 *
 * // Call with different value generates new unique compressed value
 * const value3 = await generateUniqueValue(compress, "example.com/other.json", valueMap)
 * // Returns different value like "3bf82e9"
 */
export async function generateUniqueValue(
  compress: (value: string) => Promise<string> | string,
  value: string,
  compressedToValue: Record<string, string>,
  prevCompressedValue?: string,
  depth = 0,
) {
  // Prevent infinite recursion by limiting depth
  const MAX_DEPTH = 100

  if (depth >= MAX_DEPTH) {
    throw 'Can not generate unique compressed values'
  }

  // Compress the value, using previous compressed value if provided
  const compressedValue = await compress(prevCompressedValue ?? value)

  // Handle collision by recursively trying with compressed value as input
  if (compressedToValue[compressedValue] !== undefined && compressedToValue[compressedValue] !== value) {
    return generateUniqueValue(compress, value, compressedToValue, compressedValue, depth + 1)
  }

  // Store mapping and return unique compressed value
  compressedToValue[compressedValue] = value
  return compressedValue
}

/**
 * Factory function that creates a value generator with caching capabilities.
 * The generator maintains a bidirectional mapping between original values and their compressed forms.
 *
 * @param compress - Function that generates a compressed value from a string
 * @param compressedToValue - Initial mapping of compressed values to their original values
 * @returns An object with a generate method that produces unique compressed values
 *
 * @example
 * const compress = (value) => value.substring(0, 6) // Simple compression example
 * const initialMap = { 'abc123': 'example.com/schema.json' }
 * const generator = uniqueValueGeneratorFactory(compress, initialMap)
 *
 * // Generate compressed value for new string
 * const compressed = await generator.generate('example.com/other.json')
 * // Returns something like 'example'
 *
 * // Generate compressed value for existing string
 * const cached = await generator.generate('example.com/schema.json')
 * // Returns 'abc123' from cache
 */
export const uniqueValueGeneratorFactory = (
  compress: (value: string) => Promise<string> | string,
  compressedToValue: Record<string, string>,
) => {
  // Create a reverse mapping from original values to their compressed forms
  const valueToCompressed = Object.fromEntries(Object.entries(compressedToValue).map(([key, value]) => [value, key]))

  return {
    /**
     * Generates a unique compressed value for the given input string.
     * First checks if a compressed value already exists in the cache.
     * If not, generates a new unique compressed value and stores it in the cache.
     *
     * @param value - The original string value to compress
     * @returns A Promise that resolves to the compressed string value
     *
     * @example
     * const generator = uniqueValueGeneratorFactory(compress, {})
     * const compressed = await generator.generate('example.com/schema.json')
     * // Returns a unique compressed value like 'example'
     */
    generate: async (value: string) => {
      // Check if we already have a compressed value for this input
      const cache = valueToCompressed[value]
      if (cache) {
        return cache
      }

      // Generate a new unique compressed value
      const generatedValue = await generateUniqueValue(compress, value, compressedToValue)

      // Ensure the generated string contains at least one non-numeric character
      // This prevents the `setValueAtPath` function from interpreting the value as an array index
      // by forcing it to be treated as an object property name
      const compressedValue = generatedValue.match(/^\d+$/) ? `a${generatedValue}` : generatedValue

      // Store the new mapping in our cache
      valueToCompressed[value] = compressedValue

      return compressedValue
    },
  }
}

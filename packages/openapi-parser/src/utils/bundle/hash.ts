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
 * Generates a unique hash for a value, handling hash collisions by recursively hashing
 * until a unique hash is found. This is used to create unique identifiers for external
 * references in the bundled OpenAPI document.
 *
 * @param hashFunction - Function that generates a hash from a string value
 * @param value - The original string value to hash
 * @param hashToValue - Object mapping hashes to their original values
 * @param valueHash - Optional previous hash to use as input for generating a new hash
 * @param depth - Current recursion depth to prevent infinite loops
 * @returns A unique hash that doesn't conflict with existing values
 *
 * @example
 * const hashMap = {}
 * // First call generates hash for "example.com/schema.json"
 * const hash1 = await generateUniqueHash("example.com/schema.json", hashMap)
 * // Returns something like "2ae91d7"
 *
 * // Second call with same value returns same hash
 * const hash2 = await generateUniqueHash("example.com/schema.json", hashMap)
 * // Returns same hash as hash1
 *
 * // Call with different value generates new unique hash
 * const hash3 = await generateUniqueHash("example.com/other.json", hashMap)
 * // Returns different hash like "3bf82e9"
 */
export async function generateUniqueHash(
  hashFunction: (value: string) => Promise<string>,
  value: string,
  hashToValue: Record<string, string>,
  valueHash?: string,
  depth = 0,
) {
  // Maximum recursion depth to prevent infinite loops
  const MAX_DEPTH = 100

  if (depth >= MAX_DEPTH) {
    throw 'Can not generate unique hash values'
  }

  // Generate hash using either the provided valueHash or original value
  const hash = await hashFunction(valueHash ?? value)

  // If hash exists and maps to a different value, recursively try again with the hash as input
  if (hashToValue[hash] !== undefined && hashToValue[hash] !== value) {
    return generateUniqueHash(hashFunction, value, hashToValue, hash, depth + 1)
  }

  // Store the hash-value mapping and return the unique hash
  hashToValue[hash] = value
  return hash
}

/**
 * Generates a safe hash for a value that is guaranteed to be unique within the provided hash map.
 * This is a convenience wrapper around generateUniqueHash that uses the default getHash function.
 * The hash is used to create unique identifiers for external references in bundled OpenAPI documents.
 *
 * @param value - The string value to hash (typically a URL or file path)
 * @param hashToValue - Object mapping hashes to their original values to prevent collisions
 * @returns A unique hash that doesn't conflict with existing values
 *
 * @example
 * const hashMap = {}
 * const hash = await getSafeHash("example.com/schema.json", hashMap)
 * // Returns something like "2ae91d7"
 */
export async function getSafeHash(value: string, hashToValue: Record<string, string>) {
  return generateUniqueHash(getHash, value, hashToValue)
}

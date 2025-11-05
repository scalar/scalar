import xxhash from 'xxhash-wasm'

let hasherInstance: Awaited<ReturnType<typeof xxhash>> | null = null

/**
 * Initialize the xxhash hasher instance lazily
 *
 * This is just a workaround because we cannot use top level await in a UMD module (standalone references)
 */
const getHasher = async () => {
  if (!hasherInstance) {
    hasherInstance = await xxhash()
  }
  return hasherInstance
}

/**
 * Generate a hash from a string using the xxhash algorithm
 *
 * We cannot use crypto.subtle because it is only available in secure contexts (HTTPS) or on localhost.
 * So this is just a wrapper around the xxhash-wasm library instead.
 *
 * @param input - The string to hash
 * @returns A Promise that resolves to the hash of the input string
 */
export const generateHash = async (input: string): Promise<string> => {
  const { h64ToString } = await getHasher()
  return h64ToString(input)
}

import xxhash from 'xxhash-wasm'

const { h64ToString } = await xxhash()

/**
 * Generate a hash from a string using the xxhash algorithm
 *
 * We cannot use crypto.subtle because it is only available in secure contexts (HTTPS) or on localhost.
 * So this is just a wrapper around the xxhash-wasm library instead.
 *
 * @param input - The string to hash
 * @returns The hash of the input string
 */
export const generateHash = (input: string): string => h64ToString(input)

/**
 * MurmurHash3 implementation
 *
 * Generate a hash from a string using the MurmurHash3 algorithm
 * Provides 64-bit hash output with excellent speed and distribution
 *
 * We had to move away from xxhash-wasm since it was causing issues with content security policy (CSP) violations.
 *
 * We cannot use crypto.subtle because it is only available in secure contexts (HTTPS) or on localhost.
 *
 * @param input - The string to hash
 * @returns The 64-bit hash of the input string as a 16-character hex string
 */
export const generateHash = (input: string): string => {
  const seed = 0

  // Working with 64-bit values using pairs of 32-bit integers
  let h1 = seed
  let h2 = seed

  const len = input.length
  const remainder = len & 15 // len % 16
  const bytes = len - remainder

  const c1 = 0x87c37b91
  const c2 = 0x4cf5ad43
  const c3 = 0x52dce729
  const c4 = 0x38495ab5

  // Process 16-byte chunks
  for (let i = 0; i < bytes; i += 16) {
    let k1 =
      (input.charCodeAt(i) & 0xff) |
      ((input.charCodeAt(i + 1) & 0xff) << 8) |
      ((input.charCodeAt(i + 2) & 0xff) << 16) |
      ((input.charCodeAt(i + 3) & 0xff) << 24)

    let k2 =
      (input.charCodeAt(i + 4) & 0xff) |
      ((input.charCodeAt(i + 5) & 0xff) << 8) |
      ((input.charCodeAt(i + 6) & 0xff) << 16) |
      ((input.charCodeAt(i + 7) & 0xff) << 24)

    let k3 =
      (input.charCodeAt(i + 8) & 0xff) |
      ((input.charCodeAt(i + 9) & 0xff) << 8) |
      ((input.charCodeAt(i + 10) & 0xff) << 16) |
      ((input.charCodeAt(i + 11) & 0xff) << 24)

    let k4 =
      (input.charCodeAt(i + 12) & 0xff) |
      ((input.charCodeAt(i + 13) & 0xff) << 8) |
      ((input.charCodeAt(i + 14) & 0xff) << 16) |
      ((input.charCodeAt(i + 15) & 0xff) << 24)

    k1 = Math.imul(k1, c1)
    k1 = (k1 << 15) | (k1 >>> 17)
    k1 = Math.imul(k1, c2)
    h1 ^= k1

    h1 = (h1 << 13) | (h1 >>> 19)
    h1 = Math.imul(h1, 5) + 0xe6546b64

    k2 = Math.imul(k2, c2)
    k2 = (k2 << 16) | (k2 >>> 16)
    k2 = Math.imul(k2, c3)
    h2 ^= k2

    h2 = (h2 << 17) | (h2 >>> 15)
    h2 = Math.imul(h2, 5) + 0x1b873593

    k3 = Math.imul(k3, c3)
    k3 = (k3 << 17) | (k3 >>> 15)
    k3 = Math.imul(k3, c4)
    h1 ^= k3

    h1 = (h1 << 15) | (h1 >>> 17)
    h1 = Math.imul(h1, 5) + 0x52dce729

    k4 = Math.imul(k4, c4)
    k4 = (k4 << 18) | (k4 >>> 14)
    k4 = Math.imul(k4, c1)
    h2 ^= k4

    h2 = (h2 << 13) | (h2 >>> 19)
    h2 = Math.imul(h2, 5) + 0x38495ab5
  }

  // Process remaining bytes
  if (remainder > 0) {
    let k1 = 0
    let k2 = 0
    let k3 = 0
    let k4 = 0

    if (remainder >= 15) {
      k4 ^= (input.charCodeAt(bytes + 14) & 0xff) << 16
    }
    if (remainder >= 14) {
      k4 ^= (input.charCodeAt(bytes + 13) & 0xff) << 8
    }
    if (remainder >= 13) {
      k4 ^= input.charCodeAt(bytes + 12) & 0xff
      k4 = Math.imul(k4, c4)
      k4 = (k4 << 18) | (k4 >>> 14)
      k4 = Math.imul(k4, c1)
      h2 ^= k4
    }

    if (remainder >= 12) {
      k3 ^= (input.charCodeAt(bytes + 11) & 0xff) << 24
    }
    if (remainder >= 11) {
      k3 ^= (input.charCodeAt(bytes + 10) & 0xff) << 16
    }
    if (remainder >= 10) {
      k3 ^= (input.charCodeAt(bytes + 9) & 0xff) << 8
    }
    if (remainder >= 9) {
      k3 ^= input.charCodeAt(bytes + 8) & 0xff
      k3 = Math.imul(k3, c3)
      k3 = (k3 << 17) | (k3 >>> 15)
      k3 = Math.imul(k3, c4)
      h1 ^= k3
    }

    if (remainder >= 8) {
      k2 ^= (input.charCodeAt(bytes + 7) & 0xff) << 24
    }
    if (remainder >= 7) {
      k2 ^= (input.charCodeAt(bytes + 6) & 0xff) << 16
    }
    if (remainder >= 6) {
      k2 ^= (input.charCodeAt(bytes + 5) & 0xff) << 8
    }
    if (remainder >= 5) {
      k2 ^= input.charCodeAt(bytes + 4) & 0xff
      k2 = Math.imul(k2, c2)
      k2 = (k2 << 16) | (k2 >>> 16)
      k2 = Math.imul(k2, c3)
      h2 ^= k2
    }

    if (remainder >= 4) {
      k1 ^= (input.charCodeAt(bytes + 3) & 0xff) << 24
    }
    if (remainder >= 3) {
      k1 ^= (input.charCodeAt(bytes + 2) & 0xff) << 16
    }
    if (remainder >= 2) {
      k1 ^= (input.charCodeAt(bytes + 1) & 0xff) << 8
    }
    if (remainder >= 1) {
      k1 ^= input.charCodeAt(bytes) & 0xff
      k1 = Math.imul(k1, c1)
      k1 = (k1 << 15) | (k1 >>> 17)
      k1 = Math.imul(k1, c2)
      h1 ^= k1
    }
  }

  // Finalization
  h1 ^= len
  h2 ^= len

  h1 += h2
  h2 += h1

  h1 ^= h1 >>> 16
  h1 = Math.imul(h1, 0x85ebca6b)
  h1 ^= h1 >>> 13
  h1 = Math.imul(h1, 0xc2b2ae35)
  h1 ^= h1 >>> 16

  h2 ^= h2 >>> 16
  h2 = Math.imul(h2, 0x85ebca6b)
  h2 ^= h2 >>> 13
  h2 = Math.imul(h2, 0xc2b2ae35)
  h2 ^= h2 >>> 16

  h1 += h2
  h2 += h1

  // Return 64-bit hash as hex string (two 32-bit values concatenated)
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0')
}

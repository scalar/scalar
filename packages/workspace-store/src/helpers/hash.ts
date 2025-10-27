export const generateHash = async (input: string) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))

  // Convert the ArrayBuffer to a Uint8Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Convert each byte to its hexadecimal representation and join them
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

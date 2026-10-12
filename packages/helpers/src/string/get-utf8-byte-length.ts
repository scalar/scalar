/** Count UTF-8 bytes without allocating an encoded copy of the string. */
export const getUtf8ByteLength = (text: string): number => {
  let bytes = 0
  for (const char of text) {
    // Unpaired surrogates become the three-byte replacement character, as in TextEncoder.
    const codeUnit = char.charCodeAt(0)
    if (char.length === 2) {
      bytes += 4
    } else if (codeUnit <= 0x7f) {
      bytes += 1
    } else {
      bytes += codeUnit <= 0x7ff ? 2 : 3
    }
  }
  return bytes
}

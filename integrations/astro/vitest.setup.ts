// jsdom does not ship `CSS.escape`. Polyfill it for tests so code that relies
// on it behaves as it would in any real browser.
// Spec: https://drafts.csswg.org/cssom/#serialize-an-identifier
const cssEscape = (value: string): string => {
  const string = String(value)
  const length = string.length
  let result = ''

  for (let index = 0; index < length; index++) {
    const codeUnit = string.charCodeAt(index)

    if (codeUnit === 0x0000) {
      result += '�'
      continue
    }

    if (
      (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
      codeUnit === 0x007f ||
      (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && string.charCodeAt(0) === 0x002d)
    ) {
      result += `\\${codeUnit.toString(16)} `
      continue
    }

    if (index === 0 && length === 1 && codeUnit === 0x002d) {
      result += `\\${string.charAt(index)}`
      continue
    }

    if (
      codeUnit >= 0x0080 ||
      codeUnit === 0x002d ||
      codeUnit === 0x005f ||
      (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
      (codeUnit >= 0x0061 && codeUnit <= 0x007a)
    ) {
      result += string.charAt(index)
      continue
    }

    result += `\\${string.charAt(index)}`
  }

  return result
}

if (typeof globalThis.CSS === 'undefined') {
  ;(globalThis as unknown as { CSS: { escape: typeof cssEscape } }).CSS = { escape: cssEscape }
} else if (typeof globalThis.CSS.escape !== 'function') {
  globalThis.CSS.escape = cssEscape
}

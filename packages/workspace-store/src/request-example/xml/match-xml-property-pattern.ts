/**
 * Match the bounded, non-branching subset needed by common property prefixes and character classes.
 * JavaScript regexes cannot be interrupted, so arbitrary schema expressions must not run on the UI
 * thread or mock-server event loop. Unsupported expressions are reported rather than guessed.
 */
export const matchXmlPropertyPattern = (pattern: string, name: string): boolean | undefined => {
  if (pattern.length > 256 || name.length > 256) {
    return undefined
  }
  let inClass = false
  let repetitions = 0
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index]
    if (character === '\\') {
      const escaped = pattern[++index]
      if (!escaped || (!inClass && /[1-9k]/.test(escaped))) {
        return undefined
      }
      continue
    }
    if (character === '[' && !inClass) {
      inClass = true
      continue
    }
    if (character === ']' && inClass) {
      inClass = false
      continue
    }
    if (inClass) {
      continue
    }
    if ('(){}|'.includes(character ?? '')) {
      return undefined
    }
    if ('*+?'.includes(character ?? '') && ++repetitions > 1) {
      return undefined
    }
  }
  try {
    return new RegExp(pattern).test(name)
  } catch {
    return undefined
  }
}

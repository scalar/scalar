/**
 * Match the bounded, non-branching subset needed by common property prefixes and character classes.
 * JavaScript regexes cannot be interrupted, so arbitrary schema expressions must not run on the UI
 * thread or mock-server event loop. Unsupported expressions are reported rather than guessed.
 * With branching, backreferences, and multiple quantifiers excluded, repetitions
 * cannot interact to create exponential backtracking. The single quantified atom may
 * still backtrack or restart matching, so both pattern and input lengths are bounded.
 */
export const matchPropertyPattern = (pattern: string, name: string): boolean | undefined => {
  if (pattern.length > 256 || name.length > 256) {
    return undefined
  }
  const literalNames = getLiteralPropertyPatternNames(pattern)
  if (literalNames) {
    return literalNames.includes(name)
  }
  // An outer capturing group does not affect whether a non-branching pattern matches.
  const expression = pattern.replace(/^(\^?)\(([^()|]+)\)(\$?)$/, '$1$2$3')
  let inClass = false
  let repetitions = 0
  for (let index = 0; index < expression.length; index++) {
    const character = expression[index]
    if (character === '\\') {
      const escaped = expression[++index]
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
/** Recognize finite anchored alternatives without evaluating a branching expression. */
export const getLiteralPropertyPatternNames = (pattern: string): string[] | undefined => {
  if (pattern.length > 256 || !pattern.startsWith('^(') || !pattern.endsWith(')$')) {
    return undefined
  }
  const names = pattern.slice(2, -2).split('|')
  return names.length > 1 && names.every((name) => /^[\w-]+$/.test(name)) ? names : undefined
}

import type { CompiledGrammar, CompiledRule, CompiledState, Emit, Token } from './types'

/**
 * Runs the state machine over `code`, calling `emit` for every range.
 *
 * Ranges are emitted in order and cover the input exactly — concatenating
 * every emitted slice reproduces the source. Nothing is allocated per token,
 * which is why the HTML renderer can build its output in a single pass.
 */
export const tokenize = (code: string, grammar: CompiledGrammar, emit: Emit): void => {
  const len = code.length
  const stack: CompiledState[] = [grammar.root]
  let top = grammar.root
  let pos = 0
  // Zero-length matches are legal (a pure state transition on a lookahead),
  // but a rule that neither consumes nor eventually changes state would spin.
  let spin = 0

  while (pos < len) {
    const re = top.re
    re.lastIndex = pos
    const m = re.exec(code)
    if (m === null) break

    const start = m.index
    if (start > pos) {
      emit(top.default, pos, start)
      pos = start
    }

    const rules = top.rules
    let rule: CompiledRule | undefined
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i]!
      if (m[r.group] !== undefined) {
        rule = r
        break
      }
    }
    if (rule === undefined) break // unreachable: some alternative matched

    const end = start + m[0].length
    if (end > start) {
      if (rule.captures !== null) {
        emitCaptures(code, start, rule, top, emit)
      } else {
        emit(rule.scope ?? top.default, start, end)
      }
    }

    if (rule.pop > 0) {
      // Never pop the root state off.
      const n = Math.min(rule.pop, stack.length - 1)
      stack.length -= n
    }
    if (rule.set !== null) {
      stack[stack.length - 1] = grammar.states[rule.set]!
    }
    if (rule.push !== null) {
      stack.push(grammar.states[rule.push]!)
    }
    top = stack[stack.length - 1]!

    if (end > pos) {
      pos = end
      spin = 0
    } else if (++spin > 32) {
      // Give up on the cycle and consume a character so we always terminate.
      emit(top.default, pos, pos + 1)
      pos++
      spin = 0
    }
  }

  if (pos < len) emit(top.default, pos, len)
}

/**
 * Re-runs the winning rule on its own to find where its capture groups sit.
 *
 * The rule's pattern is sticky and anchored at the position the merged regex
 * already settled on, so it matches exactly the same text — this only
 * recovers offsets, it never changes the outcome.
 *
 * Groups are walked left to right and clipped to the part of the match not yet
 * emitted. Positional scoping assumes groups are siblings, but nothing stops a
 * grammar from nesting one inside another — `((a)b)` — or capturing inside a
 * lookahead, where the group can even reach past the end of the match. Emitting
 * either verbatim would repeat text, or claim text the tokenizer is about to
 * visit again, so a group only ever scopes what the match still has left.
 */
const emitCaptures = (code: string, start: number, rule: CompiledRule, state: CompiledState, emit: Emit): void => {
  const own = rule.own!
  own.lastIndex = start
  const m = own.exec(code)
  if (m === null) return // unreachable: the merged regex matched this rule here

  const indices = m.indices!
  const whole = indices[0]!
  const captures = rule.captures!
  const fallback = rule.rest ?? state.default
  let cursor = whole[0]

  const limit = whole[1]
  for (let i = 0; i < captures.length; i++) {
    const span = indices[i + 1]
    if (span === undefined) continue // group did not participate
    const to = span[1] > limit ? limit : span[1] // a lookahead group can overrun
    if (to <= cursor) continue // already covered by an enclosing group
    const from = span[0] > cursor ? span[0] : cursor
    if (from > cursor) emit(fallback, cursor, from)
    if (to > from) emit(captures[i] ?? fallback, from, to) // a group can match empty
    cursor = to
  }

  if (limit > cursor) emit(fallback, cursor, limit)
}

/**
 * Collects tokens into an array.
 *
 * Prefer `highlight()` when the destination is HTML — it skips this
 * intermediate representation entirely. Use this to render into React
 * elements, a canvas, or anything else.
 */
export const tokenizeToArray = (code: string, grammar: CompiledGrammar): Token[] => {
  const tokens: Token[] = []
  tokenize(code, grammar, (scope, start, end) => {
    tokens.push({ scope, text: code.slice(start, end), start, end })
  })
  return tokens
}

import { dynamicRegExps } from './compile'
import { getLanguage } from './registry'
import type { CompiledGrammar, CompiledRule, CompiledState, Emit, Token } from './types'
import { REMEMBERED } from './types'

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
  // What each stack entry remembered (see `Rule.remember`), in step with `stack`.
  const memory: string[] = ['']
  let top = grammar.root
  let pos = 0
  // Zero-length matches are legal (a pure state transition on a lookahead),
  // but a rule that neither consumes nor eventually changes state would spin.
  let spin = 0

  while (pos < len) {
    if (top.embed !== null) {
      pos = embedded(code, pos, top, memory[memory.length - 1]!, emit)
      // An embedding state pops itself. A rule that `set` into it from the
      // only state on the stack leaves nothing below, so the root takes over.
      if (stack.length > 1) {
        stack.length -= 1
        memory.length -= 1
      } else {
        stack[0] = grammar.root
        memory[0] = ''
      }
      top = stack[stack.length - 1]!
      continue
    }

    const dyn = top.dynamic === null ? null : dynamicRegExps(top, memory[memory.length - 1]!)
    const re = dyn === null ? top.re : dyn.re
    re.lastIndex = pos
    const m = re.exec(code)
    if (m === null) {
      break
    }

    const start = m.index
    if (start > pos) {
      emit(top.default, pos, start)
      pos = start
    }

    const rules = top.rules
    let rule: CompiledRule | undefined
    let index = 0
    for (; index < rules.length; index++) {
      if (m[rules[index]!.group] !== undefined) {
        rule = rules[index]
        break
      }
    }
    if (rule === undefined) {
      break // unreachable: some alternative matched
    }

    const end = start + m[0].length
    if (end > start) {
      if (rule.captures !== null) {
        // Only rules that use the remembered text are rebuilt per value; the
        // rest of a dynamic state's capture rules keep their own pattern.
        emitCaptures(code, start, rule, dyn?.own[index] ?? rule.own!, top, emit)
      } else {
        emit(rule.scope ?? top.default, start, end)
      }
    }

    // Read before the stack changes: an entered state inherits the memory of
    // the state that entered it unless the rule remembers something new.
    let remembered = memory[memory.length - 1]!
    if (rule.remember > 0) {
      const text = m[rule.group + rule.remember] ?? ''
      remembered = rule.rememberIndent ? ' '.repeat(text.length) : text
    }

    if (rule.pop > 0) {
      // Never pop the root state off.
      const n = Math.min(rule.pop, stack.length - 1)
      stack.length -= n
      memory.length -= n
      if (rule.remember === 0) {
        remembered = memory[memory.length - 1]!
      }
    }
    if (rule.set !== null) {
      stack[stack.length - 1] = grammar.states[rule.set]!
      memory[memory.length - 1] = remembered
    }
    if (rule.push !== null) {
      stack.push(grammar.states[rule.push]!)
      memory.push(remembered)
    }
    top = stack[stack.length - 1]!

    if (end > pos) {
      pos = end
      spin = 0
    } else if (++spin > 32) {
      // Give up on the cycle and consume a whole code point so we always
      // terminate — stepping by one UTF-16 unit could bisect a surrogate pair.
      const step = code.codePointAt(pos)! > 0xffff ? 2 : 1
      emit(top.default, pos, pos + step)
      pos += step
      spin = 0
    }
  }

  if (pos < len) {
    emit(top.default, pos, len)
  }
}

/**
 * How deep embeds may nest before a body falls back to its state's default
 * scope. Real code nests two or three deep — Markdown, then HTML, then
 * JavaScript — but a Markdown fence can embed Markdown, and a run of
 * ` ```md ` lines would otherwise recurse once per line until the stack runs
 * out.
 */
const MAX_EMBED_DEPTH = 8

/** How many embedded bodies are being tokenized right now, one inside another. */
let depth = 0

/**
 * Tokenizes the body of an embedding state with its language and returns the
 * position after it.
 *
 * The body runs to the first match of the state's `until`, which is left for
 * the state below to tokenize. The slice is tokenized on its own, so the
 * embedded grammar starts in its root state and cannot read past the body —
 * an unterminated string in a `<script>` cannot swallow the `</script>`.
 */
const embedded = (code: string, pos: number, state: CompiledState, remembered: string, emit: Emit): number => {
  const until = state.embed!.until
  until.lastIndex = pos
  const found = until.exec(code)
  const stop = found === null ? code.length : found.index
  if (stop === pos) {
    return pos
  }
  // `{{remembered}}` takes the language from the text the entering rule
  // remembered, which is how a Markdown fence names its language at runtime.
  const language = state.embed!.language
  const grammar = getLanguage(language === REMEMBERED ? remembered : language)
  if (grammar === undefined || depth >= MAX_EMBED_DEPTH) {
    emit(state.default, pos, stop)
  } else {
    depth += 1
    try {
      tokenize(code.slice(pos, stop), grammar, (scope, from, to) => emit(scope, from + pos, to + pos))
    } finally {
      depth -= 1
    }
  }
  return stop
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
const emitCaptures = (
  code: string,
  start: number,
  rule: CompiledRule,
  own: RegExp,
  state: CompiledState,
  emit: Emit,
): void => {
  own.lastIndex = start
  const m = own.exec(code)
  if (m === null) {
    return // unreachable: the merged regex matched this rule here
  }

  const indices = m.indices!
  const whole = indices[0]!
  const captures = rule.captures!
  const fallback = rule.rest ?? state.default
  let cursor = whole[0]

  const limit = whole[1]
  for (let i = 0; i < captures.length; i++) {
    const span = indices[i + 1]
    if (span === undefined) {
      continue // group did not participate
    }
    const to = span[1] > limit ? limit : span[1] // a lookahead group can overrun
    if (to <= cursor) {
      continue // already covered by an enclosing group
    }
    const from = span[0] > cursor ? span[0] : cursor
    if (from > cursor) {
      emit(fallback, cursor, from)
    }
    if (to > from) {
      emit(captures[i] ?? fallback, from, to) // a group can match empty
    }
    cursor = to
  }

  if (limit > cursor) {
    emit(fallback, cursor, limit)
  }
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

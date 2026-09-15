import type { CompiledGrammar, CompiledRule, CompiledState, Grammar, Rule, StateRule } from './types'

/**
 * Compiles a grammar into one merged regex per state.
 *
 * The merge is the whole performance story. Instead of trying N patterns at
 * each position from JS, we hand the engine a single ordered alternation and
 * let it find the next interesting position itself — plain text between tokens
 * is skipped inside the regex engine rather than by a JS loop.
 *
 * Each rule is wrapped in its own group so that, after a match, we can tell
 * which alternative won by finding the first defined wrapper group.
 */

const BACKREF = /\\(?:[1-9]|k<)/

/** Counts capture groups in a pattern, ignoring escapes and character classes. */
const countGroups = (src: string): number => {
  let count = 0
  let inClass = false
  for (let i = 0; i < src.length; i++) {
    const c = src.charCodeAt(i)
    if (c === 92 /* \ */) {
      i++
      continue
    }
    if (inClass) {
      if (c === 93 /* ] */) inClass = false
      continue
    }
    if (c === 91 /* [ */) {
      inClass = true
      continue
    }
    if (c !== 40 /* ( */) continue
    if (src.charCodeAt(i + 1) !== 63 /* ? */) {
      count++
    } else if (src.charCodeAt(i + 2) === 60 /* < */) {
      // (?<name> captures; (?<= and (?<! are lookbehind.
      const after = src.charCodeAt(i + 3)
      if (after !== 61 /* = */ && after !== 33 /* ! */) count++
    }
  }
  return count
}

const patternSource = (match: string | RegExp): string => {
  return typeof match === 'string' ? match : match.source
}

/** Resolves `include` entries into a flat, priority-ordered rule list. */
const flatten = (
  grammarName: string,
  states: Record<string, { rules: StateRule[] }>,
  name: string,
  seen: Set<string>,
): Rule[] => {
  if (seen.has(name)) {
    throw new Error(`[${grammarName}] circular include of state "${name}"`)
  }
  seen.add(name)
  // `hasOwn` because a grammar is data a caller supplies: an `include` of
  // `constructor` would otherwise resolve off Object.prototype and sail past
  // this check, failing later with something far less legible.
  const state = Object.hasOwn(states, name) ? states[name] : undefined
  if (!state) throw new Error(`[${grammarName}] include of unknown state "${name}"`)

  const out: Rule[] = []
  for (const entry of state.rules) {
    if ('include' in entry) {
      out.push(...flatten(grammarName, states, entry.include, seen))
    } else {
      out.push(entry)
    }
  }
  seen.delete(name)
  return out
}

const compileState = (grammar: Grammar, name: string): CompiledState => {
  const state = grammar.states[name]!
  const rules = flatten(grammar.name, grammar.states, name, new Set())

  const compiled: CompiledRule[] = []
  const sources: string[] = []
  // Group 0 is the whole match, so rule wrapper groups start at 1.
  let group = 1
  const caseFlag = state.ignoreCase ? 'i' : ''

  for (const rule of rules) {
    const src = patternSource(rule.match)
    if (BACKREF.test(src)) {
      throw new Error(
        `[${grammar.name}:${name}] backreferences are not supported (group numbers ` +
          `shift when rules are merged): ${src}`,
      )
    }

    const captures = Array.isArray(rule.scope) ? rule.scope : null
    const inner = countGroups(src)
    if (captures) {
      if (captures.length > inner) {
        throw new Error(
          `[${grammar.name}:${name}] rule scopes ${captures.length} groups but the ` + `pattern has ${inner}: ${src}`,
        )
      }
    }

    compiled.push({
      scope: typeof rule.scope === 'string' ? rule.scope : null,
      captures,
      // Sticky, so it can be re-run at the position the merged regex chose.
      own: captures ? new RegExp(src, `ymd${caseFlag}`) : null,
      rest: rule.rest ?? null,
      group,
      push: rule.push ?? null,
      set: rule.set ?? null,
      pop: rule.pop === true ? 1 : (rule.pop ?? 0),
    })
    sources.push(`(${src})`)
    group += 1 + inner
  }

  // `m` so grammars can anchor to lines. Deliberately no `d`: offsets are
  // resolved per rule instead, which keeps the scan free of that cost.
  const flags = `gm${caseFlag}`
  // An empty state matches nothing: everything falls through to `default`.
  const re = new RegExp(sources.length ? sources.join('|') : '(?!)', flags)

  return { name, re, rules: compiled, default: state.default ?? null }
}

export const compile = (grammar: Grammar): CompiledGrammar => {
  if (!Object.hasOwn(grammar.states, 'root')) {
    throw new Error(`[${grammar.name}] grammar has no "root" state`)
  }

  // Null-prototype: state names come from grammar data, and the unknown-state
  // check below has to see `constructor` and `__proto__` as missing rather
  // than as inherited Object members. Tokenizing looks states up here too.
  const states: Record<string, CompiledState> = Object.create(null)
  for (const name of Object.keys(grammar.states)) {
    states[name] = compileState(grammar, name)
  }

  // Fail loudly at compile time rather than mid-tokenize on a rare branch.
  for (const state of Object.values(states)) {
    for (const rule of state.rules) {
      for (const target of [rule.push, rule.set]) {
        if (target && !states[target]) {
          throw new Error(`[${grammar.name}:${state.name}] transition to unknown state "${target}"`)
        }
      }
    }
  }

  return {
    name: grammar.name,
    aliases: grammar.aliases ?? [],
    states,
    root: states['root']!,
  }
}

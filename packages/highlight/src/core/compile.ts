import type { CompiledGrammar, CompiledRule, CompiledState, Grammar, Rule, StateRule } from './types'
import { REMEMBERED } from './types'

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
      if (c === 93 /* ] */) {
        inClass = false
      }
      continue
    }
    if (c === 91 /* [ */) {
      inClass = true
      continue
    }
    if (c !== 40 /* ( */) {
      continue
    }
    if (src.charCodeAt(i + 1) !== 63 /* ? */) {
      count++
    } else if (src.charCodeAt(i + 2) === 60 /* < */) {
      // (?<name> captures; (?<= and (?<! are lookbehind.
      const after = src.charCodeAt(i + 3)
      if (after !== 61 /* = */ && after !== 33 /* ! */) {
        count++
      }
    }
  }
  return count
}

const patternSource = (match: string | RegExp): string => {
  return typeof match === 'string' ? match : match.source
}

/**
 * Makes a pattern end lines at `\n` (or `\r\n`) only.
 *
 * With the `m` flag, JavaScript's `$` also matches before `\r`, U+2028 and
 * U+2029, and `.` refuses to match them. Grammars are written as if lines end
 * at `\n` — which is also where the line renderer splits — so a lone `\r` or a
 * U+2028 inside a string literal used to end the string there and leave the
 * rest of the line inverted. Rewriting the two tokens once, here, fixes every
 * grammar at the same time:
 *
 * - `.` becomes `[^\r\n]`: it now matches U+2028 and U+2029, and still
 *   stops before the `\r` of a CRLF so an escape like `\\.` cannot swallow it
 * - `$` becomes "before `\n` or `\r\n`, or at the end", so CRLF input still
 *   ends a line before its `\r`, exactly as it did before
 *
 * `^` stays native. A line that starts after a lone `\r` is harmless, and the
 * engine's own anchor is measurably faster on large input than a lookbehind.
 *
 * Escapes and character classes match as themselves and are kept verbatim, so
 * only a bare `.` or `$` is rewritten.
 */
const normalizeLineTerminators = (src: string): string => {
  // A single left-to-right scan rather than a tokenizing regex: a pattern for
  // "a character class" retried at every `[` of an unclosed run is O(n²).
  let out = ''
  let inClass = false
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (c === '\\') {
      out += c + (src[i + 1] ?? '')
      i++
    } else if (inClass) {
      inClass = c !== ']'
      out += c
    } else if (c === '[') {
      inClass = true
      out += c
    } else if (c === '.') {
      out += '[^\\r\\n]'
    } else if (c === '$') {
      out += '(?=\\r?\\n|(?![\\s\\S]))'
    } else {
      out += c
    }
  }
  return out
}

/** Escapes text so it can be spliced into a pattern and match literally. */
const escapeRegExp = (s: string): string => s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')

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
  if (!state) {
    throw new Error(`[${grammarName}] include of unknown state "${name}"`)
  }

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

  let dynamic = false
  const ownSources: (string | null)[] = []

  for (const rule of rules) {
    const raw = patternSource(rule.match)
    if (BACKREF.test(raw)) {
      throw new Error(
        `[${grammar.name}:${name}] backreferences are not supported (group numbers ` +
          `shift when rules are merged): ${raw}`,
      )
    }
    const src = normalizeLineTerminators(raw)
    const usesMemory = src.includes(REMEMBERED)
    dynamic ||= usesMemory

    const captures = Array.isArray(rule.scope) ? rule.scope : null
    const inner = countGroups(src)
    if (captures) {
      if (captures.length > inner) {
        throw new Error(
          `[${grammar.name}:${name}] rule scopes ${captures.length} groups but the ` + `pattern has ${inner}: ${src}`,
        )
      }
    }

    if (rule.remember !== undefined && (!(rule.push || rule.set) || rule.remember < 1 || rule.remember > inner)) {
      throw new Error(
        `[${grammar.name}:${name}] remember ${rule.remember} needs a push or set and one of ${inner} groups: ${raw}`,
      )
    }

    compiled.push({
      scope: typeof rule.scope === 'string' ? rule.scope : null,
      captures,
      // Sticky, so it can be re-run at the position the merged regex chose.
      // A pattern that depends on the remembered text is built per value.
      own: captures && !usesMemory ? new RegExp(src, `ymd${caseFlag}`) : null,
      rest: rule.rest ?? null,
      group,
      push: rule.push ?? null,
      set: rule.set ?? null,
      pop: rule.pop === true ? 1 : (rule.pop ?? 0),
      remember: rule.remember ?? 0,
      rememberIndent: rule.rememberAs === 'indent',
    })
    ownSources.push(captures && usesMemory ? src : null)
    sources.push(`(${src})`)
    group += 1 + inner
  }

  // `m` so grammars can anchor to lines. Deliberately no `d`: offsets are
  // resolved per rule instead, which keeps the scan free of that cost.
  const flags = `gm${caseFlag}`
  // An empty state matches nothing: everything falls through to `default`.
  const source = sources.length ? sources.join('|') : '(?!)'
  // A dynamic state still gets a regex of its own, built with nothing
  // remembered, so it can be entered from the root of a fresh tokenize.
  const re = new RegExp(dynamic ? source.split(REMEMBERED).join('') : source, flags)

  return {
    name,
    re,
    rules: compiled,
    default: state.default ?? null,
    dynamic: dynamic ? { source, flags, own: ownSources, cache: new Map() } : null,
    embed: state.embed
      ? {
          language: state.embed.language,
          until: new RegExp(normalizeLineTerminators(state.embed.until), `gm${caseFlag}`),
          holes: state.embed.holes ? new RegExp(normalizeLineTerminators(state.embed.holes), `gm${caseFlag}`) : null,
        }
      : null,
  }
}

/**
 * The merged regex of a dynamic state, and its per-rule sticky patterns, with
 * `value` spliced in wherever a rule wrote `REMEMBERED`. Built once per value.
 */
export const dynamicRegExps = (state: CompiledState, value: string): { re: RegExp; own: (RegExp | null)[] } => {
  const dyn = state.dynamic!
  let hit = dyn.cache.get(value)
  if (hit === undefined) {
    const literal = escapeRegExp(value)
    const fill = (src: string) => src.split(REMEMBERED).join(literal)
    const caseFlag = dyn.flags.includes('i') ? 'i' : ''
    hit = {
      re: new RegExp(fill(dyn.source), dyn.flags),
      own: dyn.own.map((src) => (src === null ? null : new RegExp(fill(src), `ymd${caseFlag}`))),
    }
    // A document with thousands of distinct heredoc markers should not grow
    // this without bound.
    if (dyn.cache.size > 64) {
      dyn.cache.clear()
    }
    dyn.cache.set(value, hit)
  }
  return hit
}

export const compile = (grammar: Grammar): CompiledGrammar => {
  if (!Object.hasOwn(grammar.states, 'root')) {
    throw new Error(`[${grammar.name}] grammar has no "root" state`)
  }
  // An embedding state pops itself once its body is done, and the root is
  // never popped.
  if (grammar.states.root?.embed) {
    throw new Error(`[${grammar.name}] the "root" state cannot embed another language`)
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

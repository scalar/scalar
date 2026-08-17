/**
 * Grammar authoring types.
 *
 * A grammar is a small state machine. Each state describes only the patterns
 * that are *interesting* in that state; anything the state does not match is
 * emitted with the state's `default` scope. That is what keeps grammars short:
 * a string state needs three rules (escape, interpolation, closing quote), not
 * a rule for "string content".
 */

/** A scope name from `SCOPES`, e.g. `'keyword.control'`. */
export type ScopeName = string

export interface Rule {
  /**
   * Pattern to match. Written without flags — the compiler merges every rule
   * in a state into one alternation, so flags are set per state.
   *
   * Backreferences (`\1`) are not supported: group numbers shift during the
   * merge. The compiler throws if it finds one.
   */
  match: string | RegExp

  /**
   * How to scope the match.
   *
   * - a string scopes the whole match
   * - an array scopes capture groups positionally (`[0]` is group 1); use
   *   `null` to leave a group unscoped
   * - omitted leaves the match with the state's `default` scope
   */
  scope?: ScopeName | (ScopeName | null)[]

  /** Scope for parts of the match not covered by capture groups. */
  rest?: ScopeName

  /** Push a state onto the stack. */
  push?: string
  /** Replace the current state (a push and a pop in one step). */
  set?: string
  /** Pop `n` states (`true` means 1). */
  pop?: number | true
}

/** Splices another state's rules in at this position, keeping priority order. */
export interface Include {
  include: string
}

export type StateRule = Rule | Include

export interface State {
  /** Scope applied to text no rule matched. `undefined` renders unstyled. */
  default?: ScopeName
  /** Compile this state's patterns case-insensitively. */
  ignoreCase?: boolean
  rules: StateRule[]
}

export interface Grammar {
  name: string
  aliases?: string[]
  /** Must contain a `root` state — tokenizing starts there. */
  states: Record<string, State>
}

export interface Token {
  /** `null` for text with no scope. */
  scope: ScopeName | null
  text: string
  start: number
  end: number
}

/** Streaming token sink. Ranges arrive in order and cover the input exactly. */
export type Emit = (scope: ScopeName | null, start: number, end: number) => void

// --- compiled forms (internal, but exported for tooling) --------------------

export interface CompiledRule {
  /** Scope for the whole match, when `scope` was a string. */
  scope: ScopeName | null
  /** Positional capture-group scopes, when `scope` was an array. */
  captures: (ScopeName | null)[] | null
  /**
   * This rule alone, sticky and with `hasIndices`, used to locate its capture
   * groups after the merged regex has already picked it.
   *
   * Asking the merged regex for indices would make every match in the state
   * pay to have offsets computed for every group of every rule; re-running one
   * small anchored pattern for the few rules that need offsets is far cheaper.
   */
  own: RegExp | null
  rest: ScopeName | null
  /** Index into the merged regex of this rule's wrapper group. */
  group: number
  push: string | null
  set: string | null
  pop: number
}

export interface CompiledState {
  name: string
  re: RegExp
  rules: CompiledRule[]
  default: ScopeName | null
}

export interface CompiledGrammar {
  name: string
  aliases: string[]
  states: Record<string, CompiledState>
  root: CompiledState
}

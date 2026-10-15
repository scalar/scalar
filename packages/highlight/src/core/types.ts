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

export type Rule = {
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

  /**
   * Remember the text of this capture group (1-based, within this rule's
   * pattern) for the state that `push` or `set` enters.
   *
   * That state's rules can then match it again by writing `REMEMBERED`
   * (`{{remembered}}`) in a pattern. It is the stand-in for a backreference
   * across rules: a heredoc remembers its terminator, a raw string the run of
   * quotes that opened it, a YAML block scalar the indentation of its key.
   *
   * A state entered without `remember` inherits the value of the state that
   * pushed it, so helper states nested inside keep seeing it.
   */
  remember?: number

  /**
   * `'text'` (the default) remembers the group verbatim. `'indent'` remembers
   * a run of spaces as wide as the group, which is what an indentation-based
   * end rule wants: `- key: |` remembers the column of `key`, not `- `.
   */
  rememberAs?: 'text' | 'indent'
}

/**
 * The placeholder a pattern uses to match the remembered text again. The text
 * is inserted escaped, so it matches literally.
 */
export const REMEMBERED = '{{remembered}}'

/** Splices another state's rules in at this position, keeping priority order. */
export type Include = {
  include: string
}

export type StateRule = Rule | Include

export type State = {
  /** Scope applied to text no rule matched. `undefined` renders unstyled. */
  default?: ScopeName
  /** Compile this state's patterns case-insensitively. */
  ignoreCase?: boolean
  /**
   * Highlight the body of this state with another registered language.
   *
   * When the state is entered, the text up to the first match of `until` (or
   * the end of the input) is tokenized with `language`, then the state pops.
   * `until` is not consumed, so the state below sees it: a `<script>` body
   * ends where `</script>` starts, and the HTML grammar scopes the tag.
   *
   * The language is looked up in the registry when the state is entered, so
   * embedding costs nothing until that language is registered. Without it,
   * the body is emitted with this state's `default` scope.
   *
   * `language` can be `REMEMBERED` (`{{remembered}}`) to use the text the rule
   * that entered the state remembered: a Markdown fence remembers its info
   * string and embeds whatever language it names.
   *
   * `holes` marks regions inside the body that belong to this grammar rather
   * than the embedded one, such as `<?= $x ?>` inside a PHP template's
   * `<script>`. The embedded language reads the body with each hole masked,
   * so its state carries across (a hole inside a JavaScript string leaves the
   * rest of the string a string), and each hole is tokenized with this
   * grammar from its root.
   */
  embed?: { language: string; until: string; holes?: string }
  rules: StateRule[]
}

export type Grammar = {
  name: string
  aliases?: string[]
  /** Must contain a `root` state — tokenizing starts there. */
  states: Record<string, State>
}

export type Token = {
  /** `null` for text with no scope. */
  scope: ScopeName | null
  text: string
  start: number
  end: number
}

/** Streaming token sink. Ranges arrive in order and cover the input exactly. */
export type Emit = (scope: ScopeName | null, start: number, end: number) => void

// --- compiled forms (internal, but exported for tooling) --------------------

export type CompiledRule = {
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
  /** Capture group to remember, as an offset from `group`; `0` for none. */
  remember: number
  rememberIndent: boolean
}

export type CompiledState = {
  name: string
  re: RegExp
  rules: CompiledRule[]
  default: ScopeName | null
  /**
   * Set when a rule uses `REMEMBERED`: the merged regex then depends on the
   * remembered text and is built per value, from these sources.
   */
  dynamic: {
    source: string
    flags: string
    /** Per-rule sticky sources for capture offsets, `null` where unused. */
    own: (string | null)[]
    cache: Map<string, { re: RegExp; own: (RegExp | null)[] }>
  } | null
  embed: { language: string; until: RegExp; holes: RegExp | null } | null
}

export type CompiledGrammar = {
  name: string
  aliases: string[]
  states: Record<string, CompiledState>
  root: CompiledState
}

import type { Grammar } from '../core/types'

/**
 * Dockerfile.
 *
 * A Dockerfile is two languages stacked on top of each other: a thin
 * line-oriented instruction format, and whatever the shell makes of the rest of
 * the line. The grammar is a state machine over that split:
 *
 * - an instruction keyword is only recognised at the start of a logical line,
 *   so the `run` in `RUN docker run …` stays a bare word
 * - a logical line ends at the first line break that is not preceded by a
 *   backslash, which is what keeps a continued `RUN` in its own state
 * - `${VAR:-default}` comes apart into braces, name, modifier and default
 * - `--mount=type=cache,target=…` reads as a flag with named parts rather than
 *   as one long argument
 * - the JSON exec form of `CMD`/`ENTRYPOINT` gets its brackets and commas
 *
 * What it deliberately does not model: shell builtins and command names inside
 * a `RUN` body are left unscoped, because a list of them would be a list of
 * every program in Debian.
 */

/**
 * The start of a logical line, plus the optional `ONBUILD` that can prefix any
 * instruction. The indent is left ungrouped so it falls through unscoped.
 */
const START = '^[ \\t]*(?:(ONBUILD)([ \\t]+))?'

/** Capture scopes for `START`, spread in front of each instruction's own. */
const START_SCOPES: (string | null)[] = ['keyword', null]

/** Instructions whose arguments need nothing beyond the generic shell body. */
const PLAIN = 'RUN|CMD|ENTRYPOINT|COPY|ADD|EXPOSE|USER|WORKDIR|VOLUME|SHELL|STOPSIGNAL|MAINTAINER'

const dockerfile: Grammar = {
  name: 'dockerfile',
  aliases: ['docker', 'containerfile'],
  states: {
    root: {
      // Instructions are uppercase by convention only — the parser accepts any
      // case, and `from … as build` turns up in hand-written files often enough
      // to be worth the flag.
      ignoreCase: true,
      rules: [
        // A parser directive is a comment to everything except the builder, so
        // the `#` keeps its comment colour and the setting reads as code.
        // Directives are only legal above the first instruction; one written
        // further down is an ordinary comment, and this grammar still lights it
        // up.
        {
          match: '^(#)([ \\t]*)(syntax|escape|check)(=)([^\\n]*)',
          scope: ['comment', null, 'keyword', 'operator', 'string'],
        },
        { match: '#[^\\n]*', scope: 'comment' },

        {
          match: `${START}(FROM)\\b`,
          scope: [...START_SCOPES, 'keyword.import'],
          push: 'from',
        },

        // The first name is captured here rather than in `env`, because
        // `ARG PORT` and the legacy `ENV TZ Etc/UTC` have no `=` to key off.
        // The whitespace is optional so a half-typed `ENV` on its own line is
        // still the instruction it is about to become — that is what an editor
        // asks for on every keystroke.
        {
          match: `${START}(ARG|ENV)\\b([ \\t]*)([A-Za-z_]\\w*)?`,
          scope: [...START_SCOPES, 'keyword.declaration', null, 'variable'],
          push: 'env',
        },
        {
          match: `${START}(LABEL)\\b([ \\t]*)([\\w.-]+)?`,
          scope: [...START_SCOPES, 'keyword.declaration', null, 'property'],
          push: 'label',
        },

        {
          match: `${START}(HEALTHCHECK)\\b`,
          scope: [...START_SCOPES, 'keyword'],
          push: 'healthcheck',
        },
        {
          match: `${START}(${PLAIN})\\b`,
          scope: [...START_SCOPES, 'keyword'],
          push: 'args',
        },
      ],
    },

    /**
     * The body of an instruction. Shell-shaped, and it lives exactly as long as
     * the logical line: every state that highlights arguments ends up here.
     */
    args: {
      rules: [
        // Before the redirection operator, or `<<EOF` reads as two `<`.
        {
          match: '(<<-?)([\'"]?)([A-Za-z_]\\w*)([\'"]?)',
          scope: ['operator', 'string', 'string.special', 'string'],
          push: 'heredoc-head',
        },

        // `--from=` names a build stage declared by a `FROM … AS <name>`
        // above, which makes it the one flag value worth colouring. A `$`
        // value falls through to the generic flag rule below. It takes the same
        // leading space as that rule, or the shorter match would start one
        // column later and lose.
        {
          match: '(?:^|[ \\t])(--from)(=)([\\w.-]+)',
          scope: ['constant', 'operator', 'type'],
        },
        // A flag opens a word, and the space or line start that proves it is
        // consumed rather than looked behind at — a lookbehind anywhere in a
        // state costs JavaScriptCore twenty times the throughput of that whole
        // state. `\B` was the cheaper stand-in until it turned out to hold
        // after every non-word character, so `--opt=-value` and `${X}-y` came
        // out as flags; only whitespace and the line start may precede one.
        { match: '(?:^|[ \\t])(--?[A-Za-z][\\w-]*)', scope: ['constant'] },
        // The named parts of a compound flag value: `type=cache,target=/x`.
        // Two rules, because the separator has to be consumed to anchor the
        // name and `,` and `=` do not read the same way.
        {
          match: '(=)([\\w.-]+)(?==)',
          scope: ['operator', 'variable.parameter'],
        },
        {
          match: '(,)([\\w.-]+)(?==)',
          scope: ['punctuation.delimiter', 'variable.parameter'],
        },

        // A trailing backslash continues the logical line, so it must be eaten
        // before the `$` rule at the bottom can end the instruction.
        { match: '\\\\\\r?\\n', scope: 'operator' },
        // `\$HOME` reaches the shell as a literal, so the escape has to win
        // over the expansion rules.
        { match: '\\\\[\\\\$"\'`]', scope: 'string.escape' },

        { include: 'expansion' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },

        // Comments are legal between the lines of a continued instruction, and
        // the shell strips one from the tail of a `RUN`.
        { match: '(?:^|[ \\t])#[^\\n]*', scope: 'comment' },

        // Ports, uids and `--interval=30s` durations. A number is only one when
        // it starts a word, and the character that proves it is consumed rather
        // than looked behind at — which is why there are two rules: whitespace
        // and `:` carry no scope of their own, an operator does. Everything a
        // version or a path is built from is missing from both, so the `3` of
        // `python3.11` and the `04` of `18.04` stay part of their word.
        {
          match: '(?:^|[ \\t:])(\\d+)(ms|[smh])?(?![\\w.-])',
          scope: ['number', 'unit'],
        },
        {
          match: '([;=&<>|])(\\d+)(ms|[smh])?(?![\\w.-])',
          scope: ['operator', 'number', 'unit'],
        },

        { match: '&&|\\|\\|?|>>?|[;=&<]', scope: 'operator' },
        // `[` and `]` are the JSON exec form of CMD, ENTRYPOINT, SHELL and
        // VOLUME; `{` and `}` turn up in `find -exec` and awk programs.
        { match: '[[\\]{}]', scope: 'punctuation.bracket' },
        { match: ',', scope: 'punctuation.delimiter' },

        // The instruction is over. Zero width, so `root` still sees the break.
        { match: '$', pop: true },
      ],
    },

    /**
     * `FROM [--platform=…] <image> [AS <stage>]`.
     *
     * Case-insensitivity is spelled into the two words that need it rather than
     * set on the state: `ignoreCase` also applies to every rule `args` brings
     * in, and `--interval=30S` splitting into a number and a unit while
     * `EXPOSE 30S` does not is a difference nobody asked for.
     */
    from: {
      rules: [
        // `AS` binds a stage name that `COPY --from=` and a later `FROM` refer
        // to, so it is scoped the same way as the flag value that names it.
        {
          match: '(?:^|[ \\t])([Aa][Ss])([ \\t]+)([\\w.-]+)',
          scope: ['keyword.operator', null, 'type'],
        },
        // The image reference is a state, not a pattern: `node:${TAG}-alpine`
        // is one reference with an expansion in the middle of it, and only a
        // state carries the string colour across the braces. A reference may
        // also start with the expansion — `${REGISTRY}/node:18` — so `$` opens
        // one; a flag never does, which is all `(?!--)` is left to say.
        // Zero width, so `image` sees the reference from its first character.
        { match: '(?:^|[ \\t])(?!--)(?=[\\w.:/@$-])', push: 'image' },
        { include: 'args' },
      ],
    },

    /** One image reference: text, and any expansion written inside it. */
    image: {
      default: 'string',
      rules: [
        // The reference ends at whitespace; the break itself is left for `args`
        // to end the instruction on.
        { match: '(?=\\s)', pop: true },
        { include: 'expansion' },
      ],
    },

    /** `ENV`/`ARG`: every `NAME=` after the first one the root rule caught. */
    env: {
      rules: [
        // The preceding space is consumed, so an `=` inside a value cannot
        // start a second name.
        { match: '(?:^|[ \\t])([A-Za-z_]\\w*)(?==)', scope: ['variable'] },
        { include: 'args' },
      ],
    },

    /** `LABEL`: same shape as `env`, but the keys are dotted namespaced names. */
    label: {
      rules: [{ match: '(?:^|[ \\t])([\\w.-]+)(?==)', scope: ['property'] }, { include: 'args' }],
    },

    /**
     * `HEALTHCHECK` is the one instruction that carries another one.
     *
     * The word is its first argument and nothing else: handing the rest of the
     * line to `args` is what keeps the `cmd` of `… || cmd` and a literal `none`
     * from being read as a second one. Taking the space in front of it leaves
     * the `/cmd` of a probe URL alone.
     */
    healthcheck: {
      rules: [
        {
          match: '(?:^|[ \\t])([Cc][Mm][Dd])\\b',
          scope: ['keyword'],
          set: 'args',
        },
        {
          match: '(?:^|[ \\t])([Nn][Oo][Nn][Ee])\\b',
          scope: ['constant.builtin'],
          set: 'args',
        },
        { include: 'args' },
      ],
    },

    // ---- expansions ---------------------------------------------------------
    expansion: {
      rules: [
        { match: '\\$\\{', scope: 'interpolation', push: 'expansion-brace' },
        { match: '\\$[A-Za-z_]\\w*', scope: 'variable' },
      ],
    },

    'expansion-brace': {
      default: 'variable',
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        // Everything past a modifier is a value, not more of the name.
        {
          match: ':[-+?]|#{1,2}|%{1,2}',
          scope: 'operator',
          push: 'expansion-value',
        },
        // An expansion never spans a line, so a stray `${` cannot colour the
        // rest of the file.
        { match: '$', pop: true },
      ],
    },

    /** The `latest` of `${TAG:-latest}` — text, and possibly another expansion. */
    'expansion-value': {
      default: 'string',
      rules: [{ match: '(?=\\})', pop: true }, { include: 'expansion' }, { match: '$', pop: true }],
    },

    // ---- strings ------------------------------------------------------------
    'string-double': {
      default: 'string',
      rules: [
        // A quoted argument can still be continued onto the next line.
        { match: '\\\\\\r?\\n', scope: 'operator' },
        { match: '\\\\.', scope: 'string.escape' },
        { include: 'expansion' },
        { match: '"', scope: 'string', pop: true },
        // Only a continuation carries a quote across a break, so an
        // unterminated one ends with the line instead of the file.
        { match: '$', pop: true },
      ],
    },

    // Single quotes are literal to the shell, so neither escapes nor expansions
    // apply — only the line continuation the Dockerfile parser handles first.
    'string-single': {
      default: 'string',
      rules: [
        { match: '\\\\\\r?\\n', scope: 'operator' },
        { match: "'", scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    // ---- heredocs -----------------------------------------------------------
    /**
     * The tail of the line that opened a heredoc: `COPY <<EOT /etc/motd` still
     * has a destination on it. The body only starts at the break, so the break
     * is what switches states.
     */
    'heredoc-head': {
      rules: [{ match: '\\r?\\n', set: 'heredoc' }, { include: 'args' }],
    },

    heredoc: {
      default: 'string',
      rules: [
        // Matching the terminator the opener named would need a backreference,
        // which the compiler rejects, so any line holding a single bare word
        // ends the body — a lone `done` inside a shell loop ends it early.
        // Popping two states lands back in `root`: a heredoc is always the last
        // thing on its logical line.
        {
          match: '^[ \\t]*[A-Za-z_]\\w*[ \\t]*$',
          scope: 'string.special',
          pop: 2,
        },
        // Expansions are live unless the opener quoted the terminator, which is
        // the same thing a backreference would be needed to know.
        { include: 'expansion' },
      ],
    },
  },
}

export default dockerfile

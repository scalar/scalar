import type { Grammar } from '../core/types'

/**
 * GNU Make.
 *
 * Two characters carry almost all of the meaning in a Makefile, and both are
 * badly overloaded:
 *
 * - `:` separates a target from its prerequisites, but `:=`, `::=` and `:::=`
 *   are assignments and `$(SRCS:.c=.o)` is a substitution reference.
 *   Assignments are matched first, and a rule line is entered through a
 *   lookahead that only fires when a bare `:` really does arrive before any
 *   `=` or `#`.
 * - `$` introduces an automatic variable (`$@`), a reference (`$(CC)`), a
 *   function call (`$(shell …)`) or its own escape (`$$`). All four live in one
 *   shared `common` state so every context — recipe, prerequisite list, `define`
 *   body, nested argument — expands identically.
 *
 * Recipe lines are shell, so the leading tab pushes a state that is left again
 * at the end of the line.
 *
 * Where it is knowingly wrong: make strips backslash-newline before deciding
 * what a line is, and this tokenizer does not. A continuation is consumed
 * together with the next line's indentation, which keeps a tab-indented
 * continuation of a variable value from reading as a recipe, but a continued
 * line that itself looks like an assignment or a rule is still scoped as one.
 * That is the ordinary-code reading; code written to defeat it renders wrong
 * rather than dangerously.
 */

/**
 * Variable and target names. The length cap matters: the rules using it are
 * line-anchored scans that end in a required character, and an uncapped scan
 * re-reads the whole line before failing on a line that never supplies it.
 */
const NAME = '[A-Za-z_.][\\w.-]{0,120}'

/**
 * Make's builtin functions.
 *
 * Ordered so that a name which is a prefix of another comes second
 * (`filter-out` before `filter`, `wordlist` before `word`) — the trailing
 * lookahead would backtrack into the longer branch anyway, but relying on that
 * makes the list fragile to edit.
 */
const FUNCTION =
  'abspath|addprefix|addsuffix|and|basename|call|dir|error|eval|file|filter-out|filter|findstring|firstword|flavor|foreach|info|if|join|lastword|notdir|origin|or|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|wordlist|words|word'

/** `$@ $< $^ $* $? $% $+ $|` — the automatic variables, minus `$$`. */
const AUTO = '[@<^*?%+|]'

const makefile: Grammar = {
  name: 'makefile',
  aliases: ['make', 'mk', 'bsdmake'],
  states: {
    root: {
      rules: [
        // A leading tab is what makes a line a recipe, whatever it holds, so
        // this outranks every other line-shaped rule. `@`, `-` and `+` are
        // make's prefixes rather than part of the command.
        {
          match: '^(\\t[ \\t]*)([-@+]*)',
          scope: [null, 'operator'],
          push: 'recipe',
        },

        { match: '#[^\\n]*', scope: 'comment' },

        // Assignments outrank every other line shape, and not only because
        // `:=`, `::=` and `:::=` open with the character that otherwise means
        // "target": a variable is allowed to be called `ifeq`, and going first
        // is what stops `ifeq ?= yes` from reading as a conditional. Nothing
        // below loses out, because a directive never carries an operator
        // directly after its first word. `export`/`override` are folded in so
        // `export CFLAGS += -g` still scopes the variable it assigns to.
        {
          match: `^([ \\t]*)(?:(export|override|private|unexport)([ \\t]+))?(${NAME})([ \\t]*)(:{1,3}=|[+?!]?=)`,
          scope: [null, 'keyword', null, 'variable', null, 'operator'],
        },

        // `else ifeq` is one directive, not two. The guard keeps a target that
        // happens to be called `ifeq:` out of the keyword rules.
        {
          match: '^[ \\t]*(?:else[ \\t]+)?ifn?eq\\b(?![ \\t]*:)',
          scope: 'keyword.control',
          push: 'condition',
        },
        {
          match: '^[ \\t]*(?:else[ \\t]+)?(?:ifn?def|else|endif)\\b(?![ \\t]*:)',
          scope: 'keyword.control',
        },
        // The same `(?![ \t]*:)` guard as the conditionals: `include` is an
        // ordinary word, and `include: build` is a rule with a target called
        // `include` rather than a directive.
        {
          match: '^[ \\t]*[-s]?include\\b(?![ \\t]*:)',
          scope: 'keyword.import',
        },

        // A `define` body needs a state rather than a backreference: the
        // terminator is always the literal word `endef`, so nothing has to
        // remember the variable's name.
        {
          match: `^([ \\t]*)(define)([ \\t]+)(${NAME})`,
          scope: [null, 'keyword.declaration', null, 'variable'],
          push: 'define',
        },

        // The same directives standing alone, without an assignment after them,
        // and guarded the same way: any of these is a legal target name.
        {
          match: '^[ \\t]*(?:unexport|override|export|private|undefine|vpath)\\b(?![ \\t]*:)',
          scope: 'keyword',
        },

        // A rule line, recognised by a `:` reached before any `=` or `#`. The
        // match is zero-width so the `target` state owns the name itself and
        // `$(BUILD)/%.o` keeps expanding inside it. The line anchor means the
        // lookahead runs once per line rather than once per column, and the cap
        // bounds that one run so a pathologically long line cannot pay for it.
        { match: '^(?=[ \\t]*[^\\s:#=][^:#=\\n]{0,120}:)', push: 'target' },

        { include: 'common' },
      ],
    },

    /**
     * The target side of a rule line. Everything unmatched is the target name,
     * which is why `$(BIN)` and `%` can be pulled out of it by rule.
     */
    target: {
      default: 'function',
      rules: [
        // `.PHONY`, `.SUFFIXES`, … — make's own targets, which are never
        // indented, so the line anchor is enough to tell them from a file
        // called `.hidden`.
        { match: '^\\.[A-Z][A-Z_]+', scope: 'function.builtin' },
        // The stem of a pattern rule, not a character of the name.
        { match: '%', scope: 'operator' },
        { match: '::?', scope: 'punctuation.delimiter', set: 'prereqs' },
        { include: 'common' },
        // Only a continuation extends a rule line, and `common` has already
        // consumed those by the time this is reached.
        { match: '$', pop: true },
      ],
    },

    prereqs: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },
        // `%` is the pattern stem; `|` opens the order-only prerequisites.
        { match: '[%|]', scope: 'operator' },
        // `target: deps ; cmd` puts the recipe on the rule line itself.
        { match: ';', scope: 'punctuation.delimiter', set: 'recipe' },
        { include: 'common' },
        { match: '$', pop: true },
      ],
    },

    /** `ifeq (a,b)` — scoped so the argument brackets read as brackets. */
    condition: {
      rules: [
        // The state holds to the end of the line, so a trailing comment never
        // reaches root's rule and has to be recognised here.
        { match: '#[^\\n]*', scope: 'comment' },
        { match: '[()]', scope: 'punctuation.bracket' },
        { match: ',', scope: 'punctuation.delimiter' },
        { include: 'common' },
        { match: '$', pop: true },
      ],
    },

    recipe: {
      rules: [
        // The shell's comment rather than make's: `#` only opens one at the
        // start of a word, so `url#frag` stays intact.
        { match: '(?:^|[ \\t])#[^\\n]*', scope: 'comment' },
        { include: 'common' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '$', pop: true },
      ],
    },

    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\[\\\\$`"]', scope: 'string.escape' },
        { include: 'common' },
        { match: '"', scope: 'string', pop: true },
        // An unterminated quote stops at the line break instead of swallowing
        // the rest of the file.
        { match: '$', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      // The shell keeps single quotes literal, but make expands `$(…)` inside
      // them before the shell ever sees the line, so `common` still applies.
      rules: [{ include: 'common' }, { match: "'", scope: 'string', pop: true }, { match: '$', pop: true }],
    },

    define: {
      rules: [
        { match: '^[ \\t]*endef\\b', scope: 'keyword.declaration', pop: true },
        { match: '#[^\\n]*', scope: 'comment' },
        { include: 'common' },
      ],
    },

    /** Everything `$` can start, plus the line continuation. Shared by every state. */
    common: {
      rules: [
        // `$$` is make's escape for a literal `$`, so it has to outrank `$(`.
        { match: '\\$\\$', scope: 'string.escape' },
        // `$(@D)`, `$(<F)` — the directory and file halves of an automatic
        // variable, which would otherwise read as a one-letter reference.
        { match: `\\$[({]${AUTO}[DF][)}]`, scope: 'variable.builtin' },
        { match: `\\$${AUTO}`, scope: 'variable.builtin' },

        // Make requires whitespace between a function name and its first
        // argument, and that is the whole difference between `$(shell cmd)` and
        // a variable named `$(shellcheck)`.
        {
          match: `(\\$\\()(${FUNCTION})(?=[ \\t])`,
          scope: ['punctuation.bracket', 'function.builtin'],
          push: 'args-paren',
        },
        {
          match: `(\\$\\{)(${FUNCTION})(?=[ \\t])`,
          scope: ['punctuation.bracket', 'function.builtin'],
          push: 'args-brace',
        },

        // Paren and brace forms get their own states because make requires the
        // delimiters to match and a backreference cannot be used to say so.
        { match: '\\$\\(', scope: 'variable', push: 'ref-paren' },
        { match: '\\$\\{', scope: 'variable', push: 'ref-brace' },
        // `$X` — a one-character reference needs no brackets at all.
        { match: '\\$[A-Za-z_]', scope: 'variable' },

        // The next line's indentation is swallowed with the continuation so a
        // tab-indented continued value is not mistaken for a recipe. Every
        // line-shaped state pops on `$`, which sits after this position, so
        // leftmost-match ordering lets the continuation win.
        { match: '(\\\\\\r?\\n)[ \\t]*', scope: ['operator'] },
      ],
    },

    'ref-paren': {
      default: 'variable',
      rules: [
        { match: '\\)', scope: 'variable', pop: true },
        // `$(SRCS:.c=.o)` — a substitution reference.
        { match: '[:=%]', scope: 'operator' },
        { include: 'common' },
        { match: '$', pop: true },
      ],
    },
    'ref-brace': {
      default: 'variable',
      rules: [
        { match: '\\}', scope: 'variable', pop: true },
        { match: '[:=%]', scope: 'operator' },
        { include: 'common' },
        { match: '$', pop: true },
      ],
    },

    // Function arguments are ordinary text — paths, patterns, shell commands —
    // so they carry no default scope, only the separators that structure them.
    'args-paren': {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { match: ',', scope: 'punctuation.delimiter' },
        { match: '%', scope: 'operator' },
        { include: 'common' },
        { match: '$', pop: true },
      ],
    },
    'args-brace': {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: ',', scope: 'punctuation.delimiter' },
        { match: '%', scope: 'operator' },
        { include: 'common' },
        { match: '$', pop: true },
      ],
    },
  },
}

export default makefile

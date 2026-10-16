import type { Grammar } from '../core/types'

/**
 * Bash, sh and zsh.
 *
 * Shell scripts read badly when everything after the command name is one
 * color. This separates the command from its flags, expands `$VAR`, `${...}`
 * and `$(...)` inside double quotes, and leaves single-quoted strings literal
 * the way the shell does.
 */
const VAR = '\\$(?:[A-Za-z_]\\w*|[0-9!@#?*$-])'

/**
 * Where a command name can stand: at the start of a line that does not
 * continue the one before it, after a prompt, after a pipe, list operator or
 * subshell opener, and after the keywords and wrappers that run a command.
 */
const BEFORE_COMMAND =
  '(?:^(?<!\\\\\\r?\\n)(?:[ \\t]*\\$(?=[ \\t]))?|[|&;(`{]|\\$\\(|\\b(?:then|do|else|elif|sudo|time|exec|xargs|nohup|env)\\b|!)'

const bash: Grammar = {
  name: 'bash',
  aliases: ['sh', 'shell', 'zsh', 'console'],
  states: {
    root: {
      rules: [
        { match: '^#!.*', scope: 'comment' },
        { match: '(?:^|[ \\t])#[^\\n]*', scope: 'comment' },

        { include: 'expansion' },
        // An escaped character outside quotes is literal. It has to come
        // before the quote rules: `'it'\\''s'` is how a single quote is written
        // inside a single-quoted string — close, escaped quote, reopen — and
        // reading that `\\'` as the start of a string inverts the rest of the
        // line. snippetz writes it for every curl body with an apostrophe.
        // A backslash before a newline is a line continuation, left unscoped.
        { match: '\\\\[^\\r\\n]', scope: 'string.escape' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: "\\$'", scope: 'string', push: 'string-ansi' },
        { match: '`', scope: 'string', push: 'backtick' },

        // Heredocs: the body is scoped as a string up to a line holding only
        // the remembered terminator. A quoted marker (`<<'EOF'`) turns
        // expansion off, so `$HOME` in its body is text.
        {
          match: '(<<-?)([ \\t]*)([\'"])([A-Za-z_]\\w*)([\'"])',
          scope: ['operator', null, 'string', 'string.special', 'string'],
          push: 'heredoc-literal',
          remember: 4,
        },
        {
          match: '(<<-?)([ \\t]*)([A-Za-z_]\\w*)',
          scope: ['operator', null, 'string.special'],
          push: 'heredoc',
          remember: 3,
        },

        {
          match: '\\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|select|break|continue|return|exit)\\b',
          scope: 'keyword.control',
        },
        // The name a declaration sets gets a state of its own, so the argument
        // rule below cannot read `API_KEY=…` in `export API_KEY=…` as a string.
        {
          match: '\\b(?:local|declare|typeset|readonly|export)\\b',
          scope: 'keyword.declaration',
          push: 'declared-name',
        },
        { match: '\\b(?:function|alias|unset)\\b', scope: 'keyword.declaration' },
        { match: '\\b(?:in|then)\\b', scope: 'keyword.operator' },
        {
          match:
            '\\b(?:echo|printf|read|cd|pwd|source|eval|exec|test|trap|set|shift|wait|kill|jobs|getopts|command|type|hash|umask|ulimit)\\b',
          scope: 'function.builtin',
        },

        // The command itself: `curl`, `./build.sh`, `/usr/bin/env`. Keywords
        // and builtins start at the same position and come first, so they keep
        // their own scopes. The lookbehind sits after the first character so
        // the rule still starts with a literal class, which keeps the engine's
        // first-character scan.
        {
          match: `[A-Za-z_./~](?<=${BEFORE_COMMAND}[ \\t]*[A-Za-z_./~])[\\w./~+-]{0,128}(?=[ \\t]|$|[;|&)\`])`,
          scope: 'function.call',
        },

        {
          match: '^([ \\t]*)([A-Za-z_]\\w*)(\\s*)(\\(\\))',
          scope: [null, 'function', null, 'punctuation.bracket'],
        },
        { match: '^([ \\t]*)([A-Za-z_]\\w*)(?==)', scope: [null, 'variable'] },

        // Flags are a large share of a shell line and benefit from their own color.
        { match: '(?:^|\\s)(--?[A-Za-z][\\w-]*)', scope: ['constant'] },

        { match: '\\b\\d+\\b', scope: 'number' },
        // An unquoted argument is a string to the shell, and themes colour it
        // like one. Command names, keywords and flags start at the same place
        // and come first.
        { match: '[^\\s$\'"`\\\\|&;()<>{}\\[\\]#=-][^\\s$\'"`\\\\|&;()<>{}]{0,256}', scope: 'string' },
        // `/` is left out: at the top level it is almost always a path
        // separator, and coloring every path segment boundary is noise.
        { match: '&&|\\|\\||[|&;]|[<>]{1,2}|[-+*%!=]=?|=~', scope: 'operator' },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
      ],
    },

    /** After `export`, `local` and the like: flags, then the one name it sets. */
    'declared-name': {
      rules: [
        { match: '(?:^|\\s)(--?[A-Za-z][\\w-]*)', scope: ['constant'] },
        { match: '[A-Za-z_]\\w*', scope: 'variable', pop: true },
        { match: '(?=[^ \\t])', pop: true },
      ],
    },

    expansion: {
      rules: [
        { match: '\\$\\{', scope: 'variable', push: 'brace-expansion' },
        { match: '\\$\\(\\(', scope: 'operator', push: 'arithmetic' },
        { match: '\\$\\(', scope: 'operator', push: 'subshell' },
        { match: VAR, scope: 'variable' },
      ],
    },

    'brace-expansion': {
      default: 'variable',
      rules: [
        { match: '\\}', scope: 'variable', pop: true },
        { match: '[:#%/^,!*@-]+', scope: 'operator' },
      ],
    },
    arithmetic: {
      rules: [
        { match: '\\)\\)', scope: 'operator', pop: true },
        { include: 'expansion' },
        { match: '\\b\\d+\\b', scope: 'number' },
        { match: '[-+*/%<>=!&|^]+', scope: 'operator' },
      ],
    },
    subshell: {
      rules: [{ match: '\\)', scope: 'operator', pop: true }, { include: 'root' }],
    },

    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\(?:[\\\\$`"\\n]|\\r\\n)', scope: 'string.escape' },
        { include: 'expansion' },
        { match: '`', scope: 'string', push: 'backtick' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [{ match: "'", scope: 'string', pop: true }],
    },
    'string-ansi': {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[0-7]{1,3}|.)',
          scope: 'string.escape',
        },
        { match: "'", scope: 'string', pop: true },
      ],
    },
    backtick: {
      rules: [{ match: '`', scope: 'string', pop: true }, { include: 'root' }],
    },
    heredoc: {
      default: 'string',
      rules: [{ include: 'heredoc-end' }, { include: 'expansion' }],
    },
    'heredoc-literal': {
      default: 'string',
      rules: [{ include: 'heredoc-end' }],
    },
    'heredoc-end': {
      // `<<-` lets the terminator be indented with tabs; allowing any indent
      // costs nothing and also covers bodies pasted with spaces.
      rules: [{ match: '^[ \\t]*{{remembered}}[ \\t]*$', scope: 'string.special', pop: true }],
    },
  },
}

export default bash

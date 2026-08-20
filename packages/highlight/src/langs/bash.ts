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

const bash: Grammar = {
  name: 'bash',
  aliases: ['sh', 'shell', 'zsh', 'console'],
  states: {
    root: {
      rules: [
        { match: '^#!.*', scope: 'comment' },
        { match: '(?:^|[ \\t])#[^\\n]*', scope: 'comment' },

        { include: 'expansion' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: "\\$'", scope: 'string', push: 'string-ansi' },
        { match: '`', scope: 'string', push: 'backtick' },

        // Heredocs: the body is scoped as a string up to a line holding only
        // the terminator. The terminator name is not tracked (that needs a
        // backreference), so an inner line equal to another terminator ends it.
        {
          match: '(<<-?)(\\s*)([\'"]?)([A-Za-z_]\\w*)([\'"]?)',
          scope: ['operator', null, 'string', 'string.special', 'string'],
          push: 'heredoc',
        },

        {
          match: '\\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|select|break|continue|return|exit)\\b',
          scope: 'keyword.control',
        },
        {
          match: '\\b(?:function|local|declare|typeset|readonly|export|alias|unset)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:in|then)\\b', scope: 'keyword.operator' },
        {
          match:
            '\\b(?:echo|printf|read|cd|pwd|source|eval|exec|test|trap|set|shift|wait|kill|jobs|getopts|command|type|hash|umask|ulimit)\\b',
          scope: 'function.builtin',
        },

        {
          match: '^([ \\t]*)([A-Za-z_]\\w*)(\\s*)(\\(\\))',
          scope: [null, 'function', null, 'punctuation.bracket'],
        },
        { match: '^([ \\t]*)([A-Za-z_]\\w*)(?==)', scope: [null, 'variable'] },

        // Flags are a large share of a shell line and benefit from their own color.
        { match: '(?:^|\\s)(--?[A-Za-z][\\w-]*)', scope: ['constant'] },

        { match: '\\b\\d+\\b', scope: 'number' },
        // `/` is left out: at the top level it is almost always a path
        // separator, and coloring every path segment boundary is noise.
        { match: '&&|\\|\\||[|&;]|[<>]{1,2}|[-+*%!=]=?|=~', scope: 'operator' },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
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
        { match: '\\\\[\\\\$`"\\n]', scope: 'string.escape' },
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
      rules: [
        {
          match: '^[ \\t]*[A-Za-z_]\\w*[ \\t]*$',
          scope: 'string.special',
          pop: true,
        },
        { include: 'expansion' },
      ],
    },
  },
}

export default bash

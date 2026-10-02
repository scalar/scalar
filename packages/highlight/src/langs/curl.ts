import type { Grammar } from '../core/types'

/**
 * cURL command lines.
 *
 * A curl invocation is a shell command, but reading one is nothing like
 * reading a shell script: what matters is the request method and which flag
 * carries which value, not control flow. `@scalar/code-highlight` shipped a
 * bespoke curl grammar for that reason and `code.css` styles
 * `.hljs.language-curl` to match it, so this mirrors that scoping rather than
 * deferring to bash — which leaves `curl` and the method word unscoped.
 */

/** The methods `--request` and `-X` accept. Matched case-insensitively. */
const METHODS = 'get|post|put|patch|delete|head|options|trace|connect'

const curl: Grammar = {
  name: 'curl',
  states: {
    root: {
      // curl itself does not care about the case of a method, and neither did
      // the grammar this replaces.
      ignoreCase: true,
      rules: [
        { match: '\\bcurl\\b', scope: 'keyword' },

        // The method is the most useful token on the line, so it carries its
        // own scope instead of blending into the flag that introduces it.
        {
          match: `(^|\\s)(--request|-X)(\\s+)(${METHODS})\\b`,
          scope: [null, 'constant.builtin', null, 'symbol'],
        },

        // Anchored to a boundary so the hyphens inside a URL or a header name
        // are not mistaken for flags.
        { match: '(^|\\s)(--[A-Za-z][\\w-]*)', scope: [null, 'constant.builtin'] },
        { match: '(^|\\s)(-[A-Za-z])(?![\\w-])', scope: [null, 'constant.builtin'] },

        // Ahead of the opening-quote rule: an escaped quote is content, not a
        // string boundary.
        { match: '\\\\"', scope: 'string' },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },

        { match: '\\b\\d+(?:\\.\\d+)?\\b', scope: 'number' },
      ],
    },

    'string-double': {
      default: 'string',
      rules: [
        { match: '\\\\.', scope: 'string.escape' },
        // `$(...)` runs a command, so it reads as a value rather than text.
        { match: '\\$\\(', scope: 'variable', push: 'subshell' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
    subshell: {
      default: 'variable',
      rules: [{ match: '\\)', scope: 'variable', pop: true }],
    },

    // Single quotes are literal in the shell, so nothing expands inside them.
    'string-single': {
      default: 'string',
      rules: [{ match: "'", scope: 'string', pop: true }],
    },
  },
}

export default curl

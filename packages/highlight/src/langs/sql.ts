import type { Grammar } from '../core/types'

/** SQL, in a dialect-agnostic form. */
const sql: Grammar = {
  name: 'sql',
  aliases: ['postgres', 'postgresql', 'mysql', 'sqlite'],
  states: {
    root: {
      ignoreCase: true,
      rules: [
        { match: '--[^\\n]*', scope: 'comment' },
        { match: '#[^\\n]*', scope: 'comment' },
        { match: '/\\*[\\s\\S]*?\\*/', scope: 'comment' },

        // Doubled quotes are the escape, so a literal never ends early.
        { match: "'(?:[^']|'')*'", scope: 'string' },
        { match: '"(?:[^"]|"")*"', scope: 'variable.member' },
        { match: '`[^`]*`', scope: 'variable.member' },
        // `[` is excluded as well as `]`: a bracketed identifier cannot nest,
        // and allowing a bare `[` makes a line of brackets cost O(n) each.
        { match: '\\[[^[\\]]*\\]', scope: 'variable.member' },

        {
          match:
            '\\b(?:select|from|where|group|by|order|having|limit|offset|join|inner|left|right|full|outer|cross|lateral|on|using|union|intersect|except|with|recursive|case|when|then|else|end|distinct|returning|fetch|next|rows?|only)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:insert|into|values|update|set|delete|create|alter|drop|truncate|table|view|index|sequence|schema|database|function|procedure|trigger|constraint|primary|foreign|key|references|unique|check|default|cascade|column|add|rename|grant|revoke|begin|commit|rollback|transaction|explain|analyze|vacuum|copy|temporary|temp|if|exists|replace|materialized)\\b',
          scope: 'keyword.declaration',
        },
        {
          match: '\\b(?:and|or|not|in|is|like|ilike|between|exists|any|all|some|as|asc|desc|nulls|first|last)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:null)\\b', scope: 'constant.builtin' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        {
          match:
            '\\b(?:int|integer|bigint|smallint|serial|bigserial|decimal|numeric|real|double|precision|float|money|char|varchar|text|bytea|timestamp|timestamptz|date|time|interval|boolean|bool|uuid|json|jsonb|array|enum|blob)\\b',
          scope: 'type.builtin',
        },
        {
          match:
            '\\b(?:count|sum|avg|min|max|coalesce|nullif|cast|greatest|least|now|current_date|current_timestamp|extract|date_trunc|concat|substring|trim|upper|lower|length|round|abs|row_number|rank|dense_rank|lag|lead|over|partition|array_agg|string_agg|json_build_object|generate_series)\\b',
          scope: 'function.builtin',
        },

        { match: '\\b[A-Za-z_]\\w*(?=\\s*\\()', scope: 'function.call' },
        { match: '\\b\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?\\b', scope: 'number' },
        { match: '\\$\\d+|[:@][A-Za-z_]\\w*|\\?', scope: 'variable' },

        // Table, column and correlation names are deliberately left at the
        // block foreground, the same as the quoted identifiers above and the
        // same as `variable` everywhere else in the vocabulary. Scoping them
        // reads better against shiki's coverage but is worse in practice: it
        // paints most of a statement, and `@scalar/code-highlight` renders
        // them muted, so colouring them here would break the compat floor.

        { match: '::|<>|!=|>=|<=|\\|\\||[-+*/%<>=]', scope: 'operator' },
        { match: '[()]', scope: 'punctuation.bracket' },
        { match: '[,;.]', scope: 'punctuation.delimiter' },
      ],
    },
  },
}

export default sql

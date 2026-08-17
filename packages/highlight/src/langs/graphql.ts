import type { Grammar } from '../core/types'

/**
 * GraphQL — SDL schemas and executable documents in one grammar.
 *
 * Both halves of the language reuse the same shapes, so most of the work here
 * is telling them apart without a parser:
 *
 * - a name followed by `:` names an output key — an SDL field or a query alias
 *   — and reads as a property, while the field an alias selects stays plain.
 *   That makes the alias the one token in a selection set that stands out,
 *   which is exactly the part a reader has to notice.
 * - argument names live in their own state, so `episode` in `hero(episode: $ep)`
 *   is a parameter and `hero` is not.
 * - a string that starts a line is a description. Every string *value* in the
 *   language sits inside an argument list, so outside one a leading quote can
 *   only be documentation.
 *
 * Two things are recognised by convention rather than by syntax, because
 * GraphQL puts none on them: PascalCase is a type and SCREAMING_CASE is an enum
 * value or a directive location. A lowercase type name renders plain, and a
 * field spelled `type`, `query` or `mutation` reads as the keyword when it is
 * followed by a name or a selection set — the shapes are genuinely identical.
 */

/** A GraphQL Name. The spec limits these to ASCII, so `\w` would be too wide. */
const NAME = '[_A-Za-z][_0-9A-Za-z]*'

const graphql: Grammar = {
  name: 'graphql',
  aliases: ['gql'],
  states: {
    root: {
      rules: [
        // Descriptions are reachable from `root` only. An argument list is the
        // one place a string value can begin a line, and that runs in `args`.
        {
          match: '(^[ \\t]*)(""")',
          scope: [null, 'comment.doc'],
          push: 'description',
        },
        {
          match: '(^[ \\t]*)("(?:[^"\\\\\\n]|\\\\.)*")',
          scope: [null, 'comment.doc'],
        },
        { include: 'common' },
      ],
    },

    /**
     * Field arguments, directive arguments and variable definitions — every
     * parenthesised list GraphQL has names its entries, which is what separates
     * `episode:` from the field it belongs to.
     */
    args: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        // The only brace an argument list can contain is an object value, whose
        // fields are named the same way arguments are — so it re-enters this
        // state rather than needing one of its own. Popping on `}` then doubles
        // as the recovery an unclosed `(` needs: the brace must belong to an
        // enclosing selection set, so the list ends there instead of turning the
        // rest of the document into arguments.
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'args' },
        // Variables only ever appear inside a list like this one, so `$` is not
        // interesting anywhere else.
        { match: `\\$${NAME}`, scope: 'variable' },
        { match: `\\b${NAME}(?=[ \\t]*:)`, scope: 'variable.parameter' },
        { include: 'common' },
      ],
    },

    common: {
      rules: [
        { match: '#[^\\n]*', scope: 'comment' },

        { match: '"""', scope: 'string', push: 'block-string' },
        { match: '"', scope: 'string', push: 'string' },

        // ---- definitions ----------------------------------------------------
        // Every definition keyword is matched together with what follows it, so
        // a field that happens to be named `type` or `input` keeps its own
        // colour unless it is standing in a definition's shape.
        {
          match: `\\b(type|interface|input|enum|union|scalar)([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'class'],
        },
        { match: '\\bextend\\b(?=[ \\t]+[a-z])', scope: 'keyword.declaration' },
        { match: '\\bschema\\b(?=[ \\t]*[{@])', scope: 'keyword.declaration' },
        { match: '\\bdirective\\b(?=[ \\t]*@)', scope: 'keyword.declaration' },
        // An operation is a named, parameterised entry point, so its name reads
        // as a function definition — and a fragment spread below reads as a call.
        {
          match: `\\b(query|mutation|subscription|fragment)([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match: '\\b(?:query|mutation|subscription)\\b(?=[ \\t]*[{(@])',
          scope: 'keyword.declaration',
        },

        // `...on Droid` is legal without the space, so the `on` alternative has
        // to win before the spread-name rule claims `on` as a fragment name.
        {
          match: '(\\.\\.\\.)([ \\t]*)(on)\\b',
          scope: ['operator', null, 'keyword'],
        },
        {
          match: `(\\.\\.\\.)([ \\t]*)(${NAME})`,
          scope: ['operator', null, 'function.call'],
        },

        // A type condition, a supertype list and a directive location list are
        // all followed by an uppercase name, which keeps a field called `on`
        // from reading as a keyword.
        { match: '\\b(?:on|implements)\\b(?=[ \\t]+[A-Z_])', scope: 'keyword' },
        { match: '\\brepeatable\\b(?=[ \\t]+on\\b)', scope: 'keyword' },

        { match: `@${NAME}`, scope: 'decorator' },

        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\bnull\\b', scope: 'constant.builtin' },
        // Introspection meta-fields belong to the runtime rather than to the
        // type being selected from.
        {
          match: '\\b__(?:typename|schema|type)\\b',
          scope: 'variable.special',
        },

        {
          match: '\\b(?:Int|Float|String|Boolean|ID)\\b',
          scope: 'type.builtin',
        },
        // Convention, not syntax: SCREAMING_CASE is an enum value or a directive
        // location, anything else capitalised is a type. A type named `URL`
        // reads as an enum value, which is the same trade Python's grammar makes.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },

        // ---- fields ---------------------------------------------------------
        { match: `\\b${NAME}(?=[ \\t]*:)`, scope: 'property' },
        // A field definition whose arguments come first: `user(id: ID!): User`.
        // The trailing `:` is what separates it from a query field with
        // arguments, which is followed by a selection set instead. The scan
        // cannot cross a parenthesis and is capped, so a line of `x(` cannot
        // make this quadratic.
        {
          match: `\\b${NAME}(?=[ \\t]*\\([^()]{0,300}\\)[ \\t]*:)`,
          scope: 'property',
        },

        {
          match: '-?\\b\\d+(?:\\.\\d+)?(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },

        { match: '\\(', scope: 'punctuation.bracket', push: 'args' },
        { match: '[{}\\[\\]()]', scope: 'punctuation.bracket' },
        // `!` non-null, `=` default, `|` union member, `&` supertype, and a
        // spread that reached neither rule above.
        { match: '\\.\\.\\.|[!=|&]', scope: 'operator' },
        { match: '[,:]', scope: 'punctuation.delimiter' },
      ],
    },

    string: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u\\{[0-9a-fA-F]+\\}|u[0-9a-fA-F]{4}|["\\\\/bfnrt])',
          scope: 'string.escape',
        },
        { match: '"', scope: 'string', pop: true },
        // An ordinary string cannot span lines, so an unterminated one ends with
        // its line instead of swallowing the rest of the document.
        { match: '$', pop: true },
      ],
    },

    'block-string': {
      default: 'string',
      // `\"""` is the only escape a block string has; consuming it here keeps a
      // literal triple quote from closing the literal.
      rules: [
        { match: '\\\\"""', scope: 'string.escape' },
        { match: '"""', scope: 'string', pop: true },
      ],
    },

    description: {
      default: 'comment.doc',
      rules: [{ match: '\\\\"""' }, { match: '"""', pop: true }],
    },
  },
}

export default graphql

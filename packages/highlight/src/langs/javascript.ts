import type { Grammar } from '../core/types'

/**
 * JavaScript, TypeScript, JSX and TSX.
 *
 * One grammar covers all four: TypeScript-only keywords are inert in a `.js`
 * file, and the JSX rules are gated on a tag-shaped lookahead rather than on
 * the file extension.
 *
 * Two things here are worth knowing about:
 *
 * - A `/` is a regex only when the token before it cannot end an expression.
 *   That preceding token is matched and scoped as part of the same rule, which
 *   is the cheapest reliable way to tell `a / b` from `/ab+/g`.
 * - Template literals nest properly: `` `${ {a: `x`} }` `` keeps its states
 *   straight because interpolations track brace depth.
 * - JSX children are text, not code. Once an opening tag closes, everything up
 *   to the matching closing tag is read as text with `{…}` expressions, so the
 *   apostrophe in `<p>Don't</p>` cannot open a string.
 */

/**
 * An identifier, with its tail length-capped.
 *
 * `$` is legal in an identifier but is not a `\w` character, so `\b` sits
 * between every `$` and the letter after it. In `$a$a$a…` — one valid
 * identifier — that is a word boundary every two characters, and the rules that
 * match an identifier and then test a lookahead (`name(`, `name:`, `name =>`)
 * restart at each one, scanning to the end of the line before failing. The cap
 * bounds that scan; identifiers this long do not occur in real code, and one
 * that did would simply render unscoped.
 */
const ID = '[A-Za-z_$\\u0080-\\uFFFF][\\w$\\u0080-\\uFFFF]{0,128}'

/** Contexts after which a `/` begins a regex literal rather than division. */
const BEFORE_REGEX =
  '(?:[=(,:;\\[!&|?{}+\\-*%^~<>]|=>|\\breturn|\\bcase|\\btypeof|\\bin|\\bof|\\bnew|\\bdo|\\byield|\\bawait|\\belse)'

/**
 * Contexts after which a `<` can open a JSX element: wherever an expression
 * can start. Everything else — an identifier, `)` or `]` — makes `<` a
 * comparison or a type argument list.
 */
const BEFORE_JSX = '(?:^|[=(,?:{\\[;!&|]|=>|\\breturn|\\byield|\\bdefault|\\bawait)'

/**
 * TypeScript angle brackets that look like an element with no attributes: a
 * generic arrow function `<T>(x: T) => x`, a constrained one `<T extends X>`,
 * a defaulted one `<T = unknown>`, and the old-style assertion `<HTMLElement>el`. Reading any of them as an
 * opening tag would turn the rest of the file into JSX text.
 *
 * An assertion is followed by an expression on the same line, and so is an
 * element's text, so the line decides: an element without attributes opens
 * only when its line ends after the `>` or holds another tag. A closing tag
 * counts, and so does a `<` that does not follow a name, which keeps the type
 * arguments in `get<Store>()` out. An element whose text runs on to a later
 * closing tag reads as code instead, which costs that one element and never
 * the rest of the file.
 */
const NOT_TS_AFTER =
  '(?!>[ \\t]*\\()(?!\\s+(?:extends\\b|=))(?!>(?![ \\t]*$)(?![^\\n]{0,512}(?:<\\/|(?<![\\w$)\\]])<[A-Za-z>])))'

/** A JSX tag name: a component, a member expression, or a lowercase element. */
const TAG = '[A-Z][\\w.]*|[a-z][\\w-]*(?:[.:][\\w-]+)*'

/**
 * What follows a name that is assigned a function: `= () =>`, `= async x =>`,
 * `= function`. The parameter list cannot nest parentheses, which covers real
 * code and keeps the scan bounded.
 */
const ASSIGNS_FUNCTION = `[ \\t]*=[ \\t]*(?:async[ \\t]*)?(?:function\\b|\\([^()]{0,512}\\)[ \\t]*(?::[^=;\\n]{0,256})?=>|${ID}[ \\t]*=>)`

/** Body of a regex literal: no unescaped `/`, character classes may hold one. */
const REGEX = '/(?![/*])(?:[^/\\\\\\n\\[]|\\\\.|\\[(?:[^\\]\\\\\\n]|\\\\.)*\\])+/[dgimsuvy]*'

const javascript: Grammar = {
  name: 'javascript',
  aliases: ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'typescript'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        // A state, not a lazy `[\\s\\S]*?` scan: that form runs to EOF and fails
        // once per opener, which is O(n²) on a run of unterminated `/*`.
        { match: '/\\*\\*(?![/*])', scope: 'comment.doc', push: 'doc-comment' },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        { match: '//[^\\n]*', scope: 'comment' },
        { match: '^#!.*', scope: 'comment' },

        { include: 'strings' },

        // Scoping the preceding operator here is what makes the lookbehind
        // unnecessary — and lookbehind is still not safe everywhere.
        {
          match: `(${BEFORE_REGEX})(\\s*)(${REGEX})`,
          scope: ['operator', null, 'regexp'],
        },
        // `if (ok) /re/.test(s)`: a `)` that closes a control condition starts
        // an expression. The lookbehind sits after the `/` so the rule still
        // starts with a literal character.
        {
          match: `/(?<=(?<![\\w$.])(?:if|while|for)[ \\t]*\\([^()\\n]{0,256}\\)[ \\t]*/)${REGEX.slice(1)}`,
          scope: 'regexp',
        },
        // Blanks only: `\s*` would run across every blank line below, and
        // retrying that at each line start is O(n²) on a run of blank lines.
        { match: `^([ \\t]*)(${REGEX})`, scope: [null, 'regexp'] },

        { include: 'numbers' },
        { include: 'jsx' },

        { match: `(@)(${ID}(?:\\.${ID})*)`, scope: ['decorator', 'decorator'] },

        {
          match: `(\\.)([ \\t]*)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: `(\\?\\.|\\.)([ \\t]*)(${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },

        // `handler = function …` and `this.run = () => …` name a function as
        // surely as a declaration does.
        { match: `\\b${ID}(?=${ASSIGNS_FUNCTION})`, scope: 'function' },

        {
          match:
            '\\b(?:if|else|for|while|do|switch|case|default|break|continue|return|throw|try|catch|finally|await|yield)\\b',
          scope: 'keyword.control',
        },
        // The declared name is scoped by a state of its own rather than by a
        // rule here: a rule that has to look back at `const` runs at every
        // identifier in the file, while the state only runs after the keyword.
        { match: '\\b(?:const|let|var)\\b', scope: 'keyword.declaration', push: 'declared-name' },
        {
          match:
            '\\b(?:function|class|interface|enum|namespace|module|declare|abstract|implements|extends|constructor|static|readonly|override|public|private|protected|async|get|set|type)\\b',
          scope: 'keyword.declaration',
        },
        {
          match: '\\b(?:import|export|from|require)\\b',
          scope: 'keyword.import',
        },
        {
          match: '\\b(?:typeof|instanceof|in|of|new|delete|void|satisfies|keyof|infer|asserts|as)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        {
          match: '\\b(?:null|undefined|NaN|Infinity)\\b',
          scope: 'constant.builtin',
        },
        {
          match: '\\b(?:this|super|arguments|globalThis)\\b',
          scope: 'variable.builtin',
        },
        {
          match: '\\b(?:console|window|document|process|module|exports)\\b',
          scope: 'variable.builtin',
        },
        {
          match: '\\b(?:string|number|boolean|symbol|bigint|object|unknown|never|any|void|readonly)\\b(?=[^\\w$]|$)',
          scope: 'type.builtin',
        },

        { match: '\\b[A-Z][A-Z0-9_]+\\b(?![\\w$])', scope: 'constant' },
        // A capitalised name followed by a call is still a call — `Error('x')`,
        // `new Date()`, a React component invoked directly — not a type.
        { match: '\\b[A-Z][\\w$]{0,128}(?=[ \\t]*\\()', scope: 'function.call' },
        { match: '\\b[A-Z][A-Za-z0-9_$]*\\b', scope: 'type' },

        // `key:` in an object literal, and the name half of a TS annotation.
        // Requiring no space before the colon keeps `cond ? a : b` out.
        { match: `\\b${ID}(?=\\??:)`, scope: 'property' },
        { match: `\\b${ID}(?=\\s*=>)`, scope: 'variable.parameter' },
        { match: `\\b${ID}(?=[ \\t]*[(<]|\`)`, scope: 'function.call' },

        {
          // Bare `=` goes last so `=>`, `==`, `===` and the compound forms all
          // get first refusal. Without it plain assignment matched nothing.
          match: '=>|\\?\\?=?|\\?\\.|\\.{3}|&&=?|\\|\\|=?|\\*\\*=?|[-+*/%&|^]=?|[!=]==?|[<>]=?|<<=?|>>>?=?|[?~!]|=',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * Right after `const`, `let` or `var`: the one name it declares. A
     * destructuring pattern or anything else ends the state without a scope.
     */
    'declared-name': {
      rules: [
        { match: '\\benum\\b', scope: 'keyword.declaration', pop: true },
        { match: `${ID}(?=${ASSIGNS_FUNCTION})`, scope: 'function', pop: true },
        { match: ID, scope: 'variable', pop: true },
        { match: '(?=\\S)', pop: true },
      ],
    },

    numbers: {
      rules: [
        { match: '\\b0[xX](?:_?[0-9a-fA-F])+n?\\b', scope: 'number' },
        { match: '\\b0[oO](?:_?[0-7])+n?\\b', scope: 'number' },
        { match: '\\b0[bB](?:_?[01])+n?\\b', scope: 'number' },
        {
          match:
            '\\b\\d(?:_?\\d)*\\.(?:\\d(?:_?\\d)*)?(?:[eE][-+]?\\d+)?|\\.\\d(?:_?\\d)*(?:[eE][-+]?\\d+)?|\\b\\d(?:_?\\d)*(?:[eE][-+]?\\d+)?n?\\b',
          scope: 'number',
        },
      ],
    },

    strings: {
      rules: [
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '`', scope: 'string', push: 'template' },
      ],
    },

    'string-double': {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u\\{[0-9a-fA-F]+\\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\\r?\\n|.)',
          scope: 'string.escape',
        },
        { match: '"', scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u\\{[0-9a-fA-F]+\\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|\\r?\\n|.)',
          scope: 'string.escape',
        },
        { match: "'", scope: 'string', pop: true },
        { match: '$', pop: true },
      ],
    },

    template: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u\\{[0-9a-fA-F]+\\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)',
          scope: 'string.escape',
        },
        {
          match: '\\$\\{',
          scope: 'interpolation',
          push: 'template-expression',
        },
        { match: '`', scope: 'string', pop: true },
      ],
    },
    'template-expression': {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
    /** Tracks brace depth so an object literal cannot end an interpolation. */
    brace: {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },

    // ---- JSX ---------------------------------------------------------------
    jsx: {
      rules: [
        // `<` is the most overloaded character in the language, so an element
        // opens only where an expression can start. The lookbehind sits after
        // the `<` so the rule still starts with a literal character, which
        // keeps the engine's first-character scan.
        {
          match: `(<)(?<=${BEFORE_JSX}\\s*<)(${TAG})(?=[\\s/>])${NOT_TS_AFTER}`,
          scope: ['punctuation.bracket', 'tag'],
          push: 'jsx-open-tag',
        },
        {
          match: `<(?<=${BEFORE_JSX}\\s*<)>`,
          scope: 'punctuation.bracket',
          push: 'jsx-children',
        },
        // A closing tag with no opener, as in a snippet cut out of a larger file.
        {
          match: `(</)(${TAG})?([ \\t]*)(>)`,
          scope: ['punctuation.bracket', 'tag', null, 'punctuation.bracket'],
        },
      ],
    },
    'jsx-open-tag': {
      rules: [
        { match: '/>', scope: 'punctuation.bracket', pop: true },
        { match: '>', scope: 'punctuation.bracket', set: 'jsx-children' },
        { match: '\\{', scope: 'interpolation', push: 'jsx-expression' },
        { match: `\\b${ID}(?:[-:]${ID})*`, scope: 'tag.attribute' },
        { match: '=', scope: 'operator' },
        { include: 'strings' },
      ],
    },
    /** Between an opening tag and its closing tag: text, elements and `{…}`. */
    'jsx-children': {
      rules: [
        {
          match: `(</)(${TAG})?([ \\t]*)(>)`,
          scope: ['punctuation.bracket', 'tag', null, 'punctuation.bracket'],
          pop: true,
        },
        {
          match: `(<)(${TAG})(?=[\\s/>])`,
          scope: ['punctuation.bracket', 'tag'],
          push: 'jsx-open-tag',
        },
        { match: '<>', scope: 'punctuation.bracket', push: 'jsx-children' },
        { match: '\\{', scope: 'interpolation', push: 'jsx-expression' },
        { match: '&(?:#\\d{1,8}|#x[0-9a-fA-F]{1,8}|[A-Za-z][A-Za-z0-9]{1,32});', scope: 'string.escape' },
      ],
    },
    'jsx-expression': {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', scope: 'comment', pop: true }],
    },
    'doc-comment': {
      default: 'comment.doc',
      rules: [{ match: '\\*/', scope: 'comment.doc', pop: true }],
    },
  },
}

export default javascript

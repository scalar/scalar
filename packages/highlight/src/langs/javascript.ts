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

/**
 * Ends a keyword rule: the word is not followed by the `:` of an object key or
 * a type member. Checked only after a keyword has matched, so it costs nothing
 * on ordinary identifiers.
 */
const NOT_KEY = '(?!\\??:)'

/** A JSX tag name: a component, a member expression, or a lowercase element. */
const TAG = '[A-Z][\\w.]*|[a-z][\\w-]*(?:[.:][\\w-]+)*'

/**
 * What follows a name that is assigned a function: `= () =>`, `= async x =>`,
 * `= function`, and the generic `= <T,>(x: T) =>`. The parameter list cannot
 * nest parentheses, which covers real code and keeps the scan bounded.
 */
const ASSIGNS_FUNCTION = `[ \\t]*=[ \\t]*(?:async[ \\t]*)?(?:function\\b|(?:<[^<>()=]{0,128}>[ \\t]*)?\\([^()]{0,512}\\)[ \\t]*(?::[^=;\\n]{0,256})?=>|${ID}[ \\t]*=>)`

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
          match: `(\\.)([ \\t]*)(#?${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', null, 'function.method'],
        },
        {
          match: `(\\?\\.|\\.)([ \\t]*)(#?${ID})`,
          scope: ['punctuation', null, 'variable.member'],
        },
        // A private field or method where it is declared, or `#x in obj`.
        { match: `#${ID}`, scope: 'variable.member' },

        // `handler = function …` and `this.run = () => …` name a function as
        // surely as a declaration does.
        { match: `\\b${ID}(?=${ASSIGNS_FUNCTION})`, scope: 'function' },

        // A keyword followed by `:` is an object key or a property in a type —
        // `{ type: 'object' }`, `{ from: start, to: end }` — so each keyword
        // rule ends with `NOT_KEY` and the word falls through to the property
        // rule. `default:` needs telling apart: in a `switch` it is followed by
        // a statement or nothing, as an object key by a value. A braced block
        // after it reads as a key, since `responses: { default: { … } }` is the
        // commoner of the two in API code.
        //
        // The contextual keywords that are also common method names (`get`,
        // `set`, `of`, `delete`, `from`, `type`) stay keywords only when no `(`
        // follows directly, so `static of(x)` and `cache.get(key)` read as calls.
        {
          match:
            '\\bdefault\\b(?=[ \\t]*:[ \\t]*(?:$|\\/[/*]|\\b(?:return|break|continue|throw|case)\\b))|\\bdefault\\b(?!\\??:)',
          scope: 'keyword.control',
        },
        {
          match: `\\b(?:if|else|for|while|do|switch|case|break|continue|return|throw|try|catch|finally|await|yield)\\b${NOT_KEY}`,
          scope: 'keyword.control',
        },
        // A TypeScript assertion ends an expression; it does not declare the
        // next name, even when that name begins a new line without a semicolon.
        { match: '\\bconst\\b(?<=\\bas\\s+const)', scope: 'keyword.declaration' },
        // The declared name is scoped by a state of its own rather than by a
        // rule here: a rule that has to look back at `const` runs at every
        // identifier in the file, while the state only runs after the keyword.
        { match: '\\b(?:const|let|var)\\b', scope: 'keyword.declaration', push: 'declared-name' },
        // A parameter list reads its names as parameters: after `function` and
        // its optional name, or before the `=>` of an arrow function. The arrow
        // lookahead cannot see past nested parentheses, so a list holding a
        // call in a default value or a function type keeps reading as plain
        // code. Quotes and slashes also force that fallback: a string, comment
        // or regex can contain `) =>` without introducing an arrow function.
        {
          match: `(\\bfunction\\b)([ \\t]*\\*?[ \\t]*)(?:(${ID})([ \\t]*))?(\\()`,
          scope: ['keyword.declaration', null, 'function', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: '\\((?=[^()"\'`/]{0,512}\\)[ \\t]*(?::[^=;\\n"\'`/]{0,256})?=>)',
          scope: 'punctuation.bracket',
          push: 'params',
        },
        {
          match: `\\b(?:function|class|interface|enum|namespace|module|declare|abstract|implements|extends|constructor|static|readonly|override|public|private|protected|async|get(?!\\()|set(?!\\()|type(?!\\())\\b${NOT_KEY}`,
          scope: 'keyword.declaration',
        },
        {
          match: `\\b(?:import|export|from(?!\\()|require)\\b${NOT_KEY}`,
          scope: 'keyword.import',
        },
        // Import attributes: `import data from './x.json' with { type: 'json' }`.
        { match: '\\bwith(?=[ \\t]*\\{)', scope: 'keyword.import' },
        {
          match: `\\b(?:typeof|instanceof|in|of(?!\\()|new|delete(?!\\()|void|satisfies|keyof|infer|asserts|as)\\b${NOT_KEY}`,
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
          match: `\\b(?:console|window|document|process|module|exports)\\b${NOT_KEY}`,
          scope: 'variable.builtin',
        },
        {
          match: `\\b(?:string|number|boolean|symbol|bigint|object|unknown|never|any|void|readonly)\\b(?=[^\\w$]|$)${NOT_KEY}`,
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

    // ---- parameter lists -----------------------------------------------------
    /** After the `(` of a parameter list, up to the `)` that closes it. */
    params: {
      rules: [{ match: '\\)', scope: 'punctuation.bracket', pop: true }, { include: 'param-pattern' }],
    },
    /**
     * What a parameter can be: a name, a destructuring pattern, a rest
     * element, and after it a TypeScript annotation or a default value.
     */
    'param-pattern': {
      rules: [
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        { match: '//[^\\n]*', scope: 'comment' },
        { match: ':', scope: 'punctuation.delimiter', push: 'param-type' },
        // Leave the operator for expression rules that need it to recognize a regex.
        { match: '(?==(?!>))', push: 'param-default' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'param-object' },
        { match: '\\[', scope: 'punctuation.bracket', push: 'param-array' },
        { match: '\\.{3}|\\?', scope: 'operator' },
        { match: '\\bthis\\b', scope: 'variable.builtin' },
        // A constructor's parameter properties: `constructor(private x: X)`.
        {
          match: '\\b(?:public|private|protected|readonly|override)\\b(?=[ \\t]+[\\w$\\[{])',
          scope: 'keyword.declaration',
        },
        { match: `@${ID}`, scope: 'decorator' },
        { match: ID, scope: 'variable.parameter' },
        { match: ',', scope: 'punctuation.delimiter' },
      ],
    },
    /**
     * `{ a, b: renamed, c = 1, ...rest }`: keys are not bindings. A computed
     * key uses expression rules, unlike the bindings inside an array pattern.
     */
    'param-object': {
      rules: [
        { match: '\\}', scope: 'punctuation.bracket', pop: true },
        { match: '\\[', scope: 'punctuation.bracket', push: 'bracket' },
        // Inside an object pattern a colon renames a key, never annotates a type.
        { match: ':', scope: 'punctuation.delimiter' },
        { include: 'numbers' },
        // Quoted keys rename a binding; their colon does not introduce a type.
        {
          match: `("(?:[^"\\\\\\r\\n]|\\\\.)*"|'(?:[^'\\\\\\r\\n]|\\\\.)*')([ \\t]*)(:)`,
          scope: ['string', null, 'punctuation.delimiter'],
        },
        {
          match: `(${ID})([ \\t]*)(:)`,
          scope: ['property', null, 'punctuation.delimiter'],
        },
        { include: 'param-pattern' },
      ],
    },
    /** Array destructuring binds its elements, including nested patterns. */
    'param-array': {
      rules: [{ match: '\\]', scope: 'punctuation.bracket', pop: true }, { include: 'param-pattern' }],
    },
    /**
     * A parameter's type, up to the `,`, `)` or `=` that ends it. Brackets
     * nest so the commas in `Map<K, V>` and `{ a: A, b: B }` stay inside.
     */
    'param-type': {
      rules: [
        { match: '(?=[,)}\\]]|=(?!>))', pop: true },
        { match: '<', scope: 'punctuation.bracket', push: 'type-angle' },
        { include: 'nesting' },
        { include: 'expression' },
      ],
    },
    'type-angle': {
      rules: [
        { match: '=>', scope: 'operator' },
        { match: '>', scope: 'punctuation.bracket', pop: true },
        { match: '<', scope: 'punctuation.bracket', push: 'type-angle' },
        { include: 'nesting' },
        { include: 'expression' },
      ],
    },
    /** A default value, up to the `,` or closing bracket that ends it. */
    'param-default': {
      rules: [{ match: '(?=[,)}\\]])', pop: true }, { include: 'nesting' }, { include: 'expression' }],
    },
    /** Bracket depth, so a comma inside a nested call or literal stays nested. */
    nesting: {
      rules: [
        // Consume the regex with its opener, then track the bracket around it.
        { match: `(\\()(\\s*)(${REGEX})`, scope: ['punctuation.bracket', null, 'regexp'], push: 'paren' },
        { match: `(\\[)(\\s*)(${REGEX})`, scope: ['punctuation.bracket', null, 'regexp'], push: 'bracket' },
        // Generic calls nest commas too. Require a following call and stop at an
        // assignment or an unmatched closing parenthesis or brace. Balanced function/object
        // types are allowed, but the scan cannot escape into the function body.
        {
          match: '<(?=(?:[^;=(){}\\n]|=>|\\([^(){}\\n]{0,128}\\)|\\{[^{}()\\n]{0,128}\\}){1,512}>[ \\t]*\\()',
          scope: 'punctuation.bracket',
          push: 'type-angle',
        },
        { match: '\\(', scope: 'punctuation.bracket', push: 'paren' },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { match: '\\[', scope: 'punctuation.bracket', push: 'bracket' },
      ],
    },
    paren: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        { include: 'nesting' },
        { include: 'expression' },
      ],
    },
    bracket: {
      rules: [
        { match: '\\]', scope: 'punctuation.bracket', pop: true },
        { include: 'nesting' },
        { include: 'expression' },
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

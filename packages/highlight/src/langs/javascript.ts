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

/** Body of a regex literal: no unescaped `/`, character classes may hold one. */
const REGEX = '/(?![/*])(?:[^/\\\\\\n\\[]|\\\\.|\\[(?:[^\\]\\\\\\n]|\\\\.)*\\])+/[dgimsuvy]*'

const javascript: Grammar = {
  name: 'javascript',
  aliases: ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'typescript'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        { match: '/\\*\\*(?![/*])[\\s\\S]*?\\*/', scope: 'comment.doc' },
        { match: '/\\*[\\s\\S]*?\\*/', scope: 'comment' },
        { match: '//[^\\n]*', scope: 'comment' },
        { match: '^#!.*', scope: 'comment' },

        { include: 'strings' },

        // Scoping the preceding operator here is what makes the lookbehind
        // unnecessary — and lookbehind is still not safe everywhere.
        {
          match: `(${BEFORE_REGEX})(\\s*)(${REGEX})`,
          scope: ['operator', null, 'regexp'],
        },
        { match: `^(\\s*)(${REGEX})`, scope: [null, 'regexp'] },

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

        {
          match:
            '\\b(?:if|else|for|while|do|switch|case|default|break|continue|return|throw|try|catch|finally|await|yield)\\b',
          scope: 'keyword.control',
        },
        // `const greet = () => {}` and `const greet = function () {}` name a
        // function just as much as `function greet() {}` does, so the binding
        // reads as one. Without this the name went unscoped, because the rules
        // below only recognise a name that sits directly in front of a `(`.
        {
          match: `\\b(const|let|var)([ \\t]+)(${ID})(?=[ \\t]*=[ \\t]*(?:async[ \\t]+)?(?:\\(|function\\b|${ID}[ \\t]*=>))`,
          scope: ['keyword.declaration', null, 'function'],
        },
        {
          match:
            '\\b(?:function|class|const|let|var|interface|enum|namespace|module|declare|abstract|implements|extends|constructor|static|readonly|override|public|private|protected|async|get|set|type)\\b',
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
        { match: '\\b[A-Z][A-Za-z0-9_$]*\\b', scope: 'type' },

        // `key:` in an object literal, and the name half of a TS annotation.
        // Requiring no space before the colon keeps `cond ? a : b` out.
        { match: `\\b${ID}(?=\\??:)`, scope: 'property' },
        { match: `\\b${ID}(?=\\s*=>)`, scope: 'variable.parameter' },
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },
        // A generic call such as `useState<number>(0)`. The argument list has to
        // close and be followed by `(`, so a comparison like `count <= max` and
        // JSX text like `<button>hi</button>` are not mistaken for calls.
        {
          match: `\\b${ID}(?=[ \\t]*<[^<>()\\n]*>[ \\t]*\\()`,
          scope: 'function.call',
        },

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
        // Two guards, because `<` is the most overloaded character in the
        // language. The trailing lookahead rules out `a < b` — a comparison
        // has a space or a non-tag character where a tag has `>`, `/` or an
        // attribute. The lookbehind rules out type arguments: `Handler<E
        // extends Event>` and `Array<string>` both satisfy the lookahead, and
        // what separates them from JSX is that a tag never follows an
        // identifier, `)` or `]` directly.
        {
          match: '(?<![\\w$)\\]])(<)(/?)([A-Z][\\w.]*|[a-z][\\w-]*(?:\\.[\\w-]+)*)(?=[\\s/>])',
          scope: ['punctuation.bracket', 'punctuation', 'tag'],
          push: 'jsx-tag',
        },
        {
          match: '(<)(>)',
          scope: ['punctuation.bracket', 'punctuation.bracket'],
        },
        {
          match: '(</)(>)',
          scope: ['punctuation.bracket', 'punctuation.bracket'],
        },
      ],
    },
    'jsx-tag': {
      rules: [
        { match: '/?>', scope: 'punctuation.bracket', pop: true },
        { match: '\\{', scope: 'interpolation', push: 'jsx-expression' },
        { match: `(${ID}(?:-${ID})*)(?=\\s*=)`, scope: 'tag.attribute' },
        { match: `\\b${ID}(?:-${ID})*`, scope: 'tag.attribute' },
        { match: '=', scope: 'operator' },
        { include: 'strings' },
      ],
    },
    'jsx-expression': {
      rules: [
        { match: '\\}', scope: 'interpolation', pop: true },
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        { include: 'expression' },
      ],
    },
  },
}

export default javascript

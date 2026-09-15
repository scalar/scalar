import type { Grammar } from '../core/types'

/**
 * C.
 *
 * Four things carry most of the weight:
 *
 * - The preprocessor is a second language living at the start of a line, so its
 *   directives are anchored to `^`. `#include` hands its header path to the
 *   string scope, and `#define` tells an object-like macro from a function-like
 *   one by the paren that follows the name.
 * - A definition is told from a call by what comes after the parameter list: a
 *   body's `{`. Nothing local to `f(x)` distinguishes the two, so the lookahead
 *   is the whole heuristic — see the rule for what it gets wrong.
 * - `'a'` is a character literal, not the start of a string, so it is matched
 *   whole. That is also what keeps `'"'` from opening one.
 * - Reserved `__names__` read as compiler magic rather than as identifiers,
 *   which is what `__FILE__`, `__VA_ARGS__` and `__attribute__` all are.
 *
 * Ordinary identifiers deliberately match no rule and inherit the block's
 * foreground, which keeps both the markup and the grammar small.
 */

const ID = '[A-Za-z_]\\w*'

/** `\n`, `\0`, `\x41`, `\uXXXX`, `\033`, and a backslash-newline continuation. */
const ESCAPE = '\\\\(?:x[0-9a-fA-F]+|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3}|\\r?\\n|.)'

/** printf conversions, length modifiers included (`%zu`, `%#lx`, `%.3f`). */
const FORMAT = "%[-+ #0']*(?:\\d+|\\*)?(?:\\.(?:\\d+|\\*))?(?:hh|ll|[hljztL])?[diouxXeEfFgGaAcspn%]"

/** Literal suffixes: `1024u`, `42UL`, `3.14f`, `0xDEADBEEFULL`. */
const SUFFIX = '(?:[uU](?:ll|LL|[lL])?|(?:ll|LL|[lL])[uU]?|[fF])?'

/** The `u8`/`u`/`U`/`L` prefix on a string or character literal. */
const ENCODING = '(?:u8|[uUL])?'

const c: Grammar = {
  name: 'c',
  aliases: ['h'],
  states: {
    root: {
      rules: [
        // ---- comments --------------------------------------------------------
        // Doxygen opens with `/**` or `/*!`; the lookahead keeps `/**/` and a
        // `/***` banner out of the doc scope.
        // States, not a lazy `[\\s\\S]*?` scan: that form runs to EOF and fails
        // once per opener, which is O(n2) on an unterminated `/*` — 123 KB of
        // `/*a` measured 3.1 s. C block comments do not nest.
        {
          match: '/\\*[*!](?![/*])',
          scope: 'comment.doc',
          push: 'doc-comment',
        },
        { match: '/\\*', scope: 'comment', push: 'block-comment' },
        { match: '//[/!][^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },

        // ---- preprocessor ----------------------------------------------------
        // Indentation is captured rather than scoped, so `#  if` inside a nest
        // of conditionals keeps its leading whitespace unstyled.
        {
          match: '^([ \\t]*)(#[ \\t]*include(?:_next)?)([ \\t]*)(<[^>\\n]*>|"[^"\\n]*")',
          scope: [null, 'keyword.import', null, 'string'],
        },
        {
          match: `^([ \\t]*)(#[ \\t]*define)([ \\t]+)(${ID})(?=\\()`,
          scope: [null, 'keyword.declaration', null, 'function'],
        },
        {
          match: `^([ \\t]*)(#[ \\t]*(?:define|undef))([ \\t]+)(${ID})`,
          scope: [null, 'keyword.declaration', null, 'constant'],
        },
        {
          match: '^([ \\t]*)(#[ \\t]*(?:ifdef|ifndef|elifdef|elifndef|if|elif|else|endif))\\b',
          scope: [null, 'keyword.control'],
        },
        // Everything else the preprocessor understands: pragma, error, line…
        { match: '^([ \\t]*)(#[ \\t]*[a-z_]+)', scope: [null, 'keyword'] },
        // The backslash that splices a macro onto the next line.
        { match: '\\\\(?=\\r?\\n)', scope: 'operator' },

        // ---- literals --------------------------------------------------------
        {
          match: `${ENCODING}(")`,
          scope: ['string'],
          rest: 'string.special',
          push: 'string',
        },
        // Bounded repetition: a stray apostrophe must not scan to end of line,
        // and multi-character constants (`'ab'`) are still legal C.
        {
          match: `${ENCODING}('(?:[^'\\\\\\n]|\\\\[^\\n]){1,8}')`,
          scope: ['string'],
          rest: 'string.special',
        },

        // ---- keywords --------------------------------------------------------
        // The tag rule sits above the plain `struct` keyword so the two are one
        // match and the tag name reads as a type.
        {
          match: `\\b(struct|union|enum)([ \\t]+)(${ID})`,
          scope: ['keyword.declaration', null, 'type'],
        },
        {
          match: '\\b(?:if|else|for|while|do|switch|case|default|break|continue|return|goto)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:struct|union|enum|typedef|static|extern|const|volatile|inline|register|auto|restrict|constexpr|_Atomic|_Noreturn|_Thread_local|thread_local)\\b',
          scope: 'keyword.declaration',
        },
        {
          match: '\\b(?:sizeof|alignof|_Alignof|typeof|typeof_unqual|_Generic|defined)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\b(?:NULL|nullptr|EOF)\\b', scope: 'constant.builtin' },
        {
          match: '\\b(?:stdin|stdout|stderr|errno)\\b',
          scope: 'variable.builtin',
        },
        {
          match:
            '\\b(?:void|char|short|int|long|float|double|signed|unsigned|_Bool|bool|size_t|ssize_t|ptrdiff_t|wchar_t|char16_t|char32_t|FILE|va_list|u?int(?:8|16|32|64|ptr|max)_t)\\b',
          scope: 'type.builtin',
        },

        // ---- names -----------------------------------------------------------
        // A leading underscore pair is reserved for the implementation, so
        // `__FILE__`, `__VA_ARGS__` and `__attribute__` are all compiler magic.
        { match: '\\b__\\w+', scope: 'variable.special' },

        {
          match: `(->)(${ID})(?=[ \\t]*\\()`,
          scope: ['operator', 'function.method'],
        },
        { match: `(->)(${ID})`, scope: ['operator', 'variable.member'] },
        {
          match: `(\\.)(${ID})(?=[ \\t]*\\()`,
          scope: ['punctuation', 'function.method'],
        },
        { match: `(\\.)(${ID})`, scope: ['punctuation', 'variable.member'] },

        // A definition is a parameter list followed by a body. The parameter
        // scan excludes parens, so `if (ok(x)) {` and `while (next(&it)) {` stay
        // calls; it also means a definition taking a function pointer, or one
        // with more than 120 characters of parameters, falls back to
        // `function.call`. A prototype ends in `;` and reads as a call too.
        {
          match: `\\b${ID}(?=[ \\t]*\\([^;(){}]{0,120}\\)[ \\t]*(?:\\r?\\n[ \\t]*)?\\{)`,
          scope: 'function',
        },

        {
          match:
            '\\b(?:printf|fprintf|sprintf|snprintf|scanf|sscanf|puts|fputs|putchar|getchar|perror|fflush|fopen|fclose|fread|fwrite|malloc|calloc|realloc|free|memcpy|memmove|memset|memcmp|strlen|strcmp|strncmp|strcpy|strncpy|strcat|strchr|strstr|strtol|strtod|atoi|abort|exit|assert|qsort|bsearch|va_start|va_arg|va_end)\\b(?=[ \\t]*\\()',
          scope: 'function.builtin',
        },
        // Before the constant and type rules, so a SCREAMING_CASE macro used as
        // `MIN(a, b)` reads as the call it expands to.
        { match: `\\b${ID}(?=[ \\t]*\\()`, scope: 'function.call' },

        // SCREAMING_CASE is a macro or an enumerator; `_t` and CapWords are the
        // two ways a C codebase spells a typedef.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: `\\b${ID}_t\\b`, scope: 'type' },
        { match: '\\b[A-Z]\\w*\\b', scope: 'type' },

        // ---- numbers ---------------------------------------------------------
        // Hex first: `0x1p-3` is a float, and the decimal rule would stop at the
        // `0`. Octal needs no rule of its own — `0755` is a number either way.
        {
          match: `\\b0[xX][0-9a-fA-F]+(?:\\.[0-9a-fA-F]*)?(?:[pP][-+]?\\d+)?${SUFFIX}\\b`,
          scope: 'number',
        },
        { match: `\\b0[bB][01]+${SUFFIX}\\b`, scope: 'number' },
        {
          match: `\\b\\d+(?:\\.\\d*)?(?:[eE][-+]?\\d+)?${SUFFIX}\\b`,
          scope: 'number',
        },
        { match: `\\.\\d+(?:[eE][-+]?\\d+)?${SUFFIX}\\b`, scope: 'number' },

        // ---- syntax ----------------------------------------------------------
        {
          match: '->|\\+\\+|--|<<=?|>>=?|&&|\\|\\||\\.{3}|[-+*/%&|^!=<>]=?|[?~]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    /** Block comments. C does not nest them, so these do not push themselves. */
    'block-comment': {
      default: 'comment',
      rules: [{ match: '\\*/', pop: true }],
    },

    'doc-comment': {
      default: 'comment.doc',
      rules: [{ match: '\\*/', pop: true }],
    },

    string: {
      default: 'string',
      rules: [
        { match: ESCAPE, scope: 'string.escape' },
        { match: FORMAT, scope: 'string.special' },
        { match: '"', scope: 'string', pop: true },
        // An unterminated literal ends at the line break instead of swallowing
        // the rest of the file. A continued one does not reach here: the
        // backslash-newline is an escape, and it matches first.
        { match: '$', pop: true },
      ],
    },
  },
}

export default c

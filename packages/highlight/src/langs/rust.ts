import type { Grammar } from '../core/types'

/**
 * Rust.
 *
 * Lifetimes are distinguished from char literals, macros keep their `!`, and
 * attributes read as annotations rather than as comments.
 */
const rust: Grammar = {
  name: 'rust',
  aliases: ['rs'],
  states: {
    root: {
      rules: [
        { match: '//[/!][^\\n]*', scope: 'comment.doc' },
        { match: '//[^\\n]*', scope: 'comment' },
        { match: '/\\*[\\s\\S]*?\\*/', scope: 'comment' },

        // Raw strings, longest hash run first. Beyond two hashes is vanishingly
        // rare and would need a backreference to match exactly.
        {
          match: '(b?r##)("[\\s\\S]*?"##)',
          scope: ['string.special', 'string'],
        },
        { match: '(b?r#)("[\\s\\S]*?"#)', scope: ['string.special', 'string'] },
        {
          match: '(b?r)("(?:[^"\\\\]|\\\\.)*")',
          scope: ['string.special', 'string'],
        },
        {
          match: '(b?)(")',
          scope: ['string.special', 'string'],
          push: 'string',
        },

        // A char literal always closes; a lifetime never does.
        {
          match: "'(?:[^'\\\\]|\\\\(?:u\\{[0-9a-fA-F]{1,6}\\}|x[0-9a-fA-F]{2}|.))'",
          scope: 'string',
        },
        { match: "'(?:static|_|[a-z][\\w]*)\\b", scope: 'variable.special' },

        // `[` excluded as well as `]`, so a run of `#[` cannot cost O(n) per
        // attribute. An attribute holding a nested `[` renders unscoped.
        { match: '#!?\\[[^[\\]]*\\]', scope: 'decorator' },

        {
          match: '\\b(?:if|else|match|loop|while|for|break|continue|return|await|yield)\\b',
          scope: 'keyword.control',
        },
        {
          match:
            '\\b(?:fn|let|const|static|struct|enum|trait|impl|type|mod|union|async|move|dyn|pub|crate|unsafe|extern|ref|mut|where)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:use|as|super|self|Self)\\b', scope: 'keyword.import' },
        { match: '\\b(?:in|box)\\b', scope: 'keyword.operator' },
        { match: '\\b(?:true|false)\\b', scope: 'boolean' },
        { match: '\\b(?:None|Some|Ok|Err)\\b', scope: 'constant.builtin' },

        {
          match:
            '\\b(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|bool|char|str|String|Vec|Option|Result|Box|Rc|Arc)\\b',
          scope: 'type.builtin',
        },

        // Anchored to a word boundary. Unanchored, the name is retried at every
        // column of every word and each attempt scans to the end of the line
        // before failing for want of the `!`, which is quadratic in line length.
        {
          match: '\\b([A-Za-z_]\\w*)(!)',
          scope: ['function.builtin', 'function.builtin'],
        },
        {
          match: '(\\.)([A-Za-z_]\\w*)(?=\\s*\\()',
          scope: ['punctuation', 'function.method'],
        },
        {
          match: '(\\.)([A-Za-z_]\\w*)',
          scope: ['punctuation', 'variable.member'],
        },
        {
          match: '(fn)(\\s+)([A-Za-z_]\\w*)',
          scope: ['keyword.declaration', null, 'function'],
        },

        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z][A-Za-z0-9_]*\\b', scope: 'type' },
        { match: '\\b[a-z_]\\w*(?=\\s*\\()', scope: 'function.call' },
        { match: '\\b[a-z_]\\w*(?=::)', scope: 'namespace' },

        {
          match: '\\b0[xX][0-9a-fA-F_]+(?:[iu](?:8|16|32|64|128|size))?\\b',
          scope: 'number',
        },
        {
          match: '\\b0[bo][0-9_]+(?:[iu](?:8|16|32|64|128|size))?\\b',
          scope: 'number',
        },
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?(?:[iuf](?:8|16|32|64|128|size))?\\b',
          scope: 'number',
        },

        {
          match: '->|=>|::|\\.\\.=?|&&|\\|\\||[-+*/%!&|^<>=]=?|[?@]',
          scope: 'operator',
        },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },
    string: {
      default: 'string',
      rules: [
        {
          match: '\\\\(?:u\\{[0-9a-fA-F]{1,6}\\}|x[0-9a-fA-F]{2}|.)',
          scope: 'string.escape',
        },
        { match: '\\{[^{}\\n]*\\}', scope: 'string.special' },
        { match: '"', scope: 'string', pop: true },
      ],
    },
  },
}

export default rust

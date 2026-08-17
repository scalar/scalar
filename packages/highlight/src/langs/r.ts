import type { Grammar } from '../core/types'

/**
 * R.
 *
 * Three things make R awkward for a regex tokenizer, and each is handled
 * explicitly here:
 *
 * - `.` is an ordinary name character, so `\b` cannot mark the edge of a name.
 *   In `model.1` there is a word boundary in front of the `1`, which would read
 *   as a number, and in `f.if` there is one in front of `if`. Every name-shaped
 *   rule is guarded with `NAME_START` / `NAME_END` instead.
 * - `%…%` is user-definable infix syntax, so the operator set is open-ended.
 *   One rule covers `%%`, `%/%`, `%in%`, `%>%` and whatever a package invents.
 * - A `(` is where R decides what a name means, so every `(` pushes a state:
 *   `f(n = 5)` names an argument where the same `n = 5` at top level assigns.
 *   Definitions push a richer state, because there a bare name is a parameter.
 */

/**
 * A name may start with `.` (`.Machine`) and may contain `.` and `_`, so the
 * leading class allows a dot but not a digit.
 *
 * The tail is length-capped: `NAME_START` already stops a rule being retried in
 * the middle of a name, and the cap bounds the one scan that does happen so a
 * pathological name cannot make a lookahead rule walk the whole line. A name
 * longer than the cap simply renders unscoped.
 */
const ID = '[A-Za-z.][\\w.]{0,64}'

/** Backticks quote a non-syntactic name: `` `p value` ``, `` `%+%` ``. */
const BACKTICK = '`[^`\\n]*`'

/** Stands in for `\b` at the start of a name, which `.` would otherwise break. */
const NAME_START = '(?<![\\w.])'
/** Stands in for `\b` at the end of a name. */
const NAME_END = '(?![\\w.])'

/**
 * `1`, `1.`, `.5`, `1e-3`, `0xFF`, plus R's `L` integer and `i` complex
 * suffixes. Guarded rather than `\b`-anchored so the `1` in `model.1` is left
 * alone.
 */
const NUMBER = `${NAME_START}(?:0[xX][0-9a-fA-F]+|(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?)[Li]?${NAME_END}`

/**
 * The atomic modes plus the two classes that behave like them — what `class()`
 * answers and what the `as.*` family converts to. `list`, `vector` and `matrix`
 * read as constructors far more often than as type names, so they sit with the
 * builtin functions below instead.
 */
const TYPES = `${NAME_START}(?:numeric|character|logical|integer|double|complex|factor|data\\.frame)${NAME_END}`

/**
 * Base functions worth their bytes.
 *
 * The list is deliberately short. A name left out of it still reads as a call
 * wherever a `(` follows, so the only names that earn a place are the ones a
 * reader expects to recognise even when passed by name — `sapply(x, mean)`.
 * The `is.*` / `as.*` / `Sys.*` families are matched by shape instead: the list
 * would be enormous, packages add to it, and a user-defined S3 method like
 * `is.station` belongs in the same colour anyway.
 */
const BUILTINS =
  `${NAME_START}(?:(?:is|as)\\.[A-Za-z][\\w.]{0,32}|Sys\\.[a-z]\\w{0,32}|` +
  'c|length|n(?:row|col|ames|char)|seq(?:_len|_along)?|rep|paste0?|sprintf|print|cat|message|warning|' +
  'stop(?:ifnot)?|sum|mean|min|max|round|sqrt|log|[lsvm]apply|apply|do\\.call|head|tail|g?sub|grepl?|strsplit|' +
  'to(?:upper|lower)|unlist|which|sort|unique|[rc]bind|ifelse|invisible|list|vector|matrix|tryCatch|Map|Reduce|' +
  `Filter|file\\.(?:exists|path))${NAME_END}`

/** printf-style placeholders, which reach R through `sprintf` and `format`. */
const FORMAT = '%[-+ #0]*(?:\\d+|\\*)?(?:\\.(?:\\d+|\\*))?[diouxXeEfgGsaA%]'

const r: Grammar = {
  name: 'r',
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        // Roxygen is a comment to R and documentation to everyone else. It gets
        // a state so its `@param` tags can be scoped inside the block.
        { match: "#'", scope: 'comment.doc', push: 'roxygen' },
        { match: '#[^\\n]*', scope: 'comment' },

        { include: 'strings' },
        { match: NUMBER, scope: 'number' },

        // `name <- function(…)` and `name <- \(…)`. The keyword is left to the
        // rules below — they are what pushes `params` — so this only claims the
        // name, which is the half R has no keyword for.
        {
          match: `${NAME_START}(${ID}|${BACKTICK})([ \\t]*)(<<-|<-|=)([ \\t]*)(?=function${NAME_END}|\\\\[ \\t]*\\()`,
          scope: ['function', null, 'operator'],
        },

        // The `(` is consumed here so parameters get their own state.
        {
          match: `${NAME_START}(function)([ \\t]*)(\\()`,
          scope: ['keyword.declaration', null, 'punctuation.bracket'],
          push: 'params',
        },
        // `\(x) x + 1`, the shorthand added in R 4.1.
        {
          match: '(\\\\)([ \\t]*)(\\()',
          scope: ['keyword.declaration', null, 'punctuation.bracket'],
          push: 'params',
        },
        {
          match: `${NAME_START}function${NAME_END}`,
          scope: 'keyword.declaration',
        },

        // `library(dplyr)` takes a bare package name, so the argument is a
        // namespace rather than an ordinary variable. Consuming the `(` means
        // this rule has to push `args` itself to keep the bracket balanced.
        {
          match: `${NAME_START}(library|require)([ \\t]*)(\\()([ \\t]*)(${ID})`,
          scope: ['keyword.import', null, 'punctuation.bracket', null, 'namespace'],
          push: 'args',
        },
        {
          match: `${NAME_START}(?:library|require|requireNamespace)${NAME_END}`,
          scope: 'keyword.import',
        },

        // `$` is R's member access and `@` reaches an S4 slot; matching at the
        // operator keeps `df$mean` from reading as the builtin.
        {
          match: `([$@])([ \\t]*)(${ID})([ \\t]*)(\\()`,
          scope: ['punctuation', null, 'function.method', null, 'punctuation.bracket'],
          push: 'args',
        },
        {
          match: `([$@])([ \\t]*)(${ID}|${BACKTICK})`,
          scope: ['punctuation', null, 'variable.member'],
        },

        {
          match: `${NAME_START}(${ID})(:::?)`,
          scope: ['namespace', 'operator'],
        },

        {
          match: `${NAME_START}(?:if|else|for|while|repeat|break|next|return)${NAME_END}`,
          scope: 'keyword.control',
        },
        // `%in%` is spelled like an operator but reads like `in` does elsewhere.
        { match: '%in%', scope: 'keyword.operator' },
        { match: `${NAME_START}in${NAME_END}`, scope: 'keyword.operator' },

        { match: `${NAME_START}(?:TRUE|FALSE)${NAME_END}`, scope: 'boolean' },
        {
          match: `${NAME_START}(?:NULL|NA(?:_(?:integer|real|complex|character)_)?|Inf|NaN)${NAME_END}`,
          scope: 'constant.builtin',
        },
        { match: '\\.\\.\\.', scope: 'variable.parameter' },

        { match: TYPES, scope: 'type.builtin' },
        { match: BUILTINS, scope: 'function.builtin' },
        { match: BACKTICK, scope: 'variable' },

        // Before the name-shape rules below, unlike in most grammars here:
        // R capitalises plenty of ordinary functions (`Map`, `Reduce`,
        // `Sys.time`), so a following `(` outranks the capital.
        { match: `${NAME_START}${ID}(?=[ \\t]*\\()`, scope: 'function.call' },

        // SCREAMING_CASE reads as a constant, CapWords as a class — the R6 and
        // S4 generators (`Person$new()`) are the names this is aimed at. Both
        // need a second character, or the one-letter names R code leans on
        // (`T`, `F`, `N`, `X`) would all come out as classes.
        { match: `${NAME_START}[A-Z][A-Z0-9_]+${NAME_END}`, scope: 'constant' },
        { match: `${NAME_START}[A-Z][\\w.]{1,64}${NAME_END}`, scope: 'type' },

        // `:` is a sequence operator in R rather than a delimiter, so it is
        // scoped with the operators and only `,` and `;` separate.
        {
          match: '<<-|<-|->>|->|\\|>|:::?|%[^%\\n]*%|&&|\\|\\||[-+*/^!<>=]=?|[~?:@$]',
          scope: 'operator',
        },

        { match: '\\(', scope: 'punctuation.bracket', push: 'args' },
        { match: '[)\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;]', scope: 'punctuation.delimiter' },
      ],
    },

    /**
     * Inside `(…)`. Every `(` pushes this, which is the only thing that tells
     * the named argument in `f(n = 5)` from the assignment in `n = 5`.
     */
    args: {
      rules: [
        { match: '\\)', scope: 'punctuation.bracket', pop: true },
        {
          match: `${NAME_START}(${ID}|${BACKTICK})([ \\t]*)(=)(?!=)`,
          scope: ['variable.parameter', null, 'operator'],
        },
        { include: 'expression' },
      ],
    },

    /** A parameter list, where a bare name is a parameter rather than a value. */
    params: {
      rules: [
        // Repeats the named-argument rule from `args` rather than inheriting it,
        // because here the right-hand side is a default that has to stop the
        // bare-name rule below from claiming the value in `f(x = y, z)`.
        {
          match: `${NAME_START}(${ID}|${BACKTICK})([ \\t]*)(=)(?!=)`,
          scope: ['variable.parameter', null, 'operator'],
          push: 'default-value',
        },
        {
          match: `${NAME_START}(?:${ID}|${BACKTICK})(?=[ \\t]*[,)])`,
          scope: 'variable.parameter',
        },
        { include: 'args' },
      ],
    },

    /** A default value: expression syntax, but no more parameter names. */
    'default-value': {
      rules: [{ match: '(?=[,)])', pop: true }, { include: 'expression' }],
    },

    /** One `#'` line. The zero-width `$` ends it without eating the newline. */
    roxygen: {
      default: 'comment.doc',
      rules: [
        { match: '@\\w+', scope: 'decorator' },
        { match: '$', pop: true },
      ],
    },

    strings: {
      rules: [
        // A raw string is `r"(…)"`, with any of three bracket pairs and any
        // number of dashes for padding. Matching the dashes exactly would need
        // a backreference, so the closer accepts any run of them.
        {
          match: '([rR])(["\'][-]*[(\\[{])',
          scope: ['string.special', 'string'],
          push: 'raw-string',
        },
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
      ],
    },

    'string-body': {
      rules: [
        // `\u{…}` and `\U{…}` share one alternative because the brace already
        // says where the escape ends; only the braceless forms need their own
        // digit counts.
        {
          match:
            '\\\\(?:x[0-9a-fA-F]{1,2}|[uU]\\{[0-9a-fA-F]{1,8}\\}|u[0-9a-fA-F]{1,4}|U[0-9a-fA-F]{1,8}|[0-7]{1,3}|.)',
          scope: 'string.escape',
        },
        { match: FORMAT, scope: 'string.special' },
      ],
    },

    'string-double': {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { match: '"', scope: 'string', pop: true },
        // R strings may span lines, but an unterminated one should not swallow
        // the file. Stopping at a blank line is the compromise: it is never
        // inside a real literal, and it bounds the damage to one paragraph.
        { match: '\\n[ \\t]*\\n', pop: true },
      ],
    },
    'string-single': {
      default: 'string',
      rules: [
        { include: 'string-body' },
        { match: "'", scope: 'string', pop: true },
        { match: '\\n[ \\t]*\\n', pop: true },
      ],
    },

    /**
     * Raw string contents: no escapes, and the closer is a bracket followed by
     * the opening quote character. A body holding `)"` — legal, if perverse —
     * ends the literal early.
     */
    'raw-string': {
      default: 'string',
      rules: [{ match: '[)\\]}][-]*["\']', pop: true }],
    },
  },
}

export default r

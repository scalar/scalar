import type { Grammar } from '../core/types'

/**
 * Perl.
 *
 * Perl gives most of its punctuation several jobs, so nearly all of this
 * grammar is about telling the readings apart:
 *
 * - `/` opens a pattern only where a term can start, and what says so is the
 *   token in front of it — an opener, a delimiter, an operator, or one of the
 *   list operators and statement keywords that take a pattern next. That token
 *   is matched and scoped along with the pattern rather than looked behind for.
 *   The cost is that a `/…/` nobody introduces, such as one opening a
 *   statement, reads as division; the gain is that no rule starts with a
 *   lookbehind, which is both faster and the only way to see past a newline.
 * - `%` and `&` are sigils only when glued to a name, so `$a % $b` stays modulo
 *   and `$a && $b` stays a conjunction. `$total%$count` is read as a hash,
 *   which is the price of recognising `%ENV` without demanding a space.
 * - `#` starts a comment unless it is the second character of `$#array`. The
 *   `$#` rule starts one character further left, and leftmost-match settles it
 *   whatever the rule order is.
 * - `<<` opens a heredoc only when a marker follows it, and the body starts on
 *   the *next* line, so `my $sql = <<~SQL;` keeps the rest of the line as code.
 * - Quote-likes get one state per closing delimiter. Matching the opener's
 *   partner in a single pattern needs a backreference, which the compiler
 *   rejects.
 *
 * Two deliberate gaps follow from that last point. Only `()`, `{}`, `[]` and
 * `/` are recognised as quote-like delimiters: `q!…!`, `m|…|`, `s#…#…#` and the
 * rest of the arbitrary-delimiter zoo render as ordinary code. And `s`/`tr`/`y`
 * take a paired delimiter only as `s{…}{…}` — `s(…)(…)` and `s{…}[…]` leave the
 * replacement half scoped as code.
 *
 * Ordinary barewords deliberately match no rule and inherit the block
 * foreground, which keeps both the markup and the visual noise down.
 */

/** A bareword, optionally package-qualified: `strict`, `Data::Dumper`. */
const NAME = '[A-Za-z_]\\w*(?:::\\w+)*'

/**
 * The body of a `/`-delimited pattern. The repetition is capped because the
 * rule is retried at every position a term could start: an uncapped scan that
 * runs to the end of a long line and then fails costs O(n²), which is a denial
 * of service rather than a wrong colour. A pattern longer than the cap simply
 * is not recognised.
 */
const PAT = '(?:[^/\\\\\\n]|\\\\.){0,240}'

/** Trailing modifiers: `/gi`, `s///ee`, `tr///dr`. */
const MODS = '[a-z]*'

/**
 * A bare `/…/` match against `$_`. At least one body character is required so
 * `$x // 5` stays the defined-or operator, and the body is capped for the same
 * reason `PAT` is.
 */
const REGEX = `/(?:[^/\\\\\\n]|\\\\.){1,240}/${MODS}`

/**
 * The operators after which a `/` opens a pattern rather than dividing. `!` is
 * in there for `if (!/x/)`, and `=~`/`!~` come first so the longer spelling
 * wins over the `=` and `!` that start them.
 */
const BEFORE_REGEX = '=~|!~|=>|&&|\\|\\||[=!]=|[=!?~]'

/** The single-part quote-likes. Longest first, so `qq(` is not read as `q`. */
const QUOTE = '\\b(?:qq|qw|qx|qr|q|m)'

/** The two-part quote-likes: pattern and replacement. */
const SUBST = '\\b(?:s|tr|y)'

/**
 * printf-style placeholders, which Perl code is full of.
 *
 * Every quantifier is capped. `0` is both a flag and a width digit, so an
 * uncapped `[-+ 0#]*` splits a run of zeros against the width group at every
 * position and then fails on the missing conversion character — quadratic on a
 * string of zeros, which is untrusted input like any other. The caps are wider
 * than any real format spec.
 */
const FORMAT = '%[-+ 0#]{0,8}(?:\\d{1,6}|\\*)?(?:\\.\\d{1,6})?[sdfgeExXobcu%]'

const perl: Grammar = {
  name: 'perl',
  aliases: ['pl', 'pm'],
  states: {
    root: {
      rules: [
        { match: '^#!.*', scope: 'comment' },

        // POD only starts at column 0, which is also the only place Perl
        // accepts it. Everything up to `=cut` is documentation.
        { match: '^=[a-zA-Z]\\w*', scope: 'comment.doc', push: 'pod' },
        // Whatever follows is data for the script, not source.
        { match: '^__(?:END|DATA)__', scope: 'keyword', push: 'data' },
        { match: '#[^\\n]*', scope: 'comment' },

        // ---- heredocs ------------------------------------------------------
        // The marker is not remembered — that needs a backreference — so the
        // body ends at the first line holding only a bare word.
        {
          match: '(<<~?)(")(\\w+)(")',
          scope: ['operator', 'string', 'string.special', 'string'],
          push: 'heredoc-line',
        },
        {
          match: "(<<~?)(')(\\w+)(')",
          scope: ['operator', 'string', 'string.special', 'string'],
          push: 'heredoc-line-raw',
        },
        {
          match: '(<<~)(\\w+)',
          scope: ['operator', 'string.special'],
          push: 'heredoc-line',
        },
        // An undecorated `<<` has to look like a marker, or `1 << $bits` would
        // swallow the rest of the file.
        {
          match: '(<<)([A-Z_]\\w*)',
          scope: ['operator', 'string.special'],
          push: 'heredoc-line',
        },

        // ---- quoted literals -----------------------------------------------
        { match: '"', scope: 'string', push: 'string-double' },
        { match: "'", scope: 'string', push: 'string-single' },
        { match: '`', scope: 'string', push: 'backtick' },

        // One state per closing delimiter, each tracking its own nesting so
        // `m{\\d{2}}` and `qw(a (b))` close where they should. A `qr{…}` body is
        // scoped as a string rather than a regexp: `regexp` is reserved for the
        // `/…/` forms, which are what read as a pattern at a glance.
        {
          match: `(${QUOTE})(\\()`,
          scope: ['keyword.operator', 'string'],
          push: 'q-paren',
        },
        {
          match: `(${QUOTE})(\\{)`,
          scope: ['keyword.operator', 'string'],
          push: 'q-brace',
        },
        {
          match: `(${QUOTE})(\\[)`,
          scope: ['keyword.operator', 'string'],
          push: 'q-bracket',
        },

        // `s{…}{…}` needs three states because the two halves are separate
        // literals; the `/`-delimited form below fits in one pattern.
        {
          match: `(${SUBST})\\{`,
          scope: ['keyword.operator'],
          rest: 'string',
          push: 'subst',
        },

        // ---- patterns -------------------------------------------------------
        {
          match: `(${SUBST})(/${PAT}/${PAT}/${MODS})`,
          scope: ['keyword.operator', 'regexp'],
        },
        {
          match: `(\\b(?:qr|m))(/${PAT}/${MODS})`,
          scope: ['keyword.operator', 'regexp'],
        },
        // A bare `/…/` is an implicit match against `$_`, and what says it is
        // one is the token in front of it. That token is matched and scoped
        // here rather than looked behind for, the way `ruby.ts` does it: a
        // lookbehind at the head of a rule costs the merged alternation its
        // first-character scan — 10x on whitespace-heavy input — and a bounded
        // one cannot see past a newline or a column-aligning run of spaces, so
        // `$total          / $count / 2` came out as a pattern. Anything not
        // listed here ends a term, which makes the `/` a division.
        //
        // `{` is split out so it can still push `brace`. Consuming it without
        // pushing would let a block's `}` close an enclosing `@{…}`.
        {
          match: `([(\\[])(\\s*)(${REGEX})`,
          scope: ['punctuation.bracket', null, 'regexp'],
        },
        {
          match: `(\\{)(\\s*)(${REGEX})`,
          scope: ['punctuation.bracket', null, 'regexp'],
          push: 'brace',
        },
        {
          match: `([,;:])(\\s*)(${REGEX})`,
          scope: ['punctuation.delimiter', null, 'regexp'],
        },
        // The list operators and statement keywords that take a pattern next.
        // Each keeps the scope its own rule further down would have given it.
        {
          match: `(\\b(?:return|if|elsif|unless|while|until|when)\\b)(\\s*)(${REGEX})`,
          scope: ['keyword.control', null, 'regexp'],
        },
        {
          match: `(\\b(?:split|grep|map|push|join|print|die)\\b)(\\s*)(${REGEX})`,
          scope: ['function.builtin', null, 'regexp'],
        },
        {
          match: `(\\b(?:and|or|not)\\b)(\\s*)(${REGEX})`,
          scope: ['keyword.operator', null, 'regexp'],
        },
        {
          match: `(${BEFORE_REGEX})(\\s*)(${REGEX})`,
          scope: ['operator', null, 'regexp'],
        },

        // ---- sigils ---------------------------------------------------------
        // `$#{$ref}` and `$#array` both give the last index of an array.
        { match: '\\$#\\{', scope: 'variable', push: 'deref' },
        { match: `\\$#\\$*${NAME}`, scope: 'variable' },

        { match: '[$@%]_(?!\\w)', scope: 'variable.builtin' },
        {
          match: '(?:[@%](?:ARGV|ENV|INC)|\\$(?:0|ARGV))(?!\\w)',
          scope: 'variable.builtin',
        },

        // `${name}` and `@{name}` are just a fenced name; `@{$ref}`, `${\ … }`
        // and the `@{[ … ]}` idiom hold an expression, so they push a state.
        { match: '[$@%]\\{\\^?\\w+\\}', scope: 'variable' },
        { match: '[$@%&]\\$*\\{', scope: 'variable', push: 'deref' },
        { match: `[$@%]\\$*${NAME}`, scope: 'variable' },
        // Capture groups and the punctuation variables that show up in real
        // code. `$'` and `` $` `` are left out: mistaking either for a sigil
        // would take the following quote with it.
        {
          match: '\\$(?:\\d+|\\^\\w|[!@/\\\\,;.&+])',
          scope: 'variable.builtin',
        },

        // `&` is a code sigil only when glued to a name and not sitting after
        // something that could be its left operand, which is what keeps the
        // second `&` of `$a && $b` out of it. The lookbehind sits after the
        // `&` rather than in front: it says the same thing either way, but this
        // order leaves the rule a known first character, so the merged
        // alternation keeps its first-character scan.
        { match: `&(?<![\\w$)\\]}&]&)\\$*${NAME}`, scope: 'function.call' },

        // `<$fh>`, `<STDIN>`, `<>` — readline, not a comparison. The `\\w*`
        // never spans a space, so `$a < $b > $c` is unaffected.
        { match: '<\\$?\\w*>', scope: 'variable.builtin' },

        // ---- names -----------------------------------------------------------
        {
          match: `(->)(${NAME})(?=[ \\t]*\\()`,
          scope: ['operator', 'function.method'],
        },
        { match: `(->)(${NAME})`, scope: ['operator', 'variable.member'] },

        // A bareword subscript is auto-quoted: `$row{sku}`. The rule cannot see
        // what the `{` is glued to, so a space-free one-statement block —
        // `if ($x) {next}` — reads as a subscript and colours `next` a
        // property. A hash lookup is far more common than that spelling, and
        // the usual `{ next }` keeps its keyword because a space is not a word
        // character.
        {
          match: '(\\{)(-?\\w+)(\\})',
          scope: ['punctuation.bracket', 'property', 'punctuation.bracket'],
        },
        // So is the left side of a fat comma. Before the keyword rules, so
        // `(if => 1)` reads as a key.
        { match: '\\b[A-Za-z_]\\w*(?=[ \\t]*=>)', scope: 'property' },

        {
          match: `(\\bpackage)([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'namespace'],
        },
        // `(?!v\\d)` keeps `use v5.36` out, so the version stays a number.
        {
          match: `(\\b(?:use|no|require))([ \\t]+)((?!v\\d)${NAME})`,
          scope: ['keyword.import', null, 'namespace'],
        },
        { match: '\\b(?:use|no|require)\\b', scope: 'keyword.import' },
        // `NAME`, not `\w+`, so `sub Foo::bar {}` names the whole sub the way
        // `package Foo::bar` already does.
        {
          match: `(\\bsub)([ \\t]+)(${NAME})`,
          scope: ['keyword.declaration', null, 'function'],
        },

        {
          match: '\\b(?:if|elsif|else|unless|while|until|foreach|for|do|last|next|redo|return|goto|given|when|eval)\\b',
          scope: 'keyword.control',
        },
        {
          match: '\\b(?:sub|my|our|local|state|package)\\b',
          scope: 'keyword.declaration',
        },
        { match: '\\b(?:BEGIN|END|AUTOLOAD|DESTROY)\\b', scope: 'keyword' },
        {
          match: '\\b(?:xor|cmp|and|or|not|eq|ne|lt|gt|le|ge|x)\\b',
          scope: 'keyword.operator',
        },
        { match: '\\bundef\\b', scope: 'constant.builtin' },
        {
          match: '\\b__(?:PACKAGE|FILE|LINE|SUB)__\\b',
          scope: 'variable.special',
        },
        { match: '\\b(?:STDIN|STDOUT|STDERR)\\b', scope: 'variable.builtin' },

        {
          match:
            '\\b(?:sprintf|printf|print|say|push|pop|shift|unshift|splice|keys|values|each|exists|delete|defined' +
            '|ref|bless|die|warn|join|split|grep|map|sort|reverse|scalar|wantarray|chomp|lcfirst|ucfirst|lc|uc' +
            '|length|substr|index|open|close|abs|int|sqrt|time|localtime|exit)\\b',
          scope: 'function.builtin',
        },

        // ---- numbers ---------------------------------------------------------
        { match: '\\b0[xX][0-9a-fA-F_]+\\b', scope: 'number' },
        { match: '\\b0[bB][01_]+\\b', scope: 'number' },
        // `0o644` since 5.34, `0644` since forever.
        { match: '\\b0[oO]?[0-7_]+\\b', scope: 'number' },
        // A v-string: `use v5.36`, `our $VERSION = v1.2.3`.
        { match: '\\bv\\d+(?:\\.\\d+)+\\b', scope: 'number' },
        {
          match: '\\b\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d+)?\\b',
          scope: 'number',
        },

        // A qualified name: `Data::Dumper->new`, `List::Util::sum`.
        { match: '\\b[A-Za-z_]\\w*(?=::)', scope: 'namespace' },
        // SCREAMING_CASE reads as a constant, CapWords as a class — between them
        // that covers `use constant` names and every package name without
        // shipping a list.
        { match: '\\b[A-Z][A-Z0-9_]+\\b', scope: 'constant' },
        { match: '\\b[A-Z]\\w*', scope: 'type' },
        { match: '\\b[a-z_]\\w*(?=[ \\t]*\\()', scope: 'function.call' },

        // ---- syntax ----------------------------------------------------------
        // Every `{` pushes, so a `}` always closes the thing that opened it and
        // cannot end a `@{…}` dereference early.
        { match: '\\{', scope: 'punctuation.bracket', push: 'brace' },
        {
          match:
            '<=>|=~|!~|->|=>|\\+\\+|--|\\*\\*=?|\\|\\|=?|&&=?|//=?|<<=?|>>=?|\\.\\.\\.?|::' +
            '|[-+*/%.^&|]=|[<>!=]=|[-+*/%.!~\\\\^&|<>=?]',
          scope: 'operator',
        },
        { match: '[()\\[\\]}]', scope: 'punctuation.bracket' },
        { match: '[,;:]', scope: 'punctuation.delimiter' },
      ],
    },

    pod: {
      default: 'comment.doc',
      rules: [{ match: '^=cut[^\\n]*', pop: true }],
    },
    /** Everything after `__END__`. No rules: the whole tail is one run. */
    data: {
      default: 'comment',
      rules: [],
    },

    // ---- string interiors ----------------------------------------------------
    /**
     * Shared by every interpolating literal. A non-interpolating one (`q{…}`,
     * `'…'` aside) shares it too, so `q{$x}` shows `$x` as a variable — the
     * price of three delimiter states instead of six.
     */
    interp: {
      rules: [
        {
          match: '\\\\(?:x\\{[0-9a-fA-F]{1,8}\\}|x[0-9a-fA-F]{1,2}|[0-7]{1,3}|N\\{[^}\\n]{0,60}\\}|.)',
          scope: 'string.escape',
        },
        { match: FORMAT, scope: 'string.special' },
        { match: `\\$#\\$*${NAME}`, scope: 'variable' },
        { match: '[$@]\\{\\^?\\w+\\}', scope: 'variable' },
        { match: '[$@]\\$*\\{', scope: 'variable', push: 'deref' },
        // A subscript chain is part of the interpolation: `$row->{tags}[0]`.
        // Every scan is capped so a line of `${` cannot go quadratic.
        {
          match: `[$@]\\$*(?:${NAME}|\\d+)(?:(?:->)?(?:\\[[^\\]\\n]{0,80}\\]|\\{[^}\\n]{0,80}\\})){0,6}`,
          scope: 'variable',
        },
      ],
    },

    'string-double': {
      default: 'string',
      // Nothing pops at the line break: a Perl string really does span lines.
      rules: [{ include: 'interp' }, { match: '"', pop: true }],
    },
    'string-single': {
      default: 'string',
      rules: [
        { match: "\\\\['\\\\]", scope: 'string.escape' },
        { match: "'", pop: true },
      ],
    },
    backtick: {
      default: 'string',
      rules: [{ include: 'interp' }, { match: '`', pop: true }],
    },

    // Nesting is tracked per delimiter family so a balanced inner pair does not
    // close the literal. Trailing modifiers on `m{…}i` are left unscoped: the
    // same states serve `q{…}`, where a following letter is the `x` operator.
    'q-paren': {
      default: 'string',
      rules: [{ match: '\\(', push: 'q-paren' }, { match: '\\)', pop: true }, { include: 'interp' }],
    },
    'q-brace': {
      default: 'string',
      rules: [{ match: '\\{', push: 'q-brace' }, { match: '\\}', pop: true }, { include: 'interp' }],
    },
    'q-bracket': {
      default: 'string',
      rules: [{ match: '\\[', push: 'q-bracket' }, { match: '\\]', pop: true }, { include: 'interp' }],
    },

    /** The pattern half of `s{…}{…}`; its closer hands over to `subst-mid`. */
    subst: {
      default: 'string',
      rules: [{ match: '\\{', push: 'q-brace' }, { match: '\\}', set: 'subst-mid' }, { include: 'interp' }],
    },
    /**
     * Between the halves. Perl allows whitespace and even a newline here, so
     * this waits for the second `{`; anything else means there was no second
     * half and the literal is already over.
     */
    'subst-mid': {
      rules: [
        { match: '([ \\t\\n]*)(\\{)', scope: [null, 'string'], set: 'subst-2' },
        { match: '(?=[\\s\\S])', pop: true },
      ],
    },
    'subst-2': {
      default: 'string',
      rules: [{ match: '\\{', push: 'q-brace' }, { match: `\\}${MODS}`, pop: true }, { include: 'interp' }],
    },

    // ---- heredocs -------------------------------------------------------------
    /** The rest of the opening line is code; the body starts after the newline. */
    'heredoc-line': {
      rules: [{ match: '\\n', set: 'heredoc' }, { include: 'root' }],
    },
    'heredoc-line-raw': {
      rules: [{ match: '\\n', set: 'heredoc-raw' }, { include: 'root' }],
    },
    heredoc: {
      default: 'string',
      rules: [{ match: '^[ \\t]*\\w+[ \\t]*$', scope: 'string.special', pop: true }, { include: 'interp' }],
    },
    /** `<<'EOF'`: the body is literal, so no escapes and no interpolation. */
    'heredoc-raw': {
      default: 'string',
      rules: [{ match: '^[ \\t]*\\w+[ \\t]*$', scope: 'string.special', pop: true }],
    },

    // ---- balanced nesting -----------------------------------------------------
    /** The inside of `@{…}` / `${…}` / `$#{…}`: an expression, then the closer. */
    deref: {
      rules: [{ match: '\\}', scope: 'variable', pop: true }, { include: 'root' }],
    },
    /** Tracks brace depth so a block or a hash cannot close an enclosing state. */
    brace: {
      rules: [{ match: '\\}', scope: 'punctuation.bracket', pop: true }, { include: 'root' }],
    },
  },
}

export default perl

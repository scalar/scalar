import type { Grammar } from '../core/types'

/**
 * Haskell.
 *
 * Three things decide whether a Haskell highlighter is any good, and all three
 * are lexical rather than syntactic:
 *
 * - **Dashes.** A comment is two or more dashes *not* followed by another symbol
 *   character, so `-->` and `--|` are ordinary user-defined operators while
 *   `-- |` is a Haddock doc comment. Getting this wrong greys out working code.
 * - **The apostrophe.** `'a'` is a character literal and the identical quote in
 *   `xs'` is just a letter. As in OCaml, a literal always closes and a name
 *   never does, and both are blocked by a lookbehind from firing mid-name.
 * - **Case.** Every capitalised name is a constructor *or* a type constructor,
 *   and nothing in the token itself says which. The grammar answers that with
 *   position: a small `signature` state runs from `::` to the end of the line
 *   and a `data-body` state runs to the next column-zero declaration, and inside
 *   those a capitalised name is a type. Everywhere else it is a constructor.
 *
 * What that deliberately gets wrong:
 *
 * - A signature broken across lines only keeps its colours when each
 *   continuation *starts* with `->` or `=>`, which is the dominant style. A
 *   trailing-arrow layout drops back to constructor colours on the later lines.
 *   The test runs only while the signature is open, so a leading arrow that
 *   continues something else — a `case` alternative laid out as `Left e` then
 *   `-> Just e` — keeps constructor colours, which is what it should have.
 * - GADT syntax (`data T where C :: …`) has no `=`, so its constructors read as
 *   types.
 * - A signature that annotates several names at once (`a, b :: Int`) scopes
 *   none of them, because the rule stops at the comma.
 * - Only a column-zero binding is recognised as a definition. Haskell's layout
 *   rule makes that reliable at the top level, but the equations inside `where`
 *   and `let` are indented and stay unscoped — at that position a name is far
 *   more often applied than defined.
 * - Call sites are not scoped at all, because juxtaposition leaves nothing to
 *   recognise them by.
 *
 * Ordinary identifiers and type variables deliberately match no rule: they
 * inherit the block's foreground, which keeps both the markup and the visual
 * noise down.
 */

/**
 * Haskell's symbol alphabet. Operators are user-definable, so there is no fixed
 * list to match — any run of these characters is one operator.
 */
const SYM = '!#$%&*+./<=>?@\\\\^|~:-'

/**
 * A variable identifier, with the tail length-capped on purpose.
 *
 * `'` is a legal name character but is not a `\w`, so `\b` sits between every
 * `'` and the letter after it. In `a'a'a'…` — one valid name — that is a word
 * boundary every two characters, and a rule that matches a name and then tests a
 * lookahead would restart at each one and rescan the line. The cap bounds that;
 * names this long do not occur, and one that did would render unscoped.
 */
const LID = "[a-z_][A-Za-z0-9_']{0,128}"

/** A constructor, type or module name. Same cap, same reason. */
const UID = "[A-Z][A-Za-z0-9_']{0,128}"

/** A module path: `Data`, `Data.Map.Strict`. */
const MODULE = `${UID}(?:\\.${UID}){0,32}`

/**
 * Guards the start of a keyword. `\b` is not enough on its own: `'` is not a
 * word character, so `\bin\b` happily fires inside the name `xs'in`.
 */
const START = "(?<![\\w'])"

/** Guards the end of a keyword, for the same reason. */
const END = "(?![\\w'])"

/**
 * `\n`, `\\`, `\"`, `\65`, `\x1F`, `\o17`, `\^C`, `\NUL`, `\&`.
 *
 * `[A-Z]{2,3}` stands in for the thirty-odd ASCII control names rather than
 * listing them; it accepts nonsense like `\XYZ` too, which costs nothing since
 * that is not valid Haskell anyway. The final catch-all matters more than the
 * precise forms: it guarantees `\\` and `\"` are consumed as a unit, so a
 * closing quote can never be misread. It excludes newlines so that a backslash
 * left dangling at end of line cannot swallow the line break.
 */
const ESCAPE = '\\\\(?:\\^[\\x40-\\x5F]|x[0-9a-fA-F]+|o[0-7]+|\\d+|[A-Z]{2,3}|&|[^\\n])'

const haskell: Grammar = {
  name: 'haskell',
  aliases: ['hs'],
  states: {
    root: { rules: [{ include: 'expression' }] },

    expression: {
      rules: [
        { include: 'comments' },
        { include: 'literals' },

        // ---- module and import headers -------------------------------------
        // The export list is types and names rather than expressions, so it
        // runs in its own state until the `where` that closes the header.
        {
          match: `${START}(module)([ \\t]+)(${MODULE})`,
          scope: ['keyword.declaration', null, 'namespace'],
          push: 'exports',
        },
        {
          match: `${START}(import)([ \\t]+)(?:(qualified)([ \\t]+))?(${MODULE})`,
          scope: ['keyword.import', null, 'keyword', null, 'namespace'],
        },
        // `as` is a keyword only in an import, and `as` is a common name for a
        // list elsewhere — requiring a module name after it is what keeps
        // `zipWith f as bs` out of this rule.
        {
          match: `${START}(as)([ \\t]+)(${MODULE})`,
          scope: ['keyword', null, 'namespace'],
        },
        // The fallback for the two import modifiers, for a header the rule above
        // could not match whole — a half-typed one, most often.
        { match: `${START}(?:hiding|qualified)${END}`, scope: 'keyword' },

        // ---- declarations ---------------------------------------------------
        {
          match: `${START}(data|newtype)([ \\t]+)(?:(family|instance)([ \\t]+))?(${MODULE})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', null, 'type'],
          push: 'data-body',
        },
        // A type synonym has no constructors, so its whole right-hand side is a
        // type — `signature`, not `data-body`.
        {
          match: `${START}(type)([ \\t]+)(?:(family|instance)([ \\t]+))?(${MODULE})`,
          scope: ['keyword.declaration', null, 'keyword.declaration', null, 'type'],
          push: 'signature',
        },
        // A class or instance head is a type until its `where`, which is one of
        // the two things `signature` pops on.
        {
          match: `${START}(?:class|instance|deriving)${END}`,
          scope: 'keyword.declaration',
          push: 'signature',
        },

        // ---- keywords -------------------------------------------------------
        // Ahead of the definition rules below, so a declaration that starts in
        // column zero is read as a keyword rather than as a binding named
        // `data` or `import`.
        {
          match: `${START}(?:if|then|else|case|of|do)${END}`,
          scope: 'keyword.control',
        },
        {
          match: `${START}(?:let|in|where|module|forall|family|foreign|pattern|default|infix[lr]?|via|stock|anyclass)${END}`,
          scope: 'keyword.declaration',
        },
        { match: `${START}import${END}`, scope: 'keyword.import' },

        // ---- definition sites ------------------------------------------------
        // The name a signature annotates, at any indentation — this is the one
        // definition inside a `where` block the grammar can see.
        { match: `^([ \\t]*)(${LID})(?=[ \\t]*::)`, scope: [null, 'function'] },
        // A binding in column zero, either `name = …` or `name arg… = …`.
        // Haskell draws no line between a value and a function — `total = sum .
        // map price` is both — so both shapes read as a function.
        //
        // The second shape excludes a symbol character after the name, because
        // that is an infix definition (`a --> b = …`) whose left operand is a
        // parameter and not the thing being defined. The cost is that a bang
        // pattern in the first argument (`go !acc xs = …`) hides the name.
        {
          match: `^(${LID})(?=[ \\t]*=(?![${SYM}])|[ \\t]+[^\\s=${SYM}])`,
          scope: 'function',
        },

        // ---- names -----------------------------------------------------------
        { match: `${START}(?:True|False)${END}`, scope: 'boolean' },
        {
          match: `${START}(?:Nothing|Just|Left|Right|LT|EQ|GT|otherwise|undefined|mempty)${END}`,
          scope: 'constant.builtin',
        },
        {
          match: `${START}(?:putStrLn|putStr|print|show|read|error|mapM_?|map|filter|foldr|foldl'?|length|head|tail|reverse|concatMap|concat|zipWith|zip|elem|null|maybe|either|fromMaybe|forM_?|when|unless|return|pure|fmap|traverse|lookup|const|id|not|fst|snd|take|drop|sum|product|maximum|minimum|abs|div|mod|replicate|unwords|words|unlines|lines|flip)${END}`,
          scope: 'function.builtin',
        },
        { include: 'type-names' },
        // Outside a type, a capitalised name is a data constructor — a value —
        // so it reads as a constant rather than as a type.
        { match: `${START}${UID}`, scope: 'constant' },

        // There is deliberately no call rule. Haskell applies functions by
        // juxtaposition, so `f x` is indistinguishable from `a b`, and the one
        // shape a regex could recognise — a name before a `(` — is just as often
        // the head of an equation being defined (`go (x : xs) acc = …`).

        // `::` opens a type, and the guard leaves user operators such as `:::`
        // to the operator rule.
        { match: `::(?![${SYM}])`, scope: 'operator', push: 'signature' },

        { include: 'operators' },
      ],
    },

    // ---- comments ------------------------------------------------------------
    comments: {
      rules: [
        // A pragma is a block comment to the lexer but an instruction to the
        // compiler, so it reads as an annotation. It runs as a state because a
        // lazy `[\s\S]*?#-\}` would rescan to end of input at every `{-#`.
        { match: '\\{-#', scope: 'decorator', push: 'pragma' },
        { match: '\\{-[|^]', scope: 'comment.doc', push: 'block-doc' },
        { match: '\\{-', scope: 'comment', push: 'block-comment' },
        // Haddock. The space is required because `--|` is the operator `--|`,
        // which is exactly why Haddock is spelled `-- |`.
        { match: '--+[ \\t]+[|^][^\\n]*', scope: 'comment.doc' },
        // Two or more dashes open a comment only when what follows is not
        // another symbol character: `-->`, `--|` and `--<>` are operators, and
        // the `+` cannot give back below two, so they fail here and fall
        // through to the operator rule.
        { match: `--+(?![${SYM}])[^\\n]*`, scope: 'comment' },
      ],
    },

    // Block comments nest, so the opener pushes another copy of the state and
    // only the matching `-}` pops. A `"-}"` inside a string inside a comment
    // ends the comment early — GHC lexes strings in comments, we do not.
    'block-comment': {
      default: 'comment',
      rules: [
        { match: '\\{-', push: 'block-comment' },
        { match: '-\\}', pop: true },
      ],
    },
    'block-doc': {
      default: 'comment.doc',
      rules: [
        { match: '\\{-', push: 'block-doc' },
        { match: '-\\}', pop: true },
      ],
    },
    pragma: {
      default: 'decorator',
      rules: [{ match: '#-\\}', pop: true }],
    },

    // ---- literals ------------------------------------------------------------
    literals: {
      rules: [
        { match: '"', scope: 'string', push: 'string' },
        // A char literal always closes; the same quote at the end of `xs'` is an
        // ordinary letter. The lookbehind is what stops the quote that ends a
        // name from pairing with the one that opens the next literal.
        { match: `${START}'(?:[^'\\\\\\n]|${ESCAPE})'`, scope: 'string' },

        // Hex covers hex floats (`0x1.8p3`); underscores are NumericUnderscores.
        {
          match: `${START}0[xX][0-9a-fA-F_]+(?:\\.[0-9a-fA-F_]+)?(?:[pP][-+]?\\d+)?`,
          scope: 'number',
        },
        { match: `${START}0[oO][0-7_]+`, scope: 'number' },
        { match: `${START}0[bB][01_]+`, scope: 'number' },
        // A digit is required after the point, so the range `[1..10]` keeps its
        // `..` instead of losing a dot to the float.
        {
          match: `${START}\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][-+]?\\d[\\d_]*)?`,
          scope: 'number',
        },
      ],
    },

    string: {
      default: 'string',
      rules: [
        // A string gap — a backslash, whitespace across as many lines as it
        // likes, and a backslash. It has to beat the escape rule, which would
        // otherwise claim the backslash and the space as one escape.
        { match: '\\\\\\s+\\\\', scope: 'string.escape' },
        { match: ESCAPE, scope: 'string.escape' },
        { match: '"', scope: 'string', pop: true },
        // An unterminated string ends at the line break rather than swallowing
        // the rest of the file. A gap is matched above, so a legitimate
        // multi-line string survives this.
        { match: '$', pop: true },
      ],
    },

    // ---- types ---------------------------------------------------------------
    /** Shared by every state that reads a type, and by expressions. */
    'type-names': {
      rules: [
        // A qualified path: `Data.Map.insert`, `M.Map`. Claiming only the dot
        // leaves the name after it to the rules that follow, so `Map.lookup`
        // still reads as a builtin.
        //
        // `START` is what keeps the path from starting mid-identifier: without
        // it `myMap.lookup` reads as a qualified `Map.lookup`, and the `.` in
        // `showT.getName` becomes punctuation instead of the composition
        // operator. It also carries the cost: unanchored, a run of capitals
        // retries the `{0,32}` path and the `{0,128}` name cap at every column,
        // which measured 29x on a line of `AAAA…` under V8 and 9x under JSC.
        {
          match: `${START}(${MODULE})(\\.)`,
          scope: ['namespace', 'punctuation'],
        },
        {
          match: `${START}(?:Int(?:eger|8|16|32|64)?|Word(?:8|16|32|64)?|Float|Double|Char|String|Bool|Maybe|Either|Ordering|IO|Rational|FilePath|Text|ByteString|Map|Set)${END}`,
          scope: 'type.builtin',
        },
      ],
    },

    'type-body': {
      rules: [
        { include: 'comments' },
        // Type-level literals — `Nat`s and `Symbol`s under DataKinds.
        { include: 'literals' },
        { match: `${START}forall${END}`, scope: 'keyword.declaration' },
        { include: 'type-names' },
        // Inside a type every capitalised name is a type constructor. A
        // lowercase one is a type variable and stays unscoped, the same as any
        // other ordinary identifier.
        { match: `${START}${UID}`, scope: 'type' },
        { include: 'operators' },
      ],
    },

    /** A module export list: types and names, ending at the header's `where`. */
    exports: {
      rules: [
        {
          match: `${START}where${END}`,
          scope: 'keyword.declaration',
          pop: true,
        },
        { include: 'type-body' },
      ],
    },

    /**
     * A type: everything from `::` to the end of the line, plus the head of a
     * `class` or `instance` up to its `where`. Popping at the line break is what
     * keeps a runaway type from colouring the rest of the file.
     *
     * A multi-line signature stays open instead: the state carries across the
     * break when the next line continues it. Only the state already being open
     * can say that — a leading arrow on its own means nothing, since a `case`
     * alternative laid out as `Left e\n  -> Just e` starts with one too and its
     * constructors are values.
     */
    signature: {
      rules: [
        // Consuming the newline keeps the match non-empty. The lookahead is the
        // continuation test: an arrow carries on the type, and a comment line
        // between two arrow lines is passed over rather than ending the type.
        { match: '\\n(?![ \\t]*(?:->|=>|--))', pop: true },
        { include: 'exports' },
      ],
    },

    /**
     * The right-hand side of a `data` or `newtype`, which mixes the constructors
     * being declared with the types they hold.
     */
    'data-body': {
      rules: [
        // Layout: a line starting in column zero begins a new declaration, so
        // that is where this one ends.
        { match: '\\n(?=[^ \\t\\n])', pop: true },
        { include: 'comments' },
        { include: 'literals' },
        // The name right after `=` or `|` is the constructor being introduced;
        // every other capitalised name in the body is one of its field types.
        {
          match: `([=|])([ \\t]*)(${UID})`,
          scope: ['operator', null, 'constant'],
        },
        // A record field: the lowercase name an inline `::` annotates.
        { match: `${START}(${LID})(?=[ \\t]*::)`, scope: 'property' },
        {
          match: `${START}(?:deriving|where|forall|via|stock|anyclass|instance)${END}`,
          scope: 'keyword.declaration',
        },
        { include: 'type-names' },
        { match: `${START}${UID}`, scope: 'type' },
        { include: 'operators' },
      ],
    },

    // ---- operators and punctuation -------------------------------------------
    operators: {
      rules: [
        // Backticks turn a named function into an infix operator, so that is how
        // the whole `` `div` `` reads. The name cannot contain a backtick, which
        // bounds the scan.
        { match: `\`(?:${MODULE}\\.)?${LID}\``, scope: 'operator' },
        // One rule for every operator: Haskell lets users define their own out
        // of the symbol alphabet, so `>>=`, `<$>`, `-->` and `.&.` are not a
        // fixed list.
        { match: `[${SYM}]+`, scope: 'operator' },
        { match: '[()\\[\\]{}]', scope: 'punctuation.bracket' },
        { match: '[,;]', scope: 'punctuation.delimiter' },
      ],
    },
  },
}

export default haskell

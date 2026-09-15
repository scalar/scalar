import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { compile, highlight, registerLanguage, tokenize, tokenizeStream } from '../index'
import haskell from './haskell'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order. The registry is a module-level singleton and
// re-registering is idempotent.
registerLanguage(haskell)

const known = new Set(Object.keys(SCOPES))

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (code: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(code, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (code: string, lang: string): [string, string][] => {
  return runs(code, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (code: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(code, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

/**
 * An inventory module, written to hit everything a Haskell tokenizer trips
 * over: `{-# … #-}` pragmas, a qualified/hiding import header, block comments
 * that nest twice, the `-->` operator that looks like a comment, record and sum
 * declarations, a multi-line signature with a constraint, a `where` block, an
 * identifier ending in a prime beside a character literal, a string gap, and
 * every numeric literal form.
 */
const SAMPLE = `{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

-- | Inventory reporting, written to keep a Haskell highlighter honest.
--
-- Note that @-->@ and @--|@ are operators: a comment needs its dashes to be
-- followed by something that is not a symbol character.
module Inventory
  ( Item(..)
  , Catalogue
  , restock
  , tally
  ) where

import qualified Data.Map.Strict as Map
import           Data.Map.Strict (Map)
import           Data.Maybe (fromMaybe)
import           Prelude hiding (lookup)

{- A block comment that {- nests {- twice -} -} and only ends here. -}

data Item = Item
  { sku      :: String
  , quantity :: Int
  , price    :: Double
  } deriving (Eq, Show)

newtype Restock = Restock Int
  deriving (Eq, Ord, Show)

class Describable a where
  describe :: a -> String
  describe _ = "<no description>"

instance Describable Item where
  describe it = sku it ++ " x" ++ show (quantity it)

type Catalogue = Map String Item

epsilon :: Double
epsilon = 1.0e-9

maxBatch, minBatch :: Int
maxBatch = 1_000_000
minBatch = 0o17

masks :: [Int]
masks = [0xFF_FF, 0b1010, 0o777, 42]

scale :: Double
scale = 0x1.8p3

(-->) :: Bool -> Bool -> Bool
a --> b = not a || b

infixr 1 -->

describeAll :: (Describable a, Foldable t)
            => t a
            -> [String]
describeAll = foldr ((:) . describe) []

restock :: Catalogue
        -> String
        -> Int
        -> Catalogue
restock cat key n = Map.adjust bump key cat
  where
    bump it = it { quantity = quantity it + n \`div\` 2 }

tally :: [Item] -> Int
tally items = go items 0
  where
    go []         acc = acc
    go (x : xs') acc = go xs' (acc + quantity x)

banner :: String
banner = "usage: inventory \\"<file>\\"\\n\\
         \\  --verbose  print every row\\n"

bullet, newline' :: Char
bullet   = '\\8226'
newline' = '\\n'

main :: IO ()
main = do
  let cat = Map.fromList [("a-1", Item "a-1" 2 1.5)]
  case Map.lookup "a-1" cat of
    Nothing -> putStrLn "missing"
    Just it -> putStrLn (describe it)
  mapM_ (putStrLn . describe) (Map.elems cat)
  putStrLn (fromMaybe banner Nothing)
`

describe('haskell', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'haskell')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'haskell')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'haskell')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `haskell emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'haskell'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: a half-typed
    // pragma, an unclosed nested comment and a string stopped mid-gap are what
    // an editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'haskell')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('tells a declaration keyword from a control keyword', () => {
    assertHas('data Shape = Circle\n', 'haskell', 'data', 'keyword.declaration')
    assertHas('newtype Age = Age Int\n', 'haskell', 'newtype', 'keyword.declaration')
    assertHas('class Container f where\n', 'haskell', 'class', 'keyword.declaration')

    const flow = 'pick x = case x of\n  0 -> if True then 1 else 2\n'
    assertHas(flow, 'haskell', 'case', 'keyword.control')
    assertHas(flow, 'haskell', 'if', 'keyword.control')
    assertHas(flow, 'haskell', 'then', 'keyword.control')
  })

  it('separates a data constructor, a type constructor and a builtin type', () => {
    const decl = 'data Shape = Circle Double | Square Double\n'
    assertHas(decl, 'haskell', 'Shape', 'type')
    assertHas(decl, 'haskell', 'Circle', 'constant')
    assertHas(decl, 'haskell', 'Double', 'type.builtin')

    // The same capitalised name is a value in an expression and a type in a
    // signature, and nothing but position says which.
    assertHas('area s = Circle 1.0\n', 'haskell', 'Circle', 'constant')
    assertHas('area :: Shape -> Double\n', 'haskell', 'Shape', 'type')
    assertHas('area :: Shape -> Double\n', 'haskell', 'area', 'function')
    assertHas('v = Just 1\n', 'haskell', 'Just', 'constant.builtin')
  })

  it('reads a pragma as an annotation and keeps doc comments apart from prose', () => {
    assertHas('{-# LANGUAGE GADTs #-}\n', 'haskell', '{-# LANGUAGE GADTs #-}', 'decorator')
    assertHas('{- plain -}\n', 'haskell', '{- plain -}', 'comment')
    assertHas('{-| a doc block -}\n', 'haskell', '{-| a doc block -}', 'comment.doc')
    assertHas('-- | the answer\n', 'haskell', '-- | the answer', 'comment.doc')
    assertHas('x = 1 -- a note\n', 'haskell', '-- a note', 'comment')
  })

  it('tells a line comment from an operator built out of dashes', () => {
    // Two dashes followed by another symbol character are an operator; only a
    // non-symbol after them opens a comment.
    assertHas('a --> b = not a || b\n', 'haskell', '-->', 'operator')
    assertHas('a --| b = a\n', 'haskell', '--|', 'operator')
    const pairs = scoped('a --> b = not a || b\n', 'haskell')
    expect(pairs.some(([, s]) => s === 'comment')).toBeFalsy()
  })

  it('counts nested block comments instead of stopping at the first close', () => {
    const nested = '{- outer {- inner -} still a comment -}\nmain = pure ()\n'
    assertHas(nested, 'haskell', '{- outer {- inner -} still a comment -}', 'comment')
    // Proves the comment ended where it should: the code after it is code.
    assertHas(nested, 'haskell', 'main', 'function')
  })

  it('tells a character literal from the prime that ends a name', () => {
    assertHas("newline' = '\\n'\n", 'haskell', "'\\n'", 'string')
    assertHas("newline' = '\\n'\n", 'haskell', "newline'", 'function')
    // The quote that closes `xs'` must not pair with the one that opens `'x'`.
    assertHas("f xs' = 'x'\n", 'haskell', "'x'", 'string')
    const pairs = scoped("f xs' = 'x'\n", 'haskell')
    expect(pairs.some(([t]) => t === "' = '")).toBeFalsy()
  })

  it('keeps a string gap and its escapes inside one literal', () => {
    const gap = 'banner = "left\\\n         \\right\\n"\n'
    assertHas(gap, 'haskell', '\\\n         \\', 'string.escape')
    assertHas(gap, 'haskell', '\\n', 'string.escape')
    assertHas('s = "a \\"b\\" c"\n', 'haskell', '\\"', 'string.escape')
    // The gap spans a line break, so the literal is still open on the next line.
    assertHas(gap, 'haskell', 'right', 'string')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0xFF_FF', '0o17', '0b1010', '1_000_000', '1.0e-9', '0x1.8p3', '42']) {
      assertHas(`n = ${literal}\n`, 'haskell', literal, 'number')
    }
    // A digit is required after the point, so an enumeration keeps its `..`.
    assertHas('xs = [1..10]\n', 'haskell', '..', 'operator')
  })

  it('scopes an import path and its alias as namespaces', () => {
    const imp = 'import qualified Data.Map.Strict as Map\n'
    assertHas(imp, 'haskell', 'import', 'keyword.import')
    assertHas(imp, 'haskell', 'qualified', 'keyword')
    assertHas(imp, 'haskell', 'Data.Map.Strict', 'namespace')
    assertHas(imp, 'haskell', 'as', 'keyword')
    assertHas(imp, 'haskell', 'Map', 'namespace')
    assertHas('import Prelude hiding (lookup)\n', 'haskell', 'hiding', 'keyword')
    // A qualified use claims only the path, so the name after it keeps its scope.
    assertHas('v = Map.lookup k m\n', 'haskell', 'lookup', 'function.builtin')
  })

  it('reads a backtick-quoted name as an operator', () => {
    assertHas('half n = n `div` 2\n', 'haskell', '`div`', 'operator')
    // The same name applied normally keeps the scope it has everywhere else.
    assertHas('half n = div n 2\n', 'haskell', 'div', 'function.builtin')
  })

  it('scopes a record field as a property and its annotation as a type', () => {
    const rec = 'data Item = Item { sku :: String, qty :: Int }\n'
    assertHas(rec, 'haskell', 'sku', 'property')
    assertHas(rec, 'haskell', 'String', 'type.builtin')
    // The head of the declaration is a type; the name after `=` is its constructor.
    assertHas(rec, 'haskell', 'Item', 'type')
    assertHas(rec, 'haskell', 'Item', 'constant')
  })

  it('does not start a qualified path in the middle of a name', () => {
    // `fooBar.baz` is one camelCase name, a `.`, and another — not `foo` plus
    // the module `Bar`. The path rule needs the same left guard every other
    // name rule in the grammar has.
    for (const [code, name] of [
      ['q = fooBar.baz\n', 'Bar'],
      ['names = map (showT.getName) xs\n', 'T'],
      ['v = myMap.lookup k\n', 'Map'],
    ] as const) {
      const pairs = scoped(code, 'haskell')
      expect(
        pairs.some(([t, s]) => t === name && s === 'namespace'),
        `${name} read as a namespace in ${code}`,
      ).toBeFalsy()
    }

    // Composition gets one colour regardless of how its left operand is
    // spelled; before the guard, a capital before the dot turned it into
    // punctuation.
    assertHas('names = map (showT.getName) xs\n', 'haskell', '.', 'operator')
    assertHas('n = length.filter isOK $ xs\n', 'haskell', '.', 'operator')
    // A genuinely qualified name still resolves, path and all.
    assertHas('v = Data.Map.lookup k m\n', 'haskell', 'Data.Map', 'namespace')
    assertHas('v = Map.lookup k m\n', 'haskell', 'lookup', 'function.builtin')
  })

  it('scans a run of capitals no slower than it scans real code', () => {
    // Unanchored, the qualified-path rule retried its `{0,32}` path and its
    // `{0,128}` name cap at every column of a capital-led run — 146 KB of
    // uppercase took ~93 ms under V8 and ~1 s under JSC. The cost stayed linear
    // in the input, so the per-length ratio check in `test/languages.test.ts`
    // structurally cannot see it.
    //
    // The budget is the grammar's own throughput on ordinary Haskell rather
    // than a nanosecond count, because the two engines are an order of
    // magnitude apart on this grammar and no fixed number can straddle them.
    // Measured: healthy 0.3x under V8 and 1.1x under JSC, the regression 4.3x
    // to 10.4x on both.
    const compiled = compile(haskell)

    /** Best-of-six per-character cost, so a stray GC pause cannot fail a run. */
    const nsPerChar = (input: string): number => {
      let best = Number.POSITIVE_INFINITY
      for (let round = 0; round < 6; round++) {
        const started = performance.now()
        tokenizeStream(input, compiled, () => {})
        const ns = ((performance.now() - started) * 1e6) / input.length
        if (ns < best) best = ns
      }
      return best
    }

    const control = nsPerChar(SAMPLE.repeat(8))
    for (const input of ['A'.repeat(16000), 'AX'.repeat(8000), 'aA'.repeat(8000)]) {
      const ratio = nsPerChar(input) / control
      expect(ratio, `a run of capitals cost ${ratio.toFixed(1)}x what real Haskell costs`).toBeLessThan(3)
    }
  })

  it('keeps a leading arrow from turning a case alternative into a type', () => {
    // `signature` carries across the line break only while it is already open,
    // so a `case` alternative laid out with the arrow on its own line keeps
    // constructor colours instead of borrowing a signature's.
    const alt = 'f r = case r of\n  Left e\n    -> Just e\n  Right v\n    -> Nothing\n'
    assertHas(alt, 'haskell', 'Left', 'constant.builtin')
    assertHas(alt, 'haskell', 'Just', 'constant.builtin')
    assertHas(alt, 'haskell', 'Right', 'constant.builtin')
    assertHas(alt, 'haskell', 'Nothing', 'constant.builtin')
    expect(scoped(alt, 'haskell').some(([, s]) => s === 'type')).toBeFalsy()

    // A user constructor on an arrow line reads the same way.
    const user = 'g x = case x of\n  0\n    -> Circle 1.0\n'
    assertHas(user, 'haskell', 'Circle', 'constant')

    // The documented multi-line signature support is what pays for that, so it
    // still has to work — including across a comment line between two arrows.
    const sig =
      'describeAll :: (Describable a, Foldable t)\n            => t a\n            -> [Shape]\ndescribeAll = f\n'
    assertHas(sig, 'haskell', 'Describable', 'type')
    assertHas(sig, 'haskell', 'Shape', 'type')
    assertHas(sig, 'haskell', 'describeAll', 'function')
    assertHas('foo :: Shape\n  -- a note\n  -> Shape\nfoo = id\n', 'haskell', 'Shape', 'type')
    // And the signature still ends: the equation under it is code, not a type.
    const after = 'area :: Shape -> Double\narea s = Circle 1.0\n'
    assertHas(after, 'haskell', 'Circle', 'constant')
  })

  it('scopes a module header and the types in its export list', () => {
    const header = 'module Inventory\n  ( Item(..)\n  , tally\n  ) where\n'
    assertHas(header, 'haskell', 'Inventory', 'namespace')
    assertHas(header, 'haskell', 'Item', 'type')
    assertHas(header, 'haskell', 'where', 'keyword.declaration')
  })
})

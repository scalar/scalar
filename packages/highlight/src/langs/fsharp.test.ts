import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import fsharp from './fsharp'

registerLanguage(fsharp)

const known = new Set(Object.keys(SCOPES))

/**
 * Idiomatic F#, written to hit the shapes a regex tokenizer trips over: the
 * apostrophe as char delimiter, generic parameter and ordinary letter; nested
 * block comments; all five string flavours; and `(*)` used as a function.
 *
 * Backslashes are doubled and backticks escaped so the constant holds the F#
 * source verbatim.
 */
const sample = `namespace Contoso.Inventory

open System
open System.Collections.Generic

#nowarn "40"

/// A stock keeping unit. Prices are whole cents so no float drift creeps in.
type Sku =
    { Code: string
      Label: string
      Cents: int64
      Tags: Set<string> }

type Movement =
    | Received of qty: int * at: DateTime
    | Shipped of qty: int
    | Adjusted of delta: int * reason: string

exception OutOfStock of sku: string

[<Literal>]
let MaxBatch = 10_000

let private rates = dict [ "usd", 1.0m; "eur", 0.92m ]

/// Kept inline so the arithmetic stays generic over ^T.
let inline square (x: ^T) = x * x

let (|Empty|NonEmpty|) (xs: 'a list) =
    match xs with
    | [] -> Empty
    | _ -> NonEmpty xs

let describe (sku: Sku) (count: int) =
    let name = sku.Label.Trim()
    let qty' = max count 0
    $"{name}: %d{qty'} @ %.2f{float sku.Cents / 100.0}"

let rec applyAll (stock: Map<string, int>) moves =
    match moves with
    | [] -> stock
    | Received (qty, _) :: rest -> applyAll (Map.add "in" qty stock) rest
    | Shipped qty :: rest when qty > 0 -> applyAll stock rest
    | _ :: rest -> applyAll stock rest

type Ledger(name: string) =
    let entries = ResizeArray<Movement>()
    member val Owner = name with get, set
    member this.Add(m: Movement) =
        entries.Add m
        this
    member _.Count = entries.Count
    override this.ToString() = sprintf "Ledger(%s, %d)" this.Owner entries.Count

module Report =
    let header = @"sku,""qty"",value"
    let query =
        """
        SELECT sku, qty FROM stock WHERE qty < 10
        """
    let \`\`rows written\`\` = ref 0

    let target (root: string) = $@"{root}\\inventory.csv"

    let write (path: string) (rows: seq<string>) =
        use writer = IO.File.CreateText path
        for row in rows do
            writer.WriteLine row
            incr \`\`rows written\`\`
        printfn "wrote %i rows to %s" !\`\`rows written\`\` path

[<EntryPoint>]
let main argv =
    let hex, bits, big = 0xFFu, 0b1010y, 1_000_000L
    let ratio = 3.5e-2f
    let mul, add = (*), (+)
    let bullet = 'µ'
    let mid' = if bullet = 'µ' then 1 else 0
    let escaped = "tab\\there \\u00A9 2024\\n"
    (* a block comment (* nests *) all the way *)
    printfn "%A" (mul hex 2u, add 1 2, bits, big, ratio, mid', escaped)
    if argv.Length = 0 then 1 else 0
`

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

describe('fsharp', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(sample, 'fsharp')
        .map((t) => t.text)
        .join(''),
    ).toBe(sample)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(sample, 'fsharp')) {
      expect(sample.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(sample, 'fsharp')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `fsharp emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(sample, 'fsharp')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(sample)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A prefix that stops inside a nested comment, a triple-quoted string or an
    // interpolation is what an editor feeds a highlighter on every keystroke.
    const step = Math.max(1, Math.floor(sample.length / 60))
    for (let end = 0; end <= sample.length; end += step) {
      const prefix = sample.slice(0, end)
      expect(
        tokenize(prefix, 'fsharp')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declarations', () => {
    assertHas(sample, 'fsharp', 'if', 'keyword.control')
    assertHas(sample, 'fsharp', 'match', 'keyword.control')
    assertHas(sample, 'fsharp', 'let', 'keyword.declaration')
    assertHas(sample, 'fsharp', 'of', 'keyword.operator')
  })

  it('tells a value binding from a function binding', () => {
    // `let name = …` binds a value, `let rec applyAll stock moves = …` binds a
    // function, and the only difference in the source is what follows the name.
    assertHas(sample, 'fsharp', 'applyAll', 'function')
    assertHas(sample, 'fsharp', 'name', 'variable')
    // The apostrophe is a letter here, not the start of anything.
    assertHas(sample, 'fsharp', "mid'", 'variable')
  })

  it('tells a called member from an accessed one', () => {
    assertHas(sample, 'fsharp', 'Trim', 'function.method')
    assertHas(sample, 'fsharp', 'Cents', 'variable.member')
  })

  it('scopes a member definition and its self-identifier', () => {
    assertHas(sample, 'fsharp', 'this', 'variable.builtin')
    assertHas(sample, 'fsharp', 'Add', 'function')
  })

  it('tells builtin types from user types, and both from declarations', () => {
    assertHas(sample, 'fsharp', 'int64', 'type.builtin')
    assertHas(sample, 'fsharp', 'DateTime', 'type')
    assertHas(sample, 'fsharp', 'Sku', 'class')
    assertHas(sample, 'fsharp', 'Code', 'property')
  })

  it('tells a char literal from a generic parameter', () => {
    assertHas(sample, 'fsharp', "'µ'", 'string')
    assertHas(sample, 'fsharp', "'a", 'type')
    assertHas(sample, 'fsharp', '^T', 'type')
  })

  it('scopes escapes, format specifiers and interpolation separately', () => {
    assertHas(sample, 'fsharp', '\\u00A9', 'string.escape')
    // `""` is how a verbatim string spells a quote.
    assertHas(sample, 'fsharp', '""', 'string.escape')
    assertHas(sample, 'fsharp', '%d', 'string.special')
    assertHas(sample, 'fsharp', '{', 'interpolation')
  })

  it('reads (*) as the multiplication operator, not a comment', () => {
    assertHas(sample, 'fsharp', '(*)', 'operator')
    assertHas(sample, 'fsharp', '(+)', 'operator')
    assertHas(sample, 'fsharp', '(* a block comment (* nests *) all the way *)', 'comment')
  })

  it('scopes the F#-only spellings', () => {
    assertHas(sample, 'fsharp', '[<EntryPoint>]', 'decorator')
    assertHas(sample, 'fsharp', '(|Empty|NonEmpty|)', 'function')
    assertHas(sample, 'fsharp', '``rows written``', 'variable')
    assertHas(sample, 'fsharp', '#nowarn', 'keyword')
  })

  it('scopes an import and the namespace it names', () => {
    assertHas(sample, 'fsharp', 'open', 'keyword.import')
    assertHas(sample, 'fsharp', 'System.Collections.Generic', 'namespace')
  })

  it('stays linear on a run of colons inside an unclosed interpolation', () => {
    // The format-spec scan ran to the end of the line and then failed, once per
    // colon: 6.9 s at 20k colons before the cap. `: ` rather than `::`, because
    // the `(?![:=])` guard rejects a doubled colon before the scan starts and
    // would hide the regression.
    const code = `let s = $"{${': '.repeat(32_000)}`
    tokenize(code, 'fsharp') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'fsharp')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `${32_000} colons in an unclosed interpolation took ${elapsed.toFixed(0)}ms — the spec scan is rescanning`,
    ).toBeLessThan(1000)
  })

  it('covers every numeric literal form', () => {
    for (const literal of ['10_000', '0xFFu', '0b1010y', '1_000_000L', '3.5e-2f', '0.92m', '100.0']) {
      assertHas(sample, 'fsharp', literal, 'number')
    }
  })
})

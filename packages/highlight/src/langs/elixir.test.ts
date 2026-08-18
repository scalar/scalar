import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import elixir from './elixir'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; the registry is a module-level singleton and
// re-registering is idempotent.
registerLanguage(elixir)

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
 * Idiomatic Elixir, written to hit what a regex tokenizer trips over: sigils
 * with four different delimiters, `@moduledoc`/`@doc` heredocs, `#{}` holding a
 * nested map, plain and quoted atoms beside keyword-list keys, `|>` chains,
 * `&1` and `&Mod.fun/1` captures, a charlist, and every numeric literal form.
 */
const SAMPLE = String.raw`defmodule Warehouse.Inventory do
  @moduledoc """
  Inventory reporting, lifted out of the old Mix task so the CLI and the
  Phoenix app agree on the numbers.

  Interpolation works in here too: #{inspect(__MODULE__)}.
  """

  use GenServer
  import Enum, only: [map: 2, reduce: 3]
  alias Warehouse.{Item, Repo}
  require Logger

  @default_tags ~w(fragile bulky perishable)a
  @units ~w[kg lb]
  @sku_pattern ~r/\A[A-Z]{3}-\d{4,6}\z/u
  @banner ~s{Warehouse "inventory" report}
  @mode 0o644
  @flags 0b1010_1010
  @max_items 1_000_000
  @rate 12.5e-2
  @sep ?|
  @greeting ~c"hello"

  @type sku :: String.t()

  @doc """
  Parses one CSV line into an inventory item.
  """
  @spec parse(binary()) :: {:ok, Item.t()} | {:error, atom()}
  def parse(line) when is_binary(line) do
    case String.split(line, ~r{\s*,\s*}, parts: 3) do
      [sku, name, qty] ->
        {:ok, %Item{sku: sku, name: name, quantity: String.to_integer(qty)}}

      _other ->
        {:error, :"malformed row"}
    end
  end

  def parse(_line), do: {:error, :empty}

  defp normalise(tags), do: Enum.map(tags, &String.downcase/1)

  def report(items, opts \\ []) do
    limit = Keyword.get(opts, :limit, @max_items)

    items
    |> Enum.reject(&(&1.quantity == 0))
    |> Enum.sort_by(& &1.sku)
    |> Enum.take(limit)
    |> Enum.map_join("\n", fn %Item{} = item ->
      "#{item.sku} #{String.pad_trailing(item.name, 20)} #{format(item)}"
    end)
  end

  defp format(%Item{quantity: q} = item) when q > 0 do
    tags = item.tags |> normalise() |> Enum.join(", ")
    "x#{q} #{@sep} #{tags} #{inspect(%{sku: item.sku, mode: @mode})}"
  end

  defp format(_item), do: 'out of stock'

  @impl true
  def handle_call({:fetch, sku}, _from, state) do
    reply =
      with {:ok, raw} <- Map.fetch(state, sku),
           true <- byte_size(raw) > 0x10 do
        {:ok, raw}
      else
        :error -> {:error, :not_found}
        false -> {:error, :truncated}
      end

    {:reply, reply, state}
  end
end
`

describe('elixir grammar invariants', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'elixir')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'elixir')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'elixir')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `elixir emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'elixir'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Half-written heredocs, sigils and interpolations are what an editor feeds
    // a highlighter on every keystroke. A state that never pops — one sigil
    // delimiter family missing its closer — shows up here first.
    for (let end = 0; end <= SAMPLE.length; end++) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'elixir')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })
})

describe('elixir', () => {
  it('separates definition keywords from control flow and imports', () => {
    assertHas(SAMPLE, 'elixir', 'defmodule', 'keyword.declaration')
    assertHas(SAMPLE, 'elixir', 'def', 'keyword.declaration')
    assertHas(SAMPLE, 'elixir', 'defp', 'keyword.declaration')
    assertHas(SAMPLE, 'elixir', 'case', 'keyword.control')
    assertHas(SAMPLE, 'elixir', 'with', 'keyword.control')
    assertHas('cond do\n  x > 1 -> :big\nend\n', 'elixir', 'cond', 'keyword.control')
    // `use` and `require` are macros, but they read the way an import does.
    assertHas(SAMPLE, 'elixir', 'use', 'keyword.import')
    assertHas(SAMPLE, 'elixir', 'alias', 'keyword.import')
  })

  it('tells a definition site from a call site', () => {
    // `normalise` is defined once and called once in the sample.
    assertHas(SAMPLE, 'elixir', 'normalise', 'function')
    assertHas(SAMPLE, 'elixir', 'normalise', 'function.call')
    assertHas(SAMPLE, 'elixir', 'format', 'function')
    assertHas(SAMPLE, 'elixir', 'format', 'function.call')
    assertHas(SAMPLE, 'elixir', 'is_binary', 'function.builtin')
  })

  it('reads a name behind a module alias as a call, but a name behind a value as a member', () => {
    // Modules have no fields, so parentheses are not what makes it a call.
    assertHas('IO.puts "hi"\n', 'elixir', 'puts', 'function.method')
    assertHas('IO.puts "hi"\n', 'elixir', 'IO', 'namespace')
    assertHas('name = item.sku\n', 'elixir', 'sku', 'variable.member')
    assertHas('ok = item.valid?()\n', 'elixir', 'valid?', 'function.method')
  })

  it('separates a module alias from a namespace and from a local function', () => {
    assertHas(SAMPLE, 'elixir', 'Warehouse.Inventory', 'namespace')
    assertHas(SAMPLE, 'elixir', 'Enum', 'namespace')
    // The same alias used as a value rather than qualified.
    assertHas(SAMPLE, 'elixir', 'Item', 'type')
    assertHas(SAMPLE, 'elixir', 'GenServer', 'type')
  })

  it('separates an atom from a keyword-list key and from the `do` keyword', () => {
    assertHas(SAMPLE, 'elixir', ':ok', 'constant')
    assertHas(SAMPLE, 'elixir', ':"malformed row"', 'constant')
    assertHas(SAMPLE, 'elixir', 'parts', 'property')
    // `do:` is a keyword-list key; a bare `do` opens a block.
    assertHas(SAMPLE, 'elixir', 'do', 'property')
    assertHas(SAMPLE, 'elixir', 'do', 'keyword.control')
    // A typespec `::` is not the start of an atom.
    const spec = scoped('@spec f(a) :: :ok\n', 'elixir')
    expect(spec.some(([t, s]) => t === '::' && s === 'operator')).toBeTruthy()
  })

  it('scopes a sigil body apart from its introducer, whatever the delimiter', () => {
    assertHas(SAMPLE, 'elixir', '~w', 'string.special')
    assertHas(SAMPLE, 'elixir', '(fragile bulky perishable)a', 'string')
    assertHas(SAMPLE, 'elixir', '[kg lb]', 'string')
    assertHas(SAMPLE, 'elixir', '~r', 'string.special')
    assertHas(SAMPLE, 'elixir', '{Warehouse "inventory" report}', 'string')
    // A paired delimiter nests rather than closing at the first inner closer.
    assertHas('w = ~w(a (b) c)\n', 'elixir', '(a (b) c)', 'string')
  })

  it('reads a doc heredoc as documentation and any other heredoc as a string', () => {
    assertHas(SAMPLE, 'elixir', '@moduledoc', 'decorator')
    assertHas(SAMPLE, 'elixir', '@doc', 'decorator')
    assertHas(SAMPLE, 'elixir', '"""\n  Parses one CSV line into an inventory item.\n  """', 'comment.doc')
    assertHas('sql = """\nselect 1\n"""\n', 'elixir', '"""\nselect 1\n"""', 'string')
  })

  it('keeps a map inside an interpolation from closing it', () => {
    assertHas(SAMPLE, 'elixir', '#{', 'interpolation')
    // A module attribute read inside an interpolation. Asserted on a snippet
    // rather than on SAMPLE, where a top-level `@sep` satisfies it whether or
    // not the interpolated one is scoped at all.
    assertHas('s = "x#{@sep} y"\n', 'elixir', '@sep', 'decorator')
    // Everything after the nested `%{…}` is still inside the literal.
    assertHas('s = "#{inspect(%{a: 1})} tail"\n', 'elixir', ' tail"', 'string')
    assertHas(SAMPLE, 'elixir', '\\n', 'string.escape')
  })

  it('scopes both halves of a capture', () => {
    assertHas(SAMPLE, 'elixir', '&1', 'variable.parameter')
    assertHas(SAMPLE, 'elixir', 'downcase', 'function.method')
    assertHas('f = &handle/2\n', 'elixir', 'handle', 'function.call')
    // `&&` is still an operator, not a capture with a missing arity.
    assertHas('ok = a && b\n', 'elixir', '&&', 'operator')
  })

  it('tells a codepoint literal from the `?` that ends a predicate name', () => {
    assertHas(SAMPLE, 'elixir', '?|', 'number')
    assertHas('if valid?(x), do: 1\n', 'elixir', 'valid?', 'function.call')
    // The `?` here is a suffix followed by a comma, which is also a legal
    // codepoint spelling — the predicate rule claims it first.
    assertHas('list = [ready?, done!]\n', 'elixir', 'ready?', 'function.call')
    const compare = scoped('flag = a!=b\n', 'elixir')
    expect(compare.some(([t, s]) => t === 'a!' && s === 'function.call')).toBeFalsy()
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0x10', '0b1010_1010', '0o644', '1_000_000', '12.5e-2', '42']) {
      assertHas(`n = ${literal}\n`, 'elixir', literal, 'number')
    }
    // A range is two dots, not a malformed float.
    assertHas('r = 1..5\n', 'elixir', '..', 'operator')
  })

  it('reads a charlist as a string and does not let one swallow the file', () => {
    assertHas(SAMPLE, 'elixir', "'out of stock'", 'string')
    assertHas('c = ~c"hello"\n', 'elixir', '~c', 'string.special')
    const unterminated = scoped("x = 'oops\ny = 1\n", 'elixir')
    expect(unterminated.some(([t, s]) => t === '1' && s === 'number')).toBeTruthy()
  })

  it('scopes pipeline and match operators apart from brackets', () => {
    assertHas(SAMPLE, 'elixir', '|>', 'operator')
    assertHas(SAMPLE, 'elixir', '<-', 'operator')
    assertHas('x = a <> b\n', 'elixir', '<>', 'operator')
    assertHas('f = fn x -> x end\n', 'elixir', 'fn', 'keyword.declaration')
    assertHas('opts = [a: 1]\n', 'elixir', '[', 'punctuation.bracket')
  })

  it('caps how long a sigil name may be', () => {
    // The cap on `elixir.ts:42` is what bounds the run of capitals each of the
    // ten delimiter rules scans before giving up. It is a constant factor, not
    // a complexity class — each `~` only ever sees its own run — so a timing
    // bound cannot catch its removal, but where the cap sits is observable:
    // six letters open a sigil and seven do not.
    assertHas('x = ~ABCDEF"hi"\n', 'elixir', '~ABCDEF', 'string.special')
    const tooLong = scoped('x = ~ABCDEFG"hi"\n', 'elixir')
    expect(tooLong.some(([, s]) => s === 'string.special')).toBeFalsy()
    assertHas('x = ~ABCDEFG"hi"\n', 'elixir', 'ABCDEFG', 'type')
  })

  it('stays linear on a line of long sigil names', () => {
    // Every `~` here hands each delimiter rule a run of capitals that reaches
    // no delimiter, which is the shape the cap exists for. The bound is loose
    // on purpose: this proves termination, not the cap.
    const line = `~${'A'.repeat(200)}`.repeat(1000)
    const start = performance.now()
    expect(
      tokenize(line, 'elixir')
        .map((t) => t.text)
        .join(''),
    ).toBe(line)
    expect(performance.now() - start).toBeLessThan(1000)
  })

  it('reads an operator atom as an atom', () => {
    // AST code is written out of these: `{:+, [], [1, 2]}`.
    const ops = 'ops = [:+, :<>, :{}, :.., :[], :==]\n'
    for (const atom of [':+', ':<>', ':{}', ':..', ':[]', ':==']) {
      assertHas(ops, 'elixir', atom, 'constant')
    }
    assertHas('ast = {:+, [], [1, 2]}\n', 'elixir', ':+', 'constant')
    // A keyword-list value that starts with a prefix operator is not an atom.
    const negative = scoped('opts = [limit: -1, offset: -5]\n', 'elixir')
    expect(negative.some(([t]) => t === ':-')).toBeFalsy()
    assertHas('opts = [limit: -1]\n', 'elixir', '-', 'operator')
    // Nor is a capture, which is why `&` is not one of the operators.
    assertHas('opts = [by: &String.downcase/1]\n', 'elixir', 'downcase', 'function.method')
    expect(scoped('opts = [by: &String.downcase/1]\n', 'elixir').some(([t]) => t === ':&')).toBeFalsy()
    // A typespec `::` is still two colons and not an atom named `:`.
    assertHas('@spec f(a) :: :ok\n', 'elixir', '::', 'operator')
  })
})

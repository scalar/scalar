import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import ocaml from './ocaml'

registerLanguage(ocaml)

const known = new Set(Object.keys(SCOPES))

/**
 * A small inventory module, written to hit everything an OCaml tokenizer trips
 * over: nested comments, a doc comment, polymorphic variants, `{|raw|}` string
 * literals, char literals next to identifiers that end in a quote, type
 * variables, labelled and optional arguments, every numeric suffix, and an
 * attribute payload.
 */
const code = `(* inventory.ml — a store, written to keep a highlighter honest.
   Comments (* nest *), so a scanner has to count them and this one
   only ends here. *)

(** [Inventory] tracks stock levels. Doc comments get their own scope. *)

open Printf
module StringMap = Map.Make (String)

exception Out_of_stock of string

type 'a tree =
  | Leaf
  | Node of 'a tree * 'a * 'a tree

type item = {
  sku : string;
  qty : int;
  price : float;
  tags : [ \`Fragile | \`Bulk of int ] list;
}
[@@deriving show, eq]

module type STORE = sig
  type t

  val empty : t
  val default_label : string
  val add : string -> int -> t -> t
end

let epsilon = 1e-9
let max_batch = 1_000_000
let mask = 0xFF_FF land 0o777 lxor 0b1010
let big = 42L and small = 7l and native = 0xDEADn
let scale = 0x1.8p3

(* An identifier may end in a quote, so [acc'] never opens a char literal. *)
let rec fold_tree f acc = function
  | Leaf -> acc
  | Node (l, v, r) ->
      let acc' = fold_tree f acc l in
      fold_tree f (f acc' v) r

let escape_char = function
  | '\\n' -> "\\\\n"
  | '\\t' -> "\\\\t"
  | '\\\\' -> "\\\\\\\\"
  | '\\255' -> "\\\\255"
  | c -> String.make 1 c

let usage = {|
  usage: inventory [--verbose] "<file>"
  nothing in here is escaped, not even \\n
|}

let normalize s = String.trim (String.lowercase_ascii s)

let describe ?(verbose = false) ~label (it : item) : string =
  let tag_count = List.length it.tags in
  if verbose then
    sprintf "%-10s x%04d @ %.2f (%d tags) [%s]%!" it.sku it.qty it.price tag_count label
  else sprintf "%s\\t%d" it.sku it.qty

let restock (stock : int StringMap.t) ~sku ~qty =
  match StringMap.find_opt sku stock with
  | None -> raise (Out_of_stock sku)
  | Some have when have + qty > max_batch -> invalid_arg "batch too large"
  | Some have -> StringMap.add sku (have + qty) stock

let total items =
  List.fold_left (fun acc it -> acc +. (float_of_int it.qty *. it.price)) 0. items

let () =
  let stock = ref StringMap.empty in
  for i = 1 to 3 do
    stock := StringMap.add (sprintf "sku-%d" i) (i * 10) !stock
  done;
  let sample = { sku = "a-1"; qty = 2; price = 1.5; tags = [ \`Fragile; \`Bulk 12 ] } in
  print_endline (describe ~verbose:true ~label:"demo" (normalize sample));
  printf "total = %.2f\\n%!" (total [ sample ])
`

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (source: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(source, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (source: string, lang: string): [string, string][] => {
  return runs(source, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (source: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(source, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

describe('ocaml', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(code, 'ocaml')
        .map((t) => t.text)
        .join(''),
    ).toBe(code)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(code, 'ocaml')) {
      expect(code.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(code, 'ocaml')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `ocaml emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(code, 'ocaml')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(code)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Half-written comments, an unclosed `{|` and a dangling parameter list are
    // what an editor feeds a highlighter on every keystroke.
    const step = Math.max(1, Math.floor(code.length / 60))
    for (let end = 0; end <= code.length; end += step) {
      const prefix = code.slice(0, end)
      expect(
        tokenize(prefix, 'ocaml')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('counts nested comments instead of stopping at the first close', () => {
    const nested = '(* outer (* inner *) still a comment *)\nlet x = 1\n'
    assertHas(nested, 'ocaml', '(* outer (* inner *) still a comment *)', 'comment')
    // Proves the comment ended where it should: the code after it is code.
    assertHas(nested, 'ocaml', 'let', 'keyword.declaration')
  })

  it('separates doc comments from ordinary ones', () => {
    assertHas('(** the answer *)\n', 'ocaml', '(** the answer *)', 'comment.doc')
    assertHas('(* the answer *)\n', 'ocaml', '(* the answer *)', 'comment')
  })

  it('tells a char literal from a type variable and from a trailing quote', () => {
    assertHas("let id (x : 'a) : 'a = x\n", 'ocaml', "'a", 'type')
    assertHas("let nl = '\\n'\n", 'ocaml', "'\\n'", 'string')
    // The quote that ends `acc'` must not pair with the one that opens `'x'`.
    assertHas("let acc' = 'x'\n", 'ocaml', "acc'", 'variable')
    assertHas("let acc' = 'x'\n", 'ocaml', "'x'", 'string')
  })

  it('tells a function definition from a value binding', () => {
    assertHas('let apply f x = f (x + 1)\n', 'ocaml', 'apply', 'function')
    assertHas('let limit = 10\n', 'ocaml', 'limit', 'variable')
    // The definition site is `apply`; the parenthesised application is a call.
    assertHas('let apply f x = f (x + 1)\n', 'ocaml', 'f', 'function.call')
  })

  it('scopes the names between a definition and its body as parameters', () => {
    assertHas('let apply f x = f (x + 1)\n', 'ocaml', 'x', 'variable.parameter')
    assertHas('let pair ~key ?(sep = ",") () = key ^ sep\n', 'ocaml', '~key', 'variable.parameter')
    // An annotation inside the list is a type, not one more parameter.
    assertHas('let describe (it : item) : string = it.sku\n', 'ocaml', 'string', 'type.builtin')
    assertHas('let describe (it : item) : string = it.sku\n', 'ocaml', 'it', 'variable.parameter')
  })

  it('reads a signature entry with an arrow as a function and one without as a value', () => {
    assertHas('val add : string -> int -> t\n', 'ocaml', 'add', 'function')
    assertHas('val default_label : string\n', 'ocaml', 'default_label', 'variable')
  })

  it('separates a module path from the constructors that look just like it', () => {
    assertHas('let n = StringMap.find_opt k m\n', 'ocaml', 'StringMap', 'namespace')
    assertHas('let t = Node (Leaf, 1, Leaf)\n', 'ocaml', 'Node', 'constant')
    assertHas('let v = Some 1\n', 'ocaml', 'Some', 'constant.builtin')
    // A dotted builtin stays a builtin, because the path claims only the dot.
    assertHas('Printf.printf "hi"\n', 'ocaml', 'printf', 'function.builtin')
  })

  it('scopes polymorphic variant tags apart from the type they sit in', () => {
    assertHas('type t = [ `Fragile | `Bulk of int ]\n', 'ocaml', '`Fragile', 'constant')
    assertHas('type t = [ `Fragile | `Bulk of int ]\n', 'ocaml', 't', 'type')
    assertHas('type t = [ `Fragile | `Bulk of int ]\n', 'ocaml', 'int', 'type.builtin')
  })

  it('processes no escapes inside a quoted string literal', () => {
    assertHas('let s = {|raw \\n "quoted"|}\n', 'ocaml', '{|raw \\n "quoted"|}', 'string')
    // The same text in a normal string does have an escape in it.
    assertHas('let s = "raw \\n"\n', 'ocaml', '\\n', 'string.escape')
    assertHas('let s = sprintf "%-10s" x\n', 'ocaml', '%-10s', 'string.special')
  })

  it('separates control flow, declarations, imports and word operators', () => {
    assertHas('match x with\n', 'ocaml', 'match', 'keyword.control')
    assertHas('let rec go x = go x\n', 'ocaml', 'let', 'keyword.declaration')
    assertHas('open Printf\n', 'ocaml', 'open', 'keyword.import')
    assertHas('open Printf\n', 'ocaml', 'Printf', 'namespace')
    assertHas('let m = a lsl 2 land b\n', 'ocaml', 'lsl', 'keyword.operator')
    assertHas('let m = a +. b\n', 'ocaml', '+.', 'operator')
  })

  it('does not mistake a keyword for the identifier that starts with it', () => {
    // `'` is not a word character, so `\\b` alone would fire inside `let'`.
    const pairs = scoped("let val' = 1\n", 'ocaml')
    expect(pairs.some(([t, s]) => t === 'val' && s === 'keyword.declaration')).toBeFalsy()
    assertHas("let val' = 1\n", 'ocaml', "val'", 'variable')
  })

  it('scopes attributes and extension nodes as annotations', () => {
    assertHas('type t = int [@@deriving show, eq]\n', 'ocaml', '[@@deriving', 'decorator')
    assertHas('let x = [%sexp_of: t] y\n', 'ocaml', '[%sexp_of', 'decorator')
  })

  it('handles every numeric literal form', () => {
    for (const literal of [
      '0xFF_FF',
      '0o777',
      '0b1010',
      '1_000_000',
      '1e-9',
      '3.14',
      '42L',
      '7l',
      '0xDEADn',
      '0x1.8p3',
    ]) {
      assertHas(`let n = ${literal}\n`, 'ocaml', literal, 'number')
    }
  })
})

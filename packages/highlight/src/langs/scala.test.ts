import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import scala from './scala'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order. The registry is a module-level singleton and
// re-registering is idempotent, so doing it twice is harmless.
registerLanguage(scala)

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
 * Idiomatic Scala, written to hit the shapes a regex tokenizer gets wrong:
 * nested block comments, interpolators holding string literals of their own, a
 * triple-quoted literal full of quotes and backslashes, symbolic method names,
 * pattern guards and backtick identifiers.
 *
 * Written as a template literal, so every backslash is doubled and every Scala
 * `${…}` is escaped — the sample the tests see has single backslashes.
 */
const SAMPLE = `package com.example.catalog

import scala.annotation.tailrec
import scala.collection.mutable.{ArrayBuffer, Map => MutableMap}

/** Prices a catalogue of items.
  *
  * Block comments nest: /* this inner one closes here */ and the lines after
  * it are still documentation rather than code.
  */
object Catalog {
  val TaxRate: Double = 0.0825
  final val MaxItems = 1_000
  private val HexMask = 0xff_ff
  private val Epsilon = 1.5e-3f
  private val Ratio = 2.5d
  private val Retries = 3L

  type Result[A] = Either[String, A]

  enum Currency {
    case USD, EUR, JPY
  }

  sealed trait Event
  case class Restocked(sku: String, by: Int) extends Event
  case object Closed extends Event

  case class Item(sku: String, qty: Int = 0, priceCents: Long = 250L, currency: Currency = Currency.USD) {
    def total: Long = qty * priceCents
    def +:(other: Item): List[Item] = List(this, other)
  }

  given itemOrdering: Ordering[Item] = Ordering.by(_.sku)
  implicit val defaultCurrency: Currency = Currency.EUR

  extension (item: Item) def label: String = s"\${item.sku} x \${item.qty}"

  // A context bound is sugar for one more implicit parameter list.
  def cheapest[A: Ordering](values: Seq[A]): Option[A] = values.sorted.headOption

  def widen[A <: Item](xs: ArrayBuffer[A]): Seq[Item] = Seq(xs.toSeq: _*)

  def render(items: List[Item])(using ord: Ordering[Item]): String =
    items.sorted
      .map { item =>
        f"\${item.label}%-20s \${item.total / 100.0}%.2f"
      }
      .mkString("\\n")

  @tailrec
  final def countdown(n: Int, acc: List[Int] = Nil): List[Int] =
    if (n <= 0) acc else countdown(n - 1, n :: acc)

  def describe(event: Event): String = event match {
    case Restocked(sku, by) if by > 10 => s"bulk restock of $sku"
    case Restocked(sku, _)             => raw"restock\\tof $sku"
    case Closed                        => "closed"
  }

  def summarise(items: Seq[Item]): String = {
    val header =
      """|sku      qty
         |-------- ---""".stripMargin
    val ids = for {
      item <- items
      if item.qty > 0
    } yield item.sku
    val counts = MutableMap.empty[String, Int]
    items.foreach(item => counts(item.sku) = item.qty)
    println(header + ids.mkString(", "))
    header
  }

  val \`total value\` = List(Item("abc")).map(_.total).sum
  val marker = 'ok
  val initial = 'a'
  val escaped = "tab:\\there \\u2014 done"
}
`

describe('scala', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'scala')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'scala')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'scala')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `scala emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'scala')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed nested comment or an unclosed interpolation is what an
    // editor hands the highlighter on every keystroke, and it is what catches
    // a state that never pops.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'scala')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declarations', () => {
    // `case class` declares a type; a bare `case` opens a match branch. This is
    // the one place the same word means two different things in Scala.
    assertHas('case class Item(sku: String)', 'scala', 'case', 'keyword.declaration')
    assertHas('event match { case Closed => 0 }', 'scala', 'case', 'keyword.control')
    assertHas('event match { case Closed => 0 }', 'scala', 'match', 'keyword.control')
    assertHas('sealed trait Event', 'scala', 'trait', 'keyword.declaration')
    assertHas('def total: Long = 0L', 'scala', 'def', 'keyword.declaration')
    assertHas('val ids = for (i <- xs) yield i', 'scala', 'for', 'keyword.control')
  })

  it('tells a definition site from a call site', () => {
    assertHas('def render(items: List[Item]): String = ""', 'scala', 'render', 'function')
    assertHas('val out = render(items)', 'scala', 'render', 'function.call')
    assertHas('items.sorted.map(f)', 'scala', 'map', 'function.method')
    // A trailing block is a call as much as a paren is — most of Scala's
    // collection API is used through this shape.
    assertHas('items.map { item => item.sku }', 'scala', 'map', 'function.method')
    // A method may be named with operator characters, and it is still a name.
    assertHas('def +:(other: Item): List[Item] = Nil', 'scala', '+:', 'function')
  })

  it('separates builtin types from user types, classes and constants', () => {
    assertHas('val sku: String = item.sku', 'scala', 'String', 'type.builtin')
    assertHas('val e: Event = Closed', 'scala', 'Event', 'type')
    assertHas('case class Item(qty: Int)', 'scala', 'Item', 'class')
    // A context bound names a type parameter and the type class it needs.
    assertHas('def cheapest[A: Ordering](xs: Seq[A]): Option[A] = xs.headOption', 'scala', 'A', 'type')
    assertHas('def cheapest[A: Ordering](xs: Seq[A]): Option[A] = xs.headOption', 'scala', 'Ordering', 'type')
    // Scala spells constants in CapWords, so a bound capitalised name is one —
    // but only when it is a name and not an extractor pattern.
    assertHas('val TaxRate: Double = 0.0825', 'scala', 'TaxRate', 'constant')
    assertHas('val Some(x) = opt', 'scala', 'Some', 'type.builtin')
    assertHas('val total: Long = 0L', 'scala', 'total', 'variable')
    // Scala allows Unicode letters in a name, so the declaration-site rules
    // have to accept the same tail `ID` does or the name is torn in half —
    // `naïve` used to scope `na` and leave `ïve` unscoped mid-identifier.
    assertHas('val naïve = 2', 'scala', 'naïve', 'variable')
    assertHas('var naïve: Int = 2', 'scala', 'naïve', 'variable')
    assertHas('val Größe: Int = 2', 'scala', 'Größe', 'constant')
    assertHas('case class Item(sku: String)', 'scala', 'sku', 'variable.parameter')
  })

  it('scopes an interpolator prefix apart from the literal', () => {
    assertHas('val m = s"hi"', 'scala', 's', 'string.special')
    assertHas('val m = s"hi"', 'scala', '"hi"', 'string')
    // The same literal without a prefix is only a string.
    expect(scoped('val m = "hi"', 'scala').some(([, s]) => s === 'string.special')).toBeFalsy()
  })

  it('interpolates only what an interpolator interpolates', () => {
    // `$item.sku` reads the variable and leaves `.sku` as text, so the member
    // access has to stay inside the string.
    assertHas('val m = s"got $sku now"', 'scala', '$', 'interpolation')
    assertHas('val m = s"got $sku now"', 'scala', 'sku', 'variable')
    assertHas('val m = s"got $sku now"', 'scala', ' now"', 'string')
    // A plain literal does not interpolate at all.
    assertHas('val m = "got $sku now"', 'scala', '"got $sku now"', 'string')
    // A string inside a braced interpolation is a string, not the end of the
    // outer one. Written as a template literal so the Scala `${…}` stays literal.
    const braced = `val m = s"\${if (n == 1) "" else "s"} left"`
    assertHas(braced, 'scala', '${', 'interpolation')
    assertHas(braced, 'scala', '""', 'string')
    assertHas(braced, 'scala', ' left"', 'string')
    // `f"…"` format specs, and the escape an interpolator still interprets.
    assertHas('val m = f"$total%.2f"', 'scala', '%.2f', 'string.special')
    assertHas('val m = s"a\\tb"', 'scala', '\\t', 'string.escape')
    // …but `raw"…"` does not interpret it.
    expect(scoped('val m = raw"a\\tb"', 'scala').some(([, s]) => s === 'string.escape')).toBeFalsy()
  })

  it('reads an annotation apart from a binder and a call', () => {
    assertHas('@tailrec def loop(n: Int): Int = loop(n)', 'scala', '@tailrec', 'decorator')
    assertHas('val x = tailrec(n)', 'scala', 'tailrec', 'function.call')
    // `x@Some(_)` binds a name — the `@` is glued to what precedes it, which an
    // annotation never is.
    assertHas('case x@Some(_) => x', 'scala', 'x', 'variable')
    assertHas('case x@Some(_) => x', 'scala', '@', 'operator')
  })

  it('closes a nested block comment where Scala closes it', () => {
    const code = '/* outer /* inner */ still a comment */ val x = 1'
    assertHas(code, 'scala', '/* outer /* inner */ still a comment */', 'comment')
    assertHas(code, 'scala', 'val', 'keyword.declaration')
    assertHas('/** doc /* nested */ still doc */', 'scala', '/** doc /* nested */ still doc */', 'comment.doc')
  })

  it('recognises every numeric literal form', () => {
    for (const literal of ['0xff_ff', '1_000', '1.5e-3f', '250L', '2.5d', '0.0825']) {
      assertHas(`val a = ${literal}`, 'scala', literal, 'number')
    }
    // A method call on an integer keeps its dot, so the literal stops at `1`.
    assertHas('val r = 1.to(10)', 'scala', '1', 'number')
    assertHas('val r = 1.to(10)', 'scala', 'to', 'function.method')
  })

  it('keeps a triple-quoted literal raw, and tells a symbol from a char', () => {
    const triple = 'val s = """a "b" c""".stripMargin'
    assertHas(triple, 'scala', '"""a "b" c"""', 'string')
    // Triple-quoted literals have no escapes at all: `\t` in one is two
    // characters, not a tab.
    expect(scoped('val s = """a\\tb"""', 'scala').some(([, s]) => s === 'string.escape')).toBeFalsy()
    assertHas("val c = 'a'", 'scala', "'a'", 'string')
    assertHas("val m = 'ok", 'scala', "'ok", 'string.special')
    assertHas('val `total value` = 1', 'scala', '`total value`', 'variable')
  })

  it('reads an ascription apart from a cons', () => {
    assertHas('def f(sku: String) = sku', 'scala', ':', 'punctuation.delimiter')
    assertHas('val ys = x :: xs', 'scala', '::', 'operator')
    // `x` here is the head of a list, not a parameter being annotated.
    expect(scoped('val ys = x :: xs', 'scala').some(([t, s]) => t === 'x' && s === 'variable.parameter')).toBeFalsy()
    assertHas('def widen[A <: Item](xs: Seq[A]) = xs', 'scala', '<:', 'operator')
    assertHas('val ids = for (i <- xs) yield i', 'scala', '<-', 'operator')
  })

  it('scopes Scala 3 contextual keywords', () => {
    assertHas('given ord: Ordering[Item] = Ordering.by(_.sku)', 'scala', 'given', 'keyword.declaration')
    assertHas('def f(using ord: Ordering[Item]) = 1', 'scala', 'using', 'keyword.declaration')
    assertHas('extension (item: Item) def label: String = ""', 'scala', 'extension', 'keyword.declaration')
    assertHas('enum Currency { case USD }', 'scala', 'Currency', 'class')
    assertHas('enum Currency { case USD }', 'scala', 'USD', 'constant')
  })

  it('scopes an import path as a namespace', () => {
    const code = 'import scala.collection.mutable.{ArrayBuffer, Map => MutableMap}'
    assertHas(code, 'scala', 'import', 'keyword.import')
    assertHas(code, 'scala', 'scala.collection.mutable', 'namespace')
    assertHas(code, 'scala', 'ArrayBuffer', 'type')
    assertHas('package com.example.catalog', 'scala', 'com.example.catalog', 'namespace')
  })
})

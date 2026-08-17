import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import kotlin from './kotlin'

registerLanguage(kotlin)

const known = new Set(Object.keys(SCOPES))

/**
 * Idiomatic Kotlin, written to hit the shapes a regex tokenizer gets wrong:
 * nested block comments, string templates holding string literals of their own,
 * a raw string full of quotes and backslashes, labels, and backtick names.
 *
 * Written as a template literal, so every backslash is doubled and every
 * Kotlin `${…}` is escaped — the sample the tests see has single backslashes.
 */
const sample = `@file:JvmName("Inventory")

package com.example.shop

import kotlin.math.roundToInt

/**
 * Tracks what is on the shelves.
 *
 * Block comments nest: /* this inner one closes here */ and the lines after it
 * are still documentation rather than code.
 */
const val TAX_RATE = 0.0825
private const val MAX_ITEMS: Int = 1_000
private const val HEX_MASK = 0xFF_FFu
private const val FLAGS = 0b1010_1010
private const val EPSILON = 1.5e-3f

enum class Currency { USD, EUR, JPY }

data class Item(
    val sku: String,
    var quantity: Int = 0,
    val priceCents: Long = 250L,
    val currency: Currency = Currency.USD,
)

sealed interface Event {
    data class Restocked(val sku: String, val by: Int) : Event
    object Closed : Event
}

class Inventory(private val items: MutableList<Item> = mutableListOf()) {
    companion object {
        val SKU_PATTERN = Regex("""^[A-Z]{3}-\\d{4}$""")
        const val SEPARATOR = '-'
    }

    val total: Int
        get() = items.sumOf { it.quantity }

    fun add(item: Item): Boolean {
        if (items.size >= MAX_ITEMS || !SKU_PATTERN.matches(item.sku)) return false
        items.add(item)
        return true
    }

    fun restock(sku: String, amount: Int = 1) {
        items.firstOrNull { it.sku == sku }?.let { found ->
            found.quantity += amount
            println("Restocked \${found.sku} by $amount")
        } ?: error("no such sku: \\"$sku\\"")
    }

    fun report(): String = buildString {
        append("Inventory \\u2014 \${items.size} lines\\n")
        outer@ for (item in items) {
            if (item.quantity == 0) continue@outer
            val price = item.priceCents / 100.0
            append("$item.sku\\t\${"%.2f".format(price)} x \${item.quantity}\\n")
        }
    }
}

fun String.slugify(separator: Char = '-'): String =
    lowercase().map { if (it.isLetterOrDigit()) it else separator }.joinToString("")

fun describe(event: Event): String = when (event) {
    is Event.Restocked -> "restocked \${event.by} unit\${if (event.by == 1) "" else "s"}"
    Event.Closed -> "closed"
}

fun \`reports an empty inventory\`() {
    val inventory = Inventory()
    check(inventory.total == 0) { "expected 0, got \${inventory.total}" }
}
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

describe('kotlin', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(sample, 'kotlin')
        .map((t) => t.text)
        .join(''),
    ).toBe(sample)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(sample, 'kotlin')) {
      expect(sample.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(sample, 'kotlin')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `kotlin emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(sample, 'kotlin')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(sample)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed nested comment or an unclosed template is what an editor
    // hands the highlighter on every keystroke, and it is what catches a state
    // that never pops.
    const step = Math.max(1, Math.floor(sample.length / 60))
    for (let end = 0; end <= sample.length; end += step) {
      const prefix = sample.slice(0, end)
      expect(
        tokenize(prefix, 'kotlin')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declarations', () => {
    assertHas('when (event) { else -> 1 }', 'kotlin', 'when', 'keyword.control')
    assertHas('data class Item(val sku: String)', 'kotlin', 'class', 'keyword.declaration')
    // `object` declares, but the `is`/`as` family are operators, not keywords.
    assertHas('if (e is Event) e as Event', 'kotlin', 'is', 'keyword.operator')
  })

  it('tells a definition site from a call site', () => {
    assertHas('fun add(item: Item): Boolean {', 'kotlin', 'add', 'function')
    assertHas('items.add(item)', 'kotlin', 'add', 'function.method')
    assertHas('lowercase().trim()', 'kotlin', 'lowercase', 'function.call')
    // A trailing lambda is a call as much as a paren is — this is the shape
    // most of Kotlin's stdlib is used through.
    assertHas('items.sumOf { it.quantity }', 'kotlin', 'sumOf', 'function.method')
  })

  it('keeps scope functions builtin through the dot', () => {
    assertHas('value?.let { it.trim() }', 'kotlin', 'let', 'function.builtin')
    assertHas('value?.trim()', 'kotlin', 'trim', 'function.method')
  })

  it('separates builtin types from user types and constants', () => {
    assertHas('val sku: String = item.sku', 'kotlin', 'String', 'type.builtin')
    assertHas('val event: Event = Event.Closed', 'kotlin', 'Event', 'type')
    assertHas('class Inventory {', 'kotlin', 'Inventory', 'class')
    // A capitalised member is a nested type or an enum entry — Kotlin methods
    // are lowercase, so nothing else can be up there.
    assertHas('val c = Currency.USD', 'kotlin', 'USD', 'constant')
    assertHas('val e = Event.Closed', 'kotlin', 'Closed', 'type')
    // A `val` binds a name, unless the name is SCREAMING_CASE.
    assertHas('const val TAX_RATE = 0.0825', 'kotlin', 'TAX_RATE', 'constant')
    assertHas('val total: Int = 0', 'kotlin', 'total', 'variable')
    assertHas('fun add(item: Item)', 'kotlin', 'item', 'variable.parameter')
  })

  it('interpolates only what Kotlin interpolates', () => {
    // `$item.sku` reads the variable and leaves `.sku` as text, so the member
    // access has to stay inside the string.
    assertHas('val s = "$item.sku"', 'kotlin', '$', 'interpolation')
    assertHas('val s = "$item.sku"', 'kotlin', 'item', 'variable')
    assertHas('val s = "$item.sku"', 'kotlin', '.sku"', 'string')
    // A string inside a braced template is a string, not the end of the outer
    // one. Written as a template literal so the Kotlin `${…}` stays literal.
    const braced = `val s = "\${if (n == 1) "" else "s"} left"`
    assertHas(braced, 'kotlin', '${', 'interpolation')
    assertHas(braced, 'kotlin', '""', 'string')
    assertHas(braced, 'kotlin', ' left"', 'string')
    assertHas('"a\\tb"', 'kotlin', '\\t', 'string.escape')
  })

  it('reads labels apart from annotations', () => {
    assertHas('@Deprecated("gone")', 'kotlin', '@Deprecated', 'decorator')
    assertHas('outer@ for (x in xs) { continue@outer }', 'kotlin', 'outer', 'variable.special')
    assertHas('outer@ for (x in xs) { continue@outer }', 'kotlin', 'continue', 'keyword.control')
    assertHas('return@forEach', 'kotlin', 'forEach', 'variable.special')
  })

  it('closes a nested block comment where Kotlin closes it', () => {
    const code = '/* outer /* inner */ still a comment */ val x = 1'
    assertHas(code, 'kotlin', '/* outer /* inner */ still a comment */', 'comment')
    assertHas(code, 'kotlin', 'val', 'keyword.declaration')
  })

  it('recognises every numeric literal form', () => {
    assertHas('val a = 0xFF_FFu', 'kotlin', '0xFF_FFu', 'number')
    assertHas('val a = 0b1010_1010', 'kotlin', '0b1010_1010', 'number')
    assertHas('val a = 1_000L', 'kotlin', '1_000L', 'number')
    assertHas('val a = 1.5e-3f', 'kotlin', '1.5e-3f', 'number')
    // A range is two operators between two integers, not a malformed float.
    assertHas('for (i in 1..10)', 'kotlin', '1', 'number')
    assertHas('for (i in 1..10)', 'kotlin', '..', 'operator')
  })

  it('keeps a raw string raw', () => {
    const code = 'val re = Regex("""^[A-Z]{3}-\\d{4}$""")'
    assertHas(code, 'kotlin', '"""^[A-Z]{3}-\\d{4}$"""', 'string')
    assertHas(code, 'kotlin', 'Regex', 'type')
  })

  it('names a backtick identifier', () => {
    assertHas('fun `reports an empty inventory`() {}', 'kotlin', '`reports an empty inventory`', 'function')
  })
})

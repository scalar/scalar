import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import java from './java'

registerLanguage(java)

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
 * Idiomatic Java, written to hit the shapes a regex tokenizer trips over: a
 * text block holding quotes and a `//`, a string ending in an escaped quote
 * next to a char literal that holds one, nested generics closing on `>>`,
 * lambdas and method references, a switch expression, and every numeric form.
 */
const sample = String.raw`package com.example.orders;

import java.util.List;
import java.util.Map;
import static java.util.stream.Collectors.joining;

/**
 * Prices orders and renders receipts.
 *
 * @param <T> the line-item type this service prices
 */
@Service(name = "orders", eager = true)
public final class OrderService<T extends LineItem> implements Pricing {

    /** Widest column a rendered receipt line may use. */
    private static final int MAX_WIDTH = 72;
    private static final long CACHE_TTL = 30_000L;
    private static final double TAX_RATE = 0.0825d;
    private static final float ROUNDING = .5f;
    private static final double EPSILON = 1e-9;
    private static final int MASK = 0xFF_FF;
    private static final int FLAGS = 0b1010_0011;
    private static final char BULLET = '•';

    /* Quotes, slashes and percent signs inside a text block are all literal. */
    private static final String TEMPLATE = """
            Order "%s" // still text, not a comment
              total: %,.2f%n""";

    private final Map<String, List<T>> itemsByCustomer;
    private int rendered = 0;

    public OrderService(Map<String, List<T>> itemsByCustomer) {
        this.itemsByCustomer = itemsByCustomer;
    }

    @Override
    public Money priceOf(String customer, T... extras) throws PricingException {
        List<T> items = itemsByCustomer.getOrDefault(customer, List.of());
        double subtotal = items.stream().mapToDouble(LineItem::amount).sum();
        for (T extra : extras) {
            subtotal += extra.amount();
        }
        if (subtotal < EPSILON) {
            throw new PricingException("no charge for \"" + customer + '\'');
        }
        return new Money(subtotal * (1 + TAX_RATE));
    }

    static String describe(Status status) {
        return switch (status) {
            case DRAFT -> "draft";
            case SETTLED, VOIDED -> {
                String label = status.name().toLowerCase();
                yield label.strip();
            }
            default -> throw new IllegalStateException("unknown: " + status);
        };
    }

    public String render(Object value) {
        rendered++;
        if (value instanceof Money money && money.amount() > ROUNDING) {
            return TEMPLATE.formatted("total", money.amount());
        }
        try {
            return String.format("%-8s|%08X", value, MASK).substring(0, MAX_WIDTH);
        } catch (RuntimeException e) {
            return List.of("?", "!").stream().collect(joining());
        } finally {
            System.out.println(BULLET);
        }
    }
}

record LineItem(String sku, double amount) {}

enum Status { DRAFT, SETTLED, VOIDED }
`

describe('java', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(sample, 'java')
        .map((t) => t.text)
        .join(''),
    ).toBe(sample)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(sample, 'java')) {
      expect(sample.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(sample, 'java')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `java emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(sample, 'java'))
    expect(text).toBe(sample)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Half-written text blocks and dangling states are what an editor feeds a
    // highlighter on every keystroke.
    const step = Math.max(1, Math.floor(sample.length / 60))
    for (let end = 0; end <= sample.length; end += step) {
      const prefix = sample.slice(0, end)
      expect(
        tokenize(prefix, 'java')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declaration keywords', () => {
    assertHas('if (ok) { return 1; }\n', 'java', 'if', 'keyword.control')
    assertHas('if (ok) { return 1; }\n', 'java', 'return', 'keyword.control')
    assertHas('private static final int n = 1;\n', 'java', 'final', 'keyword.declaration')
    assertHas('x instanceof Money m\n', 'java', 'instanceof', 'keyword.operator')
  })

  it('tells a method declaration from a call at the same name', () => {
    assertHas('void render(int n) { }\n', 'java', 'render', 'function')
    assertHas('return render(n);\n', 'java', 'render', 'function.call')
    assertHas('return value.render();\n', 'java', 'render', 'function.method')
  })

  it('reads a constructor as a definition and `new Type(` as a type', () => {
    assertHas('public Customer(String id) { }\n', 'java', 'Customer', 'function')
    assertHas('return new Customer(id);\n', 'java', 'Customer', 'type')
  })

  it('does not read a lambda body as a declaration', () => {
    // `-> run(` ends in `>` just like `List<T> run(` does.
    assertHas('items.forEach(item -> run(item));\n', 'java', 'item', 'variable.parameter')
    assertHas('items.forEach(item -> run(item));\n', 'java', 'run', 'function.call')
  })

  it('separates builtin types from user types and constants', () => {
    assertHas('String label = Money.of(RATE);\n', 'java', 'String', 'type.builtin')
    assertHas('String label = Money.of(RATE);\n', 'java', 'Money', 'type')
    assertHas('String label = Money.of(RATE);\n', 'java', 'RATE', 'constant')
    assertHas('String label = Money.of(RATE);\n', 'java', 'of', 'function.method')
  })

  it('names the method behind a `::` reference', () => {
    assertHas('names.forEach(System.out::println);\n', 'java', 'println', 'function.method')
    assertHas('names.forEach(System.out::println);\n', 'java', 'out', 'variable.member')
  })

  it('keeps a text block open across quotes and slashes', () => {
    const code = 'String t = """\nsay "hi" // still text\n""";\n'
    assertHas(code, 'java', '"""\nsay "hi" // still text\n"""', 'string')
  })

  it('separates escapes and format specifiers from string text', () => {
    const code = String.raw`String s = String.format("%,.2f items\n", n);
`
    assertHas(code, 'java', '%,.2f', 'string.special')
    assertHas(code, 'java', '\\n', 'string.escape')
  })

  it('reads a quote-carrying char literal as one literal', () => {
    // The escaped quote inside `'\''` is what a naive quote-to-quote rule eats.
    const code = String.raw`char q = '\'';
`
    assertHas(code, 'java', String.raw`'\''`, 'string')
    assertHas(code, 'java', ';', 'punctuation.delimiter')
  })

  it('scopes an import path as a namespace and its `static` as a modifier', () => {
    assertHas('import static java.util.Arrays.asList;\n', 'java', 'static', 'keyword.declaration')
    assertHas('import static java.util.Arrays.asList;\n', 'java', 'java.util.Arrays.asList', 'namespace')
    assertHas('import java.util.Map;\n', 'java', 'java.util.Map', 'namespace')
  })

  it('tells an annotation from an annotation declaration', () => {
    assertHas('@Override\npublic void run() { }\n', 'java', '@Override', 'decorator')
    assertHas('@interface Marker { }\n', 'java', '@interface', 'keyword.declaration')
    assertHas('@interface Marker { }\n', 'java', 'Marker', 'class')
  })

  it('names the type a `record` or `enum` header declares', () => {
    assertHas('record Point(int x, int y) {}\n', 'java', 'record', 'keyword.declaration')
    assertHas('record Point(int x, int y) {}\n', 'java', 'Point', 'class')
    assertHas('enum Status { DRAFT }\n', 'java', 'Status', 'class')
    assertHas('enum Status { DRAFT }\n', 'java', 'DRAFT', 'constant')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['72', '30_000L', '0.0825d', '.5f', '1e-9', '0xFF_FF', '0b1010_0011']) {
      assertHas(`int x = ${literal};\n`, 'java', literal, 'number')
    }
  })
})

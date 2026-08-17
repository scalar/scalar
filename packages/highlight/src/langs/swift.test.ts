import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import swift from './swift'

registerLanguage(swift)

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
 * Idiomatic Swift, picked for the constructs that break a regex tokenizer:
 * nested block comments, `\(…)` interpolation inside a multi-line literal, a
 * raw string whose escapes are spelled `\#`, attributes, generics, optional
 * chaining, `guard`, argument labels and every numeric literal form.
 *
 * `String.raw` so the backslashes reach the highlighter instead of being eaten
 * by the TypeScript literal.
 */
const SAMPLE = String.raw`import Foundation

/// A catalogue of items, keyed by identifier.
///
/// - Note: lookups are cached between calls.
@available(iOS 15.0, *)
public struct Catalogue<Item: Identifiable>: Sendable {
    /* Nested /* block comments */ close in the right place. */
    public static let maximumBatchSize = 1_000
    private(set) var items: [Item.ID: Item] = [:]

    private let retryDelays: [Double] = [0.5, 1.25, 2.5e-1]
    private let mask: UInt32 = 0xFF_FF
    private let flags = 0b1011_0110
    private let permissions = 0o755
    private let epsilon = 0x1p-8

    public init(items: [Item] = []) {
        for item in items {
            self.items[item.id] = item
        }
    }

    public subscript(id: Item.ID) -> Item? {
        items[id]
    }
}

enum LoadError: Error {
    case notFound(sku: String)
    case transport(underlying: any Error)
}

@MainActor
final class CatalogueLoader {
    private var task: Task<Void, Never>?

    func load(from url: URL, retrying attempts: Int = 3) async throws -> [String] {
        guard attempts > 0 else {
            throw LoadError.notFound(sku: "unknown\n")
        }

        let (data, response) = try await URLSession.shared.data(from: url)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        print("GET \(url.absoluteString) -> \(status)")

        let names = try JSONDecoder()
            .decode([String].self, from: data)
            .filter { !$0.isEmpty }
            .map { $0.trimmingCharacters(in: .whitespaces) }

        let report = """
            Loaded \(names.count) name(s):
            \(names.joined(separator: ", "))
            """
        let pattern = #"^\d{3}-\#(status)$"#
        NSLog("%@", report + pattern)

        switch names.count {
        case 0:
            throw LoadError.transport(underlying: LoadError.notFound(sku: "empty"))
        case 1...9:
            return names
        default:
            return Array(names.prefix(Self.pageSize))
        }
    }

    static var pageSize: Int { 20 }

    deinit {
        task?.cancel()
    }
}

extension Catalogue where Item: Equatable {
    func contains(_ item: Item, ignoringCase: Bool = false) -> Bool {
        items.values.contains { $0 == item }
    }
}
`

describe('swift', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'swift')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'swift')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'swift')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `swift emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'swift')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed interpolation, an unclosed nested comment and a `"""` with
    // one quote missing are what an editor feeds a highlighter on every
    // keystroke, and a state that never pops shows up here first.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'swift')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declaration keywords', () => {
    const code = 'guard let value = items.first else { return nil }\n'
    assertHas(code, 'swift', 'guard', 'keyword.control')
    assertHas(code, 'swift', 'let', 'keyword.declaration')
    assertHas(code, 'swift', 'else', 'keyword.control')
    assertHas(code, 'swift', 'nil', 'constant.builtin')
  })

  it('tells a definition site from a call site', () => {
    const code = 'func fetch(from url: URL) -> Data { fetch(from: url) }\n'
    assertHas(code, 'swift', 'fetch', 'function')
    assertHas(code, 'swift', 'fetch', 'function.call')
    // The declaration binds an external label and an internal name; the call
    // passes the label only. Both are parameters, neither is a type.
    assertHas(code, 'swift', 'from', 'variable.parameter')
    assertHas(code, 'swift', 'url', 'variable.parameter')
  })

  it('names a nominal type at its declaration and reads it as a type elsewhere', () => {
    assertHas('struct Person: Codable {}\n', 'swift', 'Person', 'class')
    assertHas('let p = Person(name: name)\n', 'swift', 'Person', 'type')
  })

  it('separates a standard-library type from a user type', () => {
    const code = 'func describe(_ value: String) -> Summary { Summary(value) }\n'
    assertHas(code, 'swift', 'String', 'type.builtin')
    assertHas(code, 'swift', 'Summary', 'type')
  })

  it('reads a keyword used as an argument label as a label', () => {
    // `for` and `in` are extremely common labels, and colouring them as loop
    // keywords is the single most visible way to get Swift wrong.
    const call = 'view.animate(for: duration, in: container)\n'
    assertHas(call, 'swift', 'for', 'variable.parameter')
    assertHas(call, 'swift', 'in', 'variable.parameter')

    const loop = 'for item in items { total += item.price }\n'
    assertHas(loop, 'swift', 'for', 'keyword.control')
    assertHas(loop, 'swift', 'in', 'keyword.operator')
  })

  it('closes a nested block comment at the outer terminator', () => {
    const code = 'let a = /* outer /* inner */ still comment */ 1\n'
    assertHas(code, 'swift', '/* outer /* inner */ still comment */', 'comment')
    // If the inner `*/` had closed the comment, this would never be a number.
    assertHas(code, 'swift', '1', 'number')
  })

  it('highlights an interpolation as an expression, parens and all', () => {
    const code = 'let line = "total \\(cart.items.count) of \\(f(x))"\n'
    assertHas(code, 'swift', '\\(', 'interpolation')
    assertHas(code, 'swift', 'count', 'variable.member')
    assertHas(code, 'swift', 'f', 'function.call')
    // The interpolation ends at the `)` balancing its own `(`, not at the
    // inner call's, so the tail is still string.
    assertHas(code, 'swift', '"', 'string')
  })

  it('treats a backslash in a raw string as literal text', () => {
    const code = 'let re = #"\\d+\\#(suffix)"#\n'
    assertHas(code, 'swift', '#', 'string.special')
    assertHas(code, 'swift', '"\\d+', 'string')
    assertHas(code, 'swift', '\\#(', 'interpolation')
  })

  it('keeps a quote inside a multi-line string from closing it', () => {
    const code = 'let s = """\nhe said "hi"\n"""\nlet n = 2\n'
    assertHas(code, 'swift', '"""\nhe said "hi"\n"""', 'string')
    // Only reachable if the literal ended at the closing `"""`.
    assertHas(code, 'swift', '2', 'number')
  })

  it('tells an optional chain into a method from one into a property', () => {
    assertHas('task?.cancel()\n', 'swift', 'cancel', 'function.method')
    assertHas('task?.name\n', 'swift', 'name', 'variable.member')
    assertHas('task?.name\n', 'swift', '?.', 'punctuation')
  })

  it('scopes attributes and compiler directives apart from declarations', () => {
    assertHas('func run(_ body: @escaping () -> Void) {}\n', 'swift', '@escaping', 'decorator')
    assertHas('#if DEBUG\nlet x = 1\n#endif\n', 'swift', '#if', 'keyword')
  })

  it('handles numeric literal forms', () => {
    for (const literal of ['0xFF_FF', '0b1011_0110', '0o755', '0x1p-8', '1_000', '2.5e-1', '1.25']) {
      const pairs = scoped(`let x = ${literal}\n`, 'swift')
      expect(
        pairs.some(([t, s]) => t === literal && s === 'number'),
        `${literal} should be one number token, got ${JSON.stringify(pairs)}`,
      ).toBeTruthy()
    }
  })

  it('scopes closure shorthand arguments apart from ordinary names', () => {
    assertHas('let doubled = values.map { $0 * 2 }\n', 'swift', '$0', 'variable.special')
    // A call needs its parentheses to read as a method: `x.flag {` in an `if`
    // has exactly the shape of a trailing closure, and is far more common.
    assertHas('let doubled = values.map({ $0 * 2 })\n', 'swift', 'map', 'function.method')
  })
})

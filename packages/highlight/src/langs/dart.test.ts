import { describe, expect, it } from 'vitest'

import { registerLanguage } from '../core/registry'
import { SCOPES } from '../core/scopes'
import { highlight, tokenize } from '../index'
import dart from './dart'

registerLanguage(dart)

const known = new Set(Object.keys(SCOPES))

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `'abc'` rather than three separate pieces.
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
 * A slice of idiomatic Dart, chosen for the constructs that break tokenizers:
 * nested block comments, raw strings holding `$` and `\n`, triple-quoted
 * strings with interpolation, an interpolation whose body opens a string in the
 * same quote as its host, cascades next to spreads, and `1.toString()`.
 */
const SAMPLE = `#!/usr/bin/env dart
import 'dart:convert' show jsonDecode;
import 'package:meta/meta.dart' as meta;

/// Everything we know about one item on the shelf.
///
/// Doc comments are \`///\`; ordinary notes use \`//\`.
@meta.immutable
class Item {
  const Item({required this.sku, required this.price, this.tags = const <String>[]});

  final String sku;
  final double price;
  final List<String> tags;

  /* Superseded by [describe]. /* Including this older note. */ Kept for now. */
  static const int maxTags = 8;
  static const double taxRate = 0.0825;
  static const int oneMillion = 1_000_000;
  static const int pageSize = 0x20;
  static const double epsilon = 1.5e-9;

  factory Item.fromJson(Map<String, dynamic> json) => Item(
        sku: json['sku'] as String,
        price: (json['price'] as num).toDouble(),
        tags: <String>[...?json['tags'], 'restocked'],
      );

  bool get isOnSale => price < 10.0;

  String? describe({bool loud = false}) {
    if (tags.isEmpty) return null;
    final label = '$sku (\${tags.length} tags): \\$\${price.toStringAsFixed(2)}';
    return loud ? label.toUpperCase() : label;
  }

  @override
  String toString() => 'Item($sku)';
}

enum Shelf { cold, dry, frozen }

final RegExp skuPattern = RegExp(r'^[A-Z]{3}-\\d{4}$');

Future<List<Item>> loadItems(String payload) async {
  final decoded = jsonDecode(payload) as List<dynamic>;
  return [
    for (final entry in decoded)
      if (entry is Map<String, dynamic>) Item.fromJson(entry),
  ];
}

void main() async {
  final report = StringBuffer()
    ..writeln('inventory')
    ..writeln('=' * 9);

  final items = await loadItems('[]');
  final byShelf = <Shelf, List<Item>>{};
  for (final item in items) {
    byShelf[Shelf.dry] ??= <Item>[];
    report.write('''
  \${item.sku}: \${item.price.toStringAsFixed(2)}
  on sale: \${item.isOnSale}
''');
  }

  print('\${byShelf.length.toString()} shelves, \${1.toString()} pass');
  print(r'raw: $notInterpolated and \\n stay literal');
}
`

describe('dart grammar invariants', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'dart')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'dart')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'dart')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `dart emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'dart')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed cascade, an unclosed nested comment and a raw string with no
    // closing quote are what an editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'dart')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })
})

describe('dart', () => {
  it('separates control flow from declaration keywords', () => {
    const code = 'class Item {\n  Future<void> save() async {\n    await flush();\n    return;\n  }\n}\n'
    assertHas(code, 'dart', 'class', 'keyword.declaration')
    assertHas(code, 'dart', 'async', 'keyword.declaration')
    assertHas(code, 'dart', 'await', 'keyword.control')
    assertHas(code, 'dart', 'return', 'keyword.control')
  })

  it('tells a definition site from a call site', () => {
    // `main` has a return type in front of it, `fetch` has a keyword.
    assertHas('void main() {}\n', 'dart', 'main', 'function')
    assertHas('final r = await fetch(url);\n', 'dart', 'fetch', 'function.call')
    // `=>` ends in `>`, exactly like the type arguments of a real definition.
    assertHas('int twice(int n) => compute(n);\n', 'dart', 'twice', 'function')
    assertHas('int twice(int n) => compute(n);\n', 'dart', 'compute', 'function.call')
    // A nullable return type keeps the definition; a ternary does not create one.
    assertHas('String? describe() {}\n', 'dart', 'describe', 'function')
    const ternary = scoped("final v = loud ? shout() : 'x';\n", 'dart')
    expect(ternary.some(([t, s]) => t === 'shout' && s === 'function')).toBeFalsy()
  })

  it('does not let a type name ending in a keyword suppress its own definition', () => {
    // The exclusion list is matched with `\b`. Without it, a return type whose
    // last letters spell an excluded keyword — `Canvas` ends in `as`, `Axis`
    // in `is`, `Margin` in `in` — would read as a call site instead.
    for (const type of ['Canvas', 'Axis', 'Margin', 'Widget']) {
      assertHas(`${type} paint(Size s) {}\n`, 'dart', 'paint', 'function')
    }
    // The keywords themselves must still suppress it.
    for (const lead of ['return', 'await', 'yield', 'throw']) {
      assertHas(`${lead} paint(1);\n`, 'dart', 'paint', 'function.call')
    }
  })

  it('separates builtin types from user types and constants', () => {
    const code = 'final Map<String, Item> byId = {};\nconst MAX_ITEMS = 8;\n'
    assertHas(code, 'dart', 'Map', 'type.builtin')
    assertHas(code, 'dart', 'String', 'type.builtin')
    assertHas(code, 'dart', 'Item', 'type')
    assertHas(code, 'dart', 'MAX_ITEMS', 'constant')
  })

  it('reads a cascade as an operator and a plain access as punctuation', () => {
    const code = "buffer\n  ..writeln('a')\n  ..length;\nbuffer.writeln('b');\n"
    assertHas(code, 'dart', '..', 'operator')
    assertHas(code, 'dart', 'writeln', 'function.method')
    assertHas(code, 'dart', 'length', 'variable.member')
    assertHas(code, 'dart', '.', 'punctuation')
    // The spread has to win over the cascade or `...items` splits into `..` + `.`.
    assertHas('final all = <int>[...base, ...?extra];\n', 'dart', '...', 'operator')
    assertHas('final all = <int>[...base, ...?extra];\n', 'dart', '...?', 'operator')
  })

  it('keeps a method call on an int literal out of the number', () => {
    // `1.` is not a double literal in Dart — the dot belongs to the call.
    assertHas('print(1.toString());\n', 'dart', '1', 'number')
    assertHas('print(1.toString());\n', 'dart', 'toString', 'function.method')
    assertHas('final x = 1.5;\n', 'dart', '1.5', 'number')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0x20', '1_000_000', '0.0825', '1.5e-9', '42']) {
      assertHas(`const v = ${literal};\n`, 'dart', literal, 'number')
    }
  })

  it('lets an interpolation open a string in the host string quote', () => {
    // The classic Dart tokenizer trap: the inner `'key'` must not close the
    // outer literal.
    const code = `final s = '\${map['key']} done';\n`
    expect(
      tokenize(code, 'dart')
        .map((t) => t.text)
        .join(''),
    ).toBe(code)
    assertHas(code, 'dart', "'key'", 'string')
    assertHas(code, 'dart', '${', 'interpolation')
    // The tail after the interpolation is string text again, up to the closer.
    assertHas(code, 'dart', " done'", 'string')
  })

  it('scopes a bare $name interpolation apart from its dollar', () => {
    const code = "final s = 'hi $name.tail';\n"
    assertHas(code, 'dart', '$', 'interpolation')
    assertHas(code, 'dart', 'name', 'variable')
    // Only the identifier interpolates, so `.tail` stays literal string text.
    assertHas(code, 'dart', ".tail'", 'string')
  })

  it('leaves a raw string uninterpolated and scopes its prefix', () => {
    const code = "final re = r'^\\d+$';\n"
    assertHas(code, 'dart', 'r', 'string.special')
    assertHas(code, 'dart', "'^\\d+$'", 'string')
    // An escape in a normal string is still an escape.
    assertHas("final s = 'cost: \\$5';\n", 'dart', '\\$', 'string.escape')
  })

  it('ends a nested block comment at the delimiter that balances it', () => {
    const code = '/* outer /* inner */ still outer */\nconst x = 1;\n'
    assertHas(code, 'dart', '/* outer /* inner */ still outer */', 'comment')
    assertHas(code, 'dart', '1', 'number')
    // A doc comment keeps its own scope through the nesting.
    assertHas('/** a /* b */ c */\n', 'dart', '/** a /* b */ c */', 'comment.doc')
    assertHas('/// docs\n// note\n', 'dart', '/// docs', 'comment.doc')
    assertHas('/// docs\n// note\n', 'dart', '// note', 'comment')
  })

  it('reads a named argument as a parameter but a ternary branch as neither', () => {
    assertHas("banner(title: 'hi', loud: true);\n", 'dart', 'title', 'variable.parameter')
    const ternary = scoped('final v = flag ? left : right;\n', 'dart')
    expect(ternary.some(([t, s]) => t === 'left' && s === 'variable.parameter')).toBeFalsy()
  })

  it('scopes metadata including its dotted path', () => {
    assertHas('@meta.immutable\nclass Item {}\n', 'dart', '@meta.immutable', 'decorator')
    assertHas("@Deprecated('use describe')\nvoid old() {}\n", 'dart', '@Deprecated', 'decorator')
  })

  it('does not let an unterminated string swallow the rest of the file', () => {
    assertHas("final s = 'oops\nfinal n = 7;\n", 'dart', '7', 'number')
  })
})

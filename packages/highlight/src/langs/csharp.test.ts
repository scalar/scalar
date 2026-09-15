import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import csharp from './csharp'

registerLanguage(csharp)

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
 * Idiomatic C#, chosen for the constructs that break regex tokenizers: the five
 * string flavours (plain, verbatim, interpolated, verbatim interpolated, raw),
 * doubled-quote escapes, interpolation holes with alignment and format specs,
 * every numeric literal form, attributes beside indexers, preprocessor
 * directives, and names that are keywords only in one position.
 */
const SAMPLE = `#nullable enable
using System;
using System.Collections.Generic;
using System.Text.Json;
using static System.Math;

namespace Acme.Billing;

/// <summary>Totals and renders invoices.</summary>
/// <remarks>Rates are per region.</remarks>
[ApiController]
[Route("api/[controller]")]
public sealed partial class InvoiceService : IInvoiceService
{
    private const decimal DefaultRate = 0.0825m;
    private const int Mask = 0b1010_0000 | 0xFF;
    private const long Ceiling = 9_000_000L;
    private const double Epsilon = 1e-9;
    private const float Half = .5f;

    private static readonly int[] Retries = { 1, 2, 5 };
    private readonly Dictionary<string, decimal> _rates = new();
    private readonly ILogger? _logger;

    /* A verbatim string keeps its backslashes; "" is its only escape. */
    private readonly string _template = @"C:\\reports\\""summary"".txt";

    public InvoiceService(IClock clock, ILogger? logger = null)
    {
        Clock = clock;
        _logger = logger;
    }

    public IClock Clock { get; init; }
    public int Count => _rates.Count;

    public async Task<string> RenderAsync(Invoice invoice, CancellationToken token = default)
    {
        Validate(invoice);

        var lines = new List<string>();
        foreach (var item in invoice.Items)
        {
            decimal net = item.Price * item.Quantity;
            lines.Add($"{item.Name,-20}{net,10:C2}\\t{item.Sku}");
        }

        var total = invoice.Items.Sum(i => i.Price) * (1m + DefaultRate);
        var label = invoice.State switch
        {
            InvoiceState.Paid => "paid",
            InvoiceState.Open when total > 1_000m => "large",
            _ => throw new ArgumentOutOfRangeException(nameof(invoice)),
        };

        _logger?.Log($@"wrote {lines.Count} line(s) to ""{_template}""");
        await File.WriteAllTextAsync(_template, string.Join('\\n', lines), token);
        return $"{label}: {total:N2} ({Retries.Length} retries)";
    }

    private static void Validate(Invoice invoice)
    {
        if (invoice is null or { Items.Count: 0 })
        {
            throw new ArgumentException("empty invoice", nameof(invoice));
        }
    }

    // Raw literals hold quotes verbatim, so no escaping is needed here.
    public static string Schema() => """
        { "kind": "invoice", "version": 3 }
        """;

    private static bool IsHex(char c) => c is (>= '0' and <= '9') or (>= 'a' and <= 'f');

#if DEBUG
#pragma warning disable CS1591
    private void Trace(string message) => Console.WriteLine($"[{DateTime.UtcNow:o}] {message}");
#endif
}
`

describe('csharp', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'csharp')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'csharp')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'csharp')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `csharp emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'csharp'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Half-written strings and dangling states are what an editor feeds a
    // highlighter on every keystroke, and a state that never pops shows up
    // here first.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'csharp')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declaration keywords', () => {
    assertHas(SAMPLE, 'csharp', 'foreach', 'keyword.control')
    assertHas(SAMPLE, 'csharp', 'return', 'keyword.control')
    assertHas(SAMPLE, 'csharp', 'readonly', 'keyword.declaration')
    assertHas(SAMPLE, 'csharp', 'sealed', 'keyword.declaration')
    // `using X;` imports; `is`/`nameof` are word-shaped operators.
    assertHas(SAMPLE, 'csharp', 'using', 'keyword.import')
    assertHas(SAMPLE, 'csharp', 'is', 'keyword.operator')
  })

  it('tells a definition from a call of the same name', () => {
    const code = 'private static void Validate(Order o) { }\nvoid Run() { Validate(order); }\n'
    assertHas(code, 'csharp', 'Validate', 'function')
    assertHas(code, 'csharp', 'Validate', 'function.call')
    // A call that follows a keyword must not read as a definition.
    const returned = scoped('int Go() { return Compute(1); }\n', 'csharp')
    expect(returned.some(([t, s]) => t === 'Compute' && s === 'function')).toBeFalsy()
    assertHas('int Go() { return Compute(1); }\n', 'csharp', 'Compute', 'function.call')
  })

  it('scopes a constructor as a definition and a member call as a method', () => {
    assertHas(SAMPLE, 'csharp', 'InvoiceService', 'function')
    assertHas(SAMPLE, 'csharp', 'WriteLine', 'function.method')
  })

  it('separates builtin types from user types and the type being declared', () => {
    assertHas(SAMPLE, 'csharp', 'decimal', 'type.builtin')
    assertHas(SAMPLE, 'csharp', 'string', 'type.builtin')
    // The name in `class X` is the declaration; `Invoice` is a type in use.
    assertHas(SAMPLE, 'csharp', 'InvoiceService', 'class')
    assertHas(SAMPLE, 'csharp', 'Invoice', 'type')
  })

  it('reads a property declaration as a member, and a lambda parameter as a parameter', () => {
    assertHas(SAMPLE, 'csharp', 'Count', 'variable.member')
    assertHas(SAMPLE, 'csharp', 'i', 'variable.parameter')
  })

  it('scopes namespaces in imports and declarations', () => {
    assertHas(SAMPLE, 'csharp', 'System.Collections.Generic', 'namespace')
    assertHas(SAMPLE, 'csharp', 'Acme.Billing', 'namespace')
  })

  it('scopes an attribute without swallowing its arguments', () => {
    assertHas(SAMPLE, 'csharp', 'ApiController', 'decorator')
    assertHas(SAMPLE, 'csharp', 'Route', 'decorator')
    assertHas(SAMPLE, 'csharp', '"api/[controller]"', 'string')
  })

  it('treats a doubled quote in a verbatim string as an escape, and a backslash as text', () => {
    const pairs = scoped('var p = @"C:\\temp\\""x"".txt";\n', 'csharp')
    expect(pairs.filter(([t, s]) => t === '""' && s === 'string.escape')).toHaveLength(2)
    // `\t` is two literal characters in a verbatim string, not a tab escape.
    expect(pairs.some(([t, s]) => t === '\\t' && s === 'string.escape')).toBeFalsy()
    assertHas('var p = @"C:\\temp";\n', 'csharp', '@', 'string.special')
    assertHas('var p = "C:\\temp";\n', 'csharp', '\\t', 'string.escape')
  })

  it('highlights interpolation holes, alignment and format specs', () => {
    const code = 'var s = $"{item.Name,-20}{net:C2} {{literal}}";\n'
    assertHas(code, 'csharp', '{', 'interpolation')
    assertHas(code, 'csharp', 'Name', 'variable.member')
    assertHas(code, 'csharp', ',-20', 'string.special')
    assertHas(code, 'csharp', ':C2', 'string.special')
    assertHas(code, 'csharp', '{{', 'string.escape')
  })

  it('keeps quotes inside a raw string literal as string content', () => {
    // A raw literal has no escapes at all, so the embedded quotes must not end
    // it — only the closing `"""` does.
    const raw = 'var s = """\n    { "kind": "invoice" }\n    """;\n'
    assertHas(raw, 'csharp', '"""\n    { "kind": "invoice" }\n    """', 'string')
  })

  it('scopes preprocessor directives without hiding their operands', () => {
    assertHas(SAMPLE, 'csharp', '#if', 'decorator')
    assertHas(SAMPLE, 'csharp', 'DEBUG', 'constant')
    assertHas(SAMPLE, 'csharp', '#pragma', 'decorator')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0b1010_0000', '0xFF', '9_000_000L', '1e-9', '.5f', '0.0825m', '1_000m']) {
      assertHas(SAMPLE, 'csharp', literal, 'number')
    }
  })

  it('stays linear on a run of colons inside an unclosed interpolation', () => {
    // The format-spec scan ran to the end of the line and then failed, once per
    // colon: 2.0 s at 20k characters before the cap.
    const code = `var s = $"{${':'.repeat(32_000)}`
    tokenize(code, 'csharp') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'csharp')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `${32_000} colons in an unclosed interpolation took ${elapsed.toFixed(0)}ms — the spec scan is rescanning`,
    ).toBeLessThan(1000)
  })

  it('scopes rules the sample never reaches', () => {
    // Shipped rules the SAMPLE does not reach.
    assertHas('this.X = true;\n', 'csharp', 'this', 'variable.builtin')
    assertHas('this.X = true;\n', 'csharp', 'true', 'boolean')
    assertHas('base.Run();\n', 'csharp', 'base', 'variable.builtin')
    assertHas('var @class = 1;\n', 'csharp', '@class', 'variable')
  })
})

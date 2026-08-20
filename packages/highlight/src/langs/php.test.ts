import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import php from './php'

registerLanguage(php)

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

/** Scope of the first run whose text is exactly `text`. */
const scopeOf = (code: string, lang: string, text: string): string | null | undefined => {
  return runs(code, lang).find((r) => r[0] === text)?.[1]
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
 * A page's worth of ordinary PHP: both tag forms with markup around them, every
 * comment syntax, a heredoc and a nowdoc, interpolation in three shapes, an
 * attribute, promoted constructor properties and every numeric literal form.
 */
const SAMPLE = `<?php

declare(strict_types=1);

namespace App\\Billing;

use App\\Models\\Invoice;
use RuntimeException;

const MAX_ITEMS = 100;

/**
 * Totals an order and renders its receipt.
 */
#[Immutable]
final class Receipt implements Renderable
{
    private const TAX_RATE = 0.0825;

    public function __construct(
        private readonly Invoice $invoice,
        private array $lines = [],
    ) {
    }

    // Rows come off the wire untrusted, so nothing here trusts a key.
    public static function fromArray(array $rows): self
    {
        $receipt = new self(Invoice::blank());
        foreach ($rows as $index => $row) {
            $receipt->lines[] = $row;
        }

        return $receipt;
    }

    public function total(): int
    {
        $sum = 0;
        # A hash comment, still legal and still in old code.
        foreach ($this->lines as $line) {
            $sum += (int) round($line['price'] * $line['qty']);
        }

        return $sum + (int) ($sum * self::TAX_RATE);
    }

    public function render(string $currency = 'usd'): string
    {
        $name = $this->invoice->customer;
        $flags = 0xFF | 0b1010 | 0o17 | 017;
        $limit = 1_000_000;
        $ratio = 1.5e3;
        $escaped = "Tab:\\t \\"{$name}\\" owes \\$5 /* not a comment */";
        $plain = 'No $interpolation, and here\\'s the proof';

        $sql = <<<SQL
            SELECT * FROM invoices
            WHERE customer = '{$name}' AND total > $limit
            SQL;

        $notice = <<<'TEXT'
            $name stays literal, and so does \\n.
            TEXT;

        if (!isset($this->lines[0])) {
            throw new RuntimeException("empty receipt for {$name}");
        }

        return sprintf('%s: %d', $name, $this->total()) . $sql . $notice . $escaped . $plain . $currency;
    }
}
?>
<div class="receipt" data-total="<?= $receipt->total() ?>">
  <h1>Receipt for <?php echo htmlspecialchars($name); ?></h1>
  <!-- rendered by App\\Billing\\Receipt -->
</div>
`

describe('php', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'php')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'php')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'php')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `php emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'php'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed heredoc, an open `<?php` and an unterminated string are what
    // an editor hands a highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'php')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declaration keywords', () => {
    const code = '<?php\nforeach ($rows as $row) {\n    return $row;\n}\n'
    assertHas(code, 'php', 'foreach', 'keyword.control')
    assertHas(code, 'php', 'return', 'keyword.control')
    assertHas(code, 'php', 'as', 'keyword.operator')
    assertHas('<?php\nfinal class A { public function b() {} }\n', 'php', 'function', 'keyword.declaration')
    assertHas('<?php\nfinal class A { public function b() {} }\n', 'php', 'final', 'keyword.declaration')
  })

  it('tells a definition site from a call site', () => {
    assertHas('<?php\nfunction render($x) { return $x; }\n', 'php', 'render', 'function')
    assertHas('<?php\n$out = render($x);\n', 'php', 'render', 'function.call')
    // A builtin stays a builtin at a call site, but not behind an arrow.
    assertHas('<?php\n$n = count($rows);\n', 'php', 'count', 'function.builtin')
    assertHas('<?php\n$n = $query->count();\n', 'php', 'count', 'function.method')
  })

  it('separates builtin types, user types and constants', () => {
    const code = '<?php\nfunction f(int $qty, Invoice $invoice): string { return MAX_ITEMS; }\n'
    assertHas(code, 'php', 'int', 'type.builtin')
    assertHas(code, 'php', 'string', 'type.builtin')
    assertHas(code, 'php', 'Invoice', 'type')
    assertHas(code, 'php', 'MAX_ITEMS', 'constant')
    // `self::` is a type reference, and the constant after it keeps its own scope.
    assertHas('<?php\n$r = self::TAX_RATE;\n', 'php', 'self', 'type.builtin')
    assertHas('<?php\n$r = self::TAX_RATE;\n', 'php', 'TAX_RATE', 'constant')
  })

  it('tells a method call from a property read', () => {
    const code = '<?php\n$total = $order->total();\n$name = $order->customer;\n'
    assertHas(code, 'php', 'total', 'function.method')
    assertHas(code, 'php', 'customer', 'variable.member')
    // A static call is a method call too, and `::` is not part of the name.
    assertHas('<?php\n$i = Invoice::blank();\n', 'php', 'blank', 'function.method')
    assertHas('<?php\n$i = Invoice::blank();\n', 'php', '::', 'operator')
  })

  it('reads `#[` as an attribute and a bare `#` as a comment', () => {
    assertHas("<?php\n#[Route('/x')]\nfunction f() {}\n", 'php', '#[Route', 'decorator')
    // The argument list keeps tokenizing, which is the point of claiming only
    // the attribute head.
    assertHas("<?php\n#[Route('/x')]\nfunction f() {}\n", 'php', "'/x'", 'string')
    expect(scopeOf('<?php\n# plain comment\n', 'php', '# plain comment')).toBe('comment')
  })

  it('names parameters in a signature but leaves body variables alone', () => {
    const code = '<?php\nfunction f(int $qty, $rows = [1, 2]) {\n    $total = $qty;\n    return $this->x;\n}\n'
    assertHas(code, 'php', '$qty', 'variable.parameter')
    assertHas(code, 'php', '$rows', 'variable.parameter')
    assertHas(code, 'php', '$total', 'variable')
    assertHas(code, 'php', '$this', 'variable.builtin')
    // A call in a default value must not end the parameter list early.
    assertHas('<?php\nfunction f($a = strlen("x"), $b = 1) {}\n', 'php', '$b', 'variable.parameter')
  })

  it('interpolates in double quotes but not in single quotes', () => {
    assertHas('<?php\n$s = "hi $name!";\n', 'php', '$name', 'variable')
    assertHas('<?php\n$s = "hi $user->name!";\n', 'php', '$user->name', 'variable')
    expect(scopeOf("<?php\n$s = 'hi $name!';\n", 'php', "'hi $name!'")).toBe('string')
    assertHas('<?php\n$s = "a\\tb";\n', 'php', '\\t', 'string.escape')
  })

  it('runs full expression syntax inside a complex interpolation', () => {
    const code = '<?php\n$s = "owes {$order->total()} today";\n'
    assertHas(code, 'php', '{', 'interpolation')
    assertHas(code, 'php', '}', 'interpolation')
    assertHas(code, 'php', 'total', 'function.method')
    assertHas(code, 'php', ' today"', 'string')
  })

  it('interpolates a heredoc but never a nowdoc', () => {
    const heredoc = '<?php\n$q = <<<SQL\n    WHERE id = $id\n    SQL;\n$after = 1;\n'
    assertHas(heredoc, 'php', '<<<SQL', 'string.special')
    assertHas(heredoc, 'php', '$id', 'variable')
    assertHas(heredoc, 'php', 'SQL', 'string.special')
    // The body has to end, or everything after it renders as string.
    assertHas(heredoc, 'php', '1', 'number')

    const nowdoc = "<?php\n$q = <<<'TXT'\n    $id stays literal\n    TXT;\n$after = 1;\n"
    expect(scoped(nowdoc, 'php').some(([t, s]) => t === '$id' && s === 'variable')).toBeFalsy()
    assertHas(nowdoc, 'php', '1', 'number')
  })

  it('switches between markup and code at the tags', () => {
    const code = '<h1 class="t"><?= $title ?></h1>\n'
    assertHas(code, 'php', 'h1', 'tag')
    assertHas(code, 'php', 'class', 'tag.attribute')
    assertHas(code, 'php', '"t"', 'string')
    assertHas(code, 'php', '<?=', 'tag')
    assertHas(code, 'php', '$title', 'variable')
    assertHas(code, 'php', '?>', 'tag')
    // Text before the first `<?php` is markup, not code: `class` here is a tag
    // attribute above, and a keyword only once a tag has opened.
    assertHas('<?php\nclass A {}\n', 'php', 'class', 'keyword.declaration')
  })

  it('scopes an import path as a namespace', () => {
    assertHas('<?php\nuse App\\Models\\Invoice;\n', 'php', 'use', 'keyword.import')
    assertHas('<?php\nuse App\\Models\\Invoice;\n', 'php', 'App\\Models\\Invoice', 'namespace')
    // A qualified name used inline splits into the path and the type it names.
    assertHas('<?php\n$i = new App\\Models\\Invoice();\n', 'php', 'App', 'namespace')
    assertHas('<?php\n$i = new App\\Models\\Invoice();\n', 'php', 'Invoice', 'type')
  })

  it('handles numeric literal forms', () => {
    for (const literal of ['0xFF', '0b1010', '0o17', '017', '1_000_000', '1.5e3', '0.0825']) {
      expect(scopeOf(`<?php\n$x = ${literal};\n`, 'php', literal), literal).toBe('number')
    }
  })
})

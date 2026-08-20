import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import perl from './perl'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order. The registry is a module-level singleton and
// re-registering is idempotent.
registerLanguage(perl)

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

/**
 * Every rule pattern in the grammar, as source text. `include` entries splice
 * another state in rather than carrying a pattern of their own, so they are
 * skipped.
 */
const patterns = (grammar: typeof perl): string[] => {
  const out: string[] = []
  for (const state of Object.values(grammar.states)) {
    for (const rule of state.rules) {
      if ('include' in rule) continue
      out.push(typeof rule.match === 'string' ? rule.match : rule.match.source)
    }
  }
  return out
}

/** A lookbehind reached before any consuming atom, wrappers and all. */
const LEADING_LOOKBEHIND = /^(?:\((?:\?:)?)*\(\?<[=!]/

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
 * A lone `$`. A template literal cannot hold `${` of its own, and the sample
 * needs both `${name}` and the `${\ … }` deref idiom.
 */
const D = '$'

/**
 * Idiomatic Perl, written to hit what a regex tokenizer trips over: every
 * sigil form, quote-likes under three delimiter families, the three heredoc
 * flavours, a `/` that divides beside ones that open patterns, POD, and
 * `__END__`.
 */
const SAMPLE = String.raw`#!/usr/bin/env perl
use strict;
use warnings;
use v5.36;
use POSIX qw(floor);

package Warehouse::Item;

=head1 NAME

Warehouse::Item - one row per SKU, parsed out of the nightly export.

=cut

our $VERSION     = '2.4.0';
my $SKU_RE       = qr/\A[A-Z]{3}-\d{4,6}\z/;
my $BANNER       = q{Warehouse "inventory" report};
my @DEFAULT_TAGS = qw(fragile bulky perishable);
my %UNIT_OF      = (kg => 'metric', lb => 'imperial');
my $RATE         = 1_250.75e-2;    # cents per unit, not dollars
my $MASK         = 0b1010_1010;
my $PERMS        = 0644;
my $LIMIT        = 0xFF_FF;
my $TAGLINE      = qq[$BANNER, rev $VERSION];

sub new {
    my ($class, %args) = @_;
    my $self = {
        sku      => $args{sku},
        name     => $args{name} // 'unknown',
        quantity => $args{quantity} || 0,
        tags     => [@DEFAULT_TAGS],
    };
    return bless $self, $class;
}

sub parse {
    my ($class, $line) = @_;
    return unless defined $line && length $line;

    chomp $line;
    my @parts = split /\s*,\s*/, $line, 3;
    die "bad row: $line\n" unless $parts[0] =~ $SKU_RE;

    (my $name = $parts[1]) =~ s{^ +| +$}{}g;
    $name =~ tr/A-Z/a-z/;

    return $class->new(sku => $parts[0], name => $name, quantity => $parts[2]);
}

sub density {
    my ($self, $volume) = @_;
    # A slash after a closing brace divides; it never opens a pattern.
    my $each = $self->{quantity} / $volume;
    return $each % $LIMIT;
}

sub summary {
    my $self  = shift;
    my $count = scalar @{$self->{tags}};

    printf "%-12s %s (%d of %d)\n", $self->{sku}, $self->{name}, $count, $#DEFAULT_TAGS + 1;
    print STDERR "no tags on ${D}{count} rows\n" if $count == 0;
    return sprintf('%s %s', $self->{sku}, $BANNER x 2);
}

sub report {
    my (@items) = @_;
    local $, = "\t";
    my $handler = \&summary;
    my %seen;

    foreach my $item (sort { $a->{sku} cmp $b->{sku} } @items) {
        next if $item->{name} =~ m/^test-/;
        $seen{ $item->{sku} } = $handler->($item) . "\n";
    }

    my $header = <<"HEADER";
$BANNER built at @{[ scalar localtime ]}
HEADER

    my $legend = <<'LEGEND';
$totals and @columns stay literal in this block
LEGEND

    my $footer = <<~FOOTER;
        rows:  ${D}{\ scalar @items }
        perms: $PERMS
        FOOTER

    return join "\n", $header, values %seen, $legend, $footer;
}

print &report(map { Warehouse::Item->parse($_) } <STDIN>);

__END__

Fixture rows live below the marker and are never parsed as code.
ABC-1234, widget, 12
`

describe('perl grammar invariants', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'perl')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'perl')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'perl')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `perl emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = textFromHtml(highlight(SAMPLE, 'perl'))
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Half-written heredocs, quote-likes and POD blocks are what an editor
    // feeds a highlighter on every keystroke. A state that never pops shows up
    // here first.
    for (let end = 0; end <= SAMPLE.length; end++) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'perl')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })
})

describe('perl', () => {
  it('separates declarations from control flow and imports', () => {
    assertHas(SAMPLE, 'perl', 'sub', 'keyword.declaration')
    assertHas(SAMPLE, 'perl', 'my', 'keyword.declaration')
    assertHas(SAMPLE, 'perl', 'our', 'keyword.declaration')
    assertHas(SAMPLE, 'perl', 'local', 'keyword.declaration')
    assertHas(SAMPLE, 'perl', 'package', 'keyword.declaration')
    assertHas(SAMPLE, 'perl', 'foreach', 'keyword.control')
    assertHas(SAMPLE, 'perl', 'unless', 'keyword.control')
    assertHas(SAMPLE, 'perl', 'return', 'keyword.control')
    assertHas(SAMPLE, 'perl', 'use', 'keyword.import')
    assertHas(SAMPLE, 'perl', 'Warehouse::Item', 'namespace')
  })

  it('tells a definition site from a call site', () => {
    // `summary` is defined once and taken as a reference once; `parse` is
    // defined once and called through the arrow once.
    assertHas(SAMPLE, 'perl', 'summary', 'function')
    assertHas(SAMPLE, 'perl', '&summary', 'function.call')
    assertHas(SAMPLE, 'perl', 'parse', 'function')
    assertHas(SAMPLE, 'perl', 'parse', 'function.method')
    // A field read through the arrow is not a call.
    assertHas('my $n = $self->name;\n', 'perl', 'name', 'variable.member')
    // A package-qualified sub is named whole, the way `package` already is.
    assertHas('sub Foo::bar { 1 }\n', 'perl', 'Foo::bar', 'function')
    assertHas('sub new { 1 }\n', 'perl', 'new', 'function')
  })

  it('reads a bareword subscript as a key and a spaced block as code', () => {
    assertHas('my $v = $row{sku};\n', 'perl', 'sku', 'property')
    // The `{` carries no clue about what it is glued to, so the space is what
    // keeps a one-statement block out of the subscript rule. Written without
    // one, `{next}` really does read as a key — the documented trade.
    assertHas('if ($x) { next }\n', 'perl', 'next', 'keyword.control')
    assertHas('if ($x) {next}\n', 'perl', 'next', 'property')
  })

  it('tells a bareword hash key from a function call', () => {
    const code = 'check($row{sku}, sku => 1);\n'
    assertHas(code, 'perl', 'check', 'function.call')
    // Both the subscript and the left half of a fat comma are auto-quoted.
    assertHas(code, 'perl', 'sku', 'property')
    expect(scoped(code, 'perl').some(([t, s]) => t === 'sku' && s === 'function.call')).toBeFalsy()
  })

  it('interpolates in a double-quoted string but not a single-quoted one', () => {
    assertHas('my $s = "id=$id\\n";\n', 'perl', '$id', 'variable')
    assertHas("my $s = 'id=$id';\n", 'perl', "'id=$id'", 'string')
    // `${name}` is a fenced name, `@{[ … ]}` is a whole expression.
    assertHas(SAMPLE, 'perl', '@{', 'variable')
    assertHas(SAMPLE, 'perl', 'localtime', 'function.builtin')
  })

  it('starts no rule with a lookbehind', () => {
    // A rule whose pattern opens with a lookbehind has no known first
    // character, so the merged alternation loses the first-character scan the
    // whole grammar's throughput rests on. The `/…/` guard used to be written
    // that way and cost 10x on whitespace-heavy input.
    for (const src of patterns(perl)) {
      expect(LEADING_LOOKBEHIND.test(src), `perl rule starts with a lookbehind: ${src}`).toBeFalsy()
    }
  })

  it('tells a pattern from a division', () => {
    assertHas(SAMPLE, 'perl', String.raw`/\s*,\s*/`, 'regexp')
    assertHas(SAMPLE, 'perl', '/^test-/', 'regexp')
    // `split` keeps its own scope rather than being swallowed by the guard that
    // makes the following `/` a pattern.
    assertHas(SAMPLE, 'perl', 'split', 'function.builtin')
    // `//` after a term is defined-or, not an empty pattern.
    assertHas('my $n = $args{q} // 0;\n', 'perl', '//', 'operator')
  })

  it('reads a division as a division however it is spaced', () => {
    // One spacing passing is not evidence: a guard that looks a bounded number
    // of characters behind the `/` gets every one of these wrong, and repaints
    // everything up to the second `/` as a pattern.
    const divisions = [
      'my $avg = $total / $count / 2;\n',
      // A name that ends in a list operator. `$` is not a word character, so a
      // `\b`-anchored guard finds `map` inside `$map`.
      'my $r = $map / $total / $count;\n',
      'my $r = $split / $n / 2;\n',
      // The left operand ends on the line above.
      'my $r = ($a + $b)\n  / $c / 2;\n',
      // Column alignment, exactly as the sample writes its own declarations.
      'my $r = $total          / $count / 2;\n',
      'my $r = $items[0] / $n / 2;\n',
      'my $r = $self->{qty} / $n / 2;\n',
    ]
    for (const code of divisions) {
      const pairs = scoped(code, 'perl')
      expect(
        pairs.some(([, s]) => s === 'regexp'),
        `expected no pattern in ${JSON.stringify(code)}, got ${JSON.stringify(pairs.filter(([, s]) => s === 'regexp'))}`,
      ).toBeFalsy()
    }
  })

  it('opens a pattern after every token that introduces one', () => {
    // The token in front is what makes the `/` a pattern, and it keeps the
    // scope it would have had on its own.
    assertHas('my @p = split /,/, $line;\n', 'perl', '/,/', 'regexp')
    assertHas('my @p = split /,/, $line;\n', 'perl', 'split', 'function.builtin')
    assertHas('my @p = split(/,/, $line);\n', 'perl', '/,/', 'regexp')
    assertHas('next if /^#/;\n', 'perl', '/^#/', 'regexp')
    assertHas('next if /^#/;\n', 'perl', 'if', 'keyword.control')
    assertHas('if ($x and /^a/) { 1 }\n', 'perl', 'and', 'keyword.operator')
    assertHas('if ($x and /^a/) { 1 }\n', 'perl', '/^a/', 'regexp')
    assertHas('my $ok = $line =~ /^a/;\n', 'perl', '/^a/', 'regexp')
    assertHas('my $ok = !/^a/;\n', 'perl', '/^a/', 'regexp')
    assertHas('push @out, /x/ ? 1 : 0;\n', 'perl', '/x/', 'regexp')
    // A `{` that introduces a pattern still pushes, so the block's own `}`
    // closes the block rather than an enclosing dereference.
    const block = 'my @m = grep { /x/ } @list;\n'
    assertHas(block, 'perl', '/x/', 'regexp')
    assertHas(block, 'perl', '@list', 'variable')
  })

  it('tells the sigils from the operators they share a character with', () => {
    assertHas(SAMPLE, 'perl', '%UNIT_OF', 'variable')
    assertHas(SAMPLE, 'perl', '&summary', 'function.call')
    assertHas(SAMPLE, 'perl', '$#DEFAULT_TAGS', 'variable')
    const ops = scoped('my $r = $n % 2 && $a & $b;\n', 'perl')
    expect(ops.some(([t, s]) => t === '%' && s === 'operator')).toBeTruthy()
    expect(ops.some(([t, s]) => t === '&&' && s === 'operator')).toBeTruthy()
    expect(ops.some(([, s]) => s === 'function.call')).toBeFalsy()
  })

  it('does not read the `#` of $#array as a comment', () => {
    const code = 'my $last = $#rows;    # really the last index\n'
    assertHas(code, 'perl', '$#rows', 'variable')
    assertHas(code, 'perl', '# really the last index', 'comment')
  })

  it('scopes POD apart from an ordinary comment', () => {
    const code = '=head1 NAME\n\nThing - a thing\n\n=cut\n\nmy $x = 1;  # a note\n'
    assertHas(code, 'perl', '=head1 NAME\n\nThing - a thing\n\n=cut', 'comment.doc')
    assertHas(code, 'perl', '# a note', 'comment')
  })

  it('keeps the line after a heredoc marker as code', () => {
    assertHas(SAMPLE, 'perl', 'HEADER', 'string.special')
    assertHas('my $s = <<"EOT" . $tail;\nbody\nEOT\n', 'perl', '$tail', 'variable')
    // `<<'EOT'` is literal all the way down; `<<"EOT"` is not.
    assertHas('my $s = <<"EOT";\nid=$id\nEOT\n', 'perl', '$id', 'variable')
    const raw = scoped("my $s = <<'EOT';\nid=$id\nEOT\n", 'perl')
    expect(raw.some(([t]) => t === '$id')).toBeFalsy()
    // An append is not a heredoc.
    expect(scoped('my $n = 1 << $bits;\n', 'perl').some(([, s]) => s === 'string.special')).toBeFalsy()
  })

  it('scopes a quote-like apart from its introducer, under three delimiters', () => {
    assertHas(SAMPLE, 'perl', 'qw', 'keyword.operator')
    assertHas(SAMPLE, 'perl', '(fragile bulky perishable)', 'string')
    assertHas(SAMPLE, 'perl', '{Warehouse "inventory" report}', 'string')
    // `qq[…]` interpolates, so the literal is broken up by its variables.
    assertHas(SAMPLE, 'perl', 'qq', 'keyword.operator')
    assertHas(SAMPLE, 'perl', ', rev ', 'string')
    // Substitution and transliteration, with modifiers, under two delimiters.
    assertHas(SAMPLE, 'perl', '/A-Z/a-z/', 'regexp')
    assertHas(SAMPLE, 'perl', 'tr', 'keyword.operator')
    assertHas(SAMPLE, 'perl', '{^ +| +$}{}g', 'string')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0xFF_FF', '0b1010_1010', '0644', '0o644', '1_250.75e-2', '3.14', 'v5.36', '42']) {
      assertHas(`my $n = ${literal};\n`, 'perl', literal, 'number')
    }
    // A version after `use` stays a number rather than becoming the module name.
    assertHas(SAMPLE, 'perl', 'v5.36', 'number')
  })

  it('stops highlighting code after the data marker', () => {
    const code = 'my $x = 1;\n__END__\nmy $y = 2;\n'
    assertHas(code, 'perl', '__END__', 'keyword')
    assertHas(code, 'perl', '\nmy $y = 2;\n', 'comment')
  })
})

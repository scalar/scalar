import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import ruby from './ruby'

registerLanguage(ruby)

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
 * Idiomatic Ruby, written to hit the constructs a regex-based tokenizer trips
 * over: `%` literals, heredocs with a method call after the marker, symbols,
 * a character literal, regex literals beside a division, `#{}` holding a block,
 * `@`/`@@`/`$` variables and operator method names.
 */
const SAMPLE = String.raw`#!/usr/bin/env ruby
# frozen_string_literal: true

=begin
Inventory reporting, lifted out of the old rake task so the CLI and the web
app agree on the numbers.
=end

require 'json'
require_relative 'support/logger'

module Warehouse
  VERSION = '2.4.0'
  DEFAULT_TAGS = %w[fragile bulky perishable].freeze
  UNITS = %i[kg lb].freeze
  SKU_PATTERN = /\A[A-Z]{3}-\d{4,6}\z/
  BANNER = %q{Warehouse "inventory" report}
  MODE = 0o644
  RATE = 1_250.75e-2

  class Item
    attr_reader :sku, :name
    attr_accessor :quantity

    def initialize(sku, name, quantity = 0, tags: DEFAULT_TAGS)
      @sku = sku
      @name = name
      @quantity = quantity
      @tags = tags
      @@count += 1
    end

    def self.parse(line)
      return nil if line.strip.empty?

      sku, name, qty = line.split(/\s*,\s*/, 3)
      raise ArgumentError, "bad sku: #{sku}" unless sku =~ SKU_PATTERN

      new(sku, name, Integer(qty || 0))
    end

    def category
      case @name
      when /\Afrozen/i then :cold
      else :ambient
      end
    end

    def empty?
      quantity.zero?
    end

    def <=>(other)
      sku <=> other.sku
    end

    def to_s
      "#{@name} (#{@sku}) #{empty? ? 'out of stock' : "x#{@quantity}"}"
    end
  end

  class Report
    SEPARATOR = ?|

    def initialize(items)
      @items = items.sort
      @printed_at = Time.now
    end

    def render(io = $stdout)
      io.puts "#{BANNER}\n\n"
      @items.reject(&:empty?).each do |item|
        io.puts format('%-12s %s', item.sku, item.name)
      end
      io.puts "total: #{@items.sum { |i| i.quantity }} units, avg #{total / @items.size}"
    end

    private

    def header
      <<~TEXT.strip
        Inventory as of #{@printed_at.strftime('%Y-%m-%d')}
        #{SEPARATOR * 40}
      TEXT
    end
  end
end

if __FILE__ == $0
  items = ARGF.readlines.map { |line| Warehouse::Item.parse(line) }
  Warehouse::Report.new(items).render
end
`

describe('ruby grammar invariants', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'ruby')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'ruby')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'ruby')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `ruby emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'ruby')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // Half-written heredocs, `%` literals and interpolations are what an editor
    // feeds a highlighter on every keystroke. A state that never pops shows up
    // here first.
    for (let end = 0; end <= SAMPLE.length; end++) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'ruby')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })
})

describe('ruby', () => {
  it('separates block keywords from declarations and imports', () => {
    assertHas(SAMPLE, 'ruby', 'def', 'keyword.declaration')
    assertHas(SAMPLE, 'ruby', 'end', 'keyword.control')
    assertHas(SAMPLE, 'ruby', 'unless', 'keyword.control')
    assertHas(SAMPLE, 'ruby', 'require_relative', 'keyword.import')
    assertHas(SAMPLE, 'ruby', 'private', 'keyword.declaration')
  })

  it('tells a definition site from a call site', () => {
    // `parse` is defined once and called once in the sample.
    assertHas(SAMPLE, 'ruby', 'parse', 'function')
    assertHas(SAMPLE, 'ruby', 'parse', 'function.method')
    assertHas(SAMPLE, 'ruby', 'new', 'function.call')
    // An attribute read is not a call, even though Ruby has no attributes.
    assertHas(SAMPLE, 'ruby', 'sku', 'variable.member')
  })

  it('reads a method that takes a block as a call', () => {
    assertHas('rows.each do |row|\nend\n', 'ruby', 'each', 'function.method')
    assertHas('rows.map { |row| row }\n', 'ruby', 'map', 'function.method')
    assertHas('rows.size\n', 'ruby', 'size', 'variable.member')
  })

  it('names an operator method at its definition', () => {
    assertHas(SAMPLE, 'ruby', '<=>', 'function')
    assertHas(SAMPLE, 'ruby', 'empty?', 'function')
    assertHas('def []=(key, value)\nend\n', 'ruby', '[]=', 'function')
  })

  it('tells a regex literal from a division', () => {
    assertHas(SAMPLE, 'ruby', String.raw`/\s*,\s*/`, 'regexp')
    // `when` keeps its own scope rather than being swallowed by the guard that
    // makes the following `/` a regex.
    assertHas(SAMPLE, 'ruby', String.raw`/\Afrozen/i`, 'regexp')
    assertHas(SAMPLE, 'ruby', 'when', 'keyword.control')
    const division = scoped('avg = total / count / 2\n', 'ruby')
    expect(division.some(([, s]) => s === 'regexp')).toBeFalsy()
  })

  it('keeps the line after a heredoc marker as code', () => {
    assertHas(SAMPLE, 'ruby', 'TEXT', 'string.special')
    assertHas(SAMPLE, 'ruby', 'strip', 'variable.member')
    // …and the body itself is a string, interpolation included.
    assertHas(SAMPLE, 'ruby', '#{', 'interpolation')
  })

  it('does not read an append as a heredoc', () => {
    const pairs = scoped('items << other\nputs items\n', 'ruby')
    expect(pairs.some(([, s]) => s === 'string.special')).toBeFalsy()
    assertHas('items << other\nputs items\n', 'ruby', 'puts', 'function.builtin')
  })

  it('scopes a percent literal apart from its introducer', () => {
    assertHas(SAMPLE, 'ruby', '%w', 'string.special')
    assertHas(SAMPLE, 'ruby', '[fragile bulky perishable]', 'string')
    assertHas(SAMPLE, 'ruby', '{Warehouse "inventory" report}', 'string')
  })

  it('tells a character literal from a ternary', () => {
    assertHas(SAMPLE, 'ruby', '?|', 'string')
    // `empty? ? … : …` — the predicate keeps its own `?`, the ternary keeps the
    // other one.
    assertHas(SAMPLE, 'ruby', 'empty?', 'function.call')
    assertHas(SAMPLE, 'ruby', '?', 'operator')
  })

  it('does not mistake the `!` of a comparison for a bang method', () => {
    const pairs = scoped('flag = a!=b\n', 'ruby')
    expect(pairs.some(([t, s]) => t === 'a!' && s === 'function.call')).toBeFalsy()
    assertHas('flag = a!=b\n', 'ruby', '!=', 'operator')
  })

  it('separates a symbol from a hash key and from a ternary colon', () => {
    assertHas(SAMPLE, 'ruby', ':cold', 'constant')
    assertHas('{ status: :active }\n', 'ruby', 'status', 'property')
    assertHas('{ status: :active }\n', 'ruby', ':active', 'constant')
    const ternary = scoped('mode = on ? 1 : 2\n', 'ruby')
    expect(ternary.some(([t, s]) => t === ':' && s === 'constant')).toBeFalsy()
  })

  it('separates a module from a class and a namespace from a type', () => {
    assertHas(SAMPLE, 'ruby', 'Warehouse', 'namespace')
    assertHas(SAMPLE, 'ruby', 'Item', 'class')
    assertHas(SAMPLE, 'ruby', 'Item', 'type')
    assertHas(SAMPLE, 'ruby', 'VERSION', 'constant')
  })

  it('scopes parameters at the binding site only', () => {
    assertHas(SAMPLE, 'ruby', 'quantity', 'variable.parameter')
    assertHas(SAMPLE, 'ruby', 'item', 'variable.parameter')
    // A default value is an expression, not another parameter name.
    assertHas(SAMPLE, 'ruby', 'DEFAULT_TAGS', 'constant')
    assertHas(SAMPLE, 'ruby', '$stdout', 'variable')
  })

  it('keeps a block inside an interpolation from closing it', () => {
    assertHas(SAMPLE, 'ruby', 'i', 'variable.parameter')
    assertHas(SAMPLE, 'ruby', ' units, avg ', 'string')
    assertHas(SAMPLE, 'ruby', String.raw`\n\n`, 'string.escape')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0x1f', '0b1010_1010', '0o644', '1_250.75e-2', '3r', '2i', '42']) {
      assertHas(`n = ${literal}\n`, 'ruby', literal, 'number')
    }
  })

  it('interpolates in a command literal but not in a single-quoted string', () => {
    assertHas('sha = `git rev-parse #{ref}`\n', 'ruby', '#{', 'interpolation')
    assertHas("path = 'lib/#{name}.rb'\n", 'ruby', "'lib/#{name}.rb'", 'string')
  })
})

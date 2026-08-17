import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import matlab from './matlab'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(matlab)

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
 * Idiomatic MATLAB, chosen for the constructs that break regex tokenizers: the
 * transpose apostrophe beside a char-array quote, `end` as both a keyword and
 * an index, doubled-quote escapes in each of the two string kinds, `%{ … %}`
 * block comments, `...` continuations, and every numeric literal form.
 */
const SAMPLE = `%% Trip store
% Utilities for summarising station data. Vectorised where it matters.
%{
Block comments sit alone on their lines. Everything in here, including
'quotes' and 100% of the percent signs, is ignored by the parser.
%}

classdef TripStore < handle & matlab.mixin.Copyable
    properties (Access = private)
        Name (1,1) string = "unnamed"
        Durations double = zeros(0, 1)
    end

    properties (Constant)
        MaxGap = 1e-3
    end

    methods
        function obj = TripStore(name, durations)
            arguments
                name (1,1) string
                durations (:,1) double = []
            end
            obj.Name = name;
            obj.Durations = durations;
        end

        function [total, counts] = tally(obj, edges)
            total = sum(obj.Durations);
            counts = histcounts(obj.Durations, edges);
            last = obj.Durations(end);
            fprintf('%s: %d trips, last %.2f min\\n', obj.Name, numel(counts), last);
        end
    end
end

function [mu, sigma] = summarise(A, varargin)
    % A' below is a transpose; 'A' would be a char array.
    label = 'A''s column means';
    msg = "she said ""go"" twice";
    mu = mean(A', 2);
    sigma = std(A(:, 1:end-1), 0, 2);
    if isempty(varargin)
        disp([label ' -> ' msg]);
    elseif ~ischar(varargin{1})
        error('summarise:badLabel', "expected a char array, got %s", class(varargin{1}));
    end
end

M = [1, 2, 3; 4, 5, 6; 7, 8, 9];
w = [0.5 1.5 2.5]';
scaled = (M .* w')' + 0x1F - 3i;
normalise = @(v) (v - min(v)) ./ max(v - min(v));
picked = arrayfun(@(k) normalise(M(:, k)), 1:size(M, 2), ...
                  'UniformOutput', false);

[~, best] = max(cellfun(@numel, picked));
store = TripStore("kendall", w);
[total, counts] = store.tally(0:10:60);

tol = .5;
while tol > 1e-6
    tol = tol / 2;
end

for k = 1:numel(picked)
    row = picked{k};
    if any(isnan(row)) || row(end) > pi
        continue
    end
    fprintf("row %d -> %s\\n", k, mat2str(row, 4));
end

switch class(store)
    case 'TripStore'
        disp('store is a TripStore');
    otherwise
        warning('unexpected class');
end
`

describe('matlab', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'matlab')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'matlab')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'matlab')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `matlab emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'matlab')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'matlab')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('tells a transpose apostrophe from an opening char-array quote', () => {
    // The same character, and only what precedes it says which one it is.
    assertHas("b = A';\n", 'matlab', "'", 'operator')
    assertHas("c = 'A';\n", 'matlab', "'A'", 'string')
    assertHas("y = (M * N)';\n", 'matlab', "'", 'operator')
    assertHas("v = [1 2 3]';\n", 'matlab', "'", 'operator')
    // A quote after a separator opens a literal even next to a transpose.
    assertHas("d = [A', 'tag'];\n", 'matlab', "'tag'", 'string')
  })

  it('separates declaration keywords from control flow', () => {
    const code = 'function y = f(x)\nif x > 0\n    for k = 1:3\n    end\nend\nend\n'
    assertHas(code, 'matlab', 'function', 'keyword.declaration')
    assertHas(code, 'matlab', 'if', 'keyword.control')
    assertHas(code, 'matlab', 'for', 'keyword.control')
    assertHas('classdef Foo < handle\nend\n', 'matlab', 'classdef', 'keyword.declaration')
    assertHas('classdef Foo < handle\nend\n', 'matlab', 'Foo', 'class')
    assertHas('classdef Foo < handle\nend\n', 'matlab', 'handle', 'type')
  })

  it('tells the definition site from the call site', () => {
    const def = 'function [a, b] = tally(x)\nend\n'
    assertHas(def, 'matlab', 'tally', 'function')
    assertHas(def, 'matlab', 'a', 'variable.parameter')
    assertHas(def, 'matlab', 'x', 'variable.parameter')
    assertHas('[p, q] = tally(3);\n', 'matlab', 'tally', 'function.call')
  })

  it('separates a builtin from a user-defined function and a builtin type', () => {
    const code = 'n = numel(zeros(3));\nm = mytally(n);\nfprintf("%d\\n", m);\nc = int32(m);\n'
    assertHas(code, 'matlab', 'numel', 'function.builtin')
    assertHas(code, 'matlab', 'zeros', 'function.builtin')
    assertHas(code, 'matlab', 'fprintf', 'function.builtin')
    assertHas(code, 'matlab', 'mytally', 'function.call')
    assertHas(code, 'matlab', 'int32', 'type.builtin')
  })

  it('reads end as a keyword at statement level and as an index inside brackets', () => {
    const code = 'for k = 1:3\n    y = v(end);\n    z = c{end};\nend\n'
    assertHas(code, 'matlab', 'end', 'constant.builtin')
    assertHas(code, 'matlab', 'end', 'keyword.control')
    assertHas('s = A(2:end-1, :);\n', 'matlab', 'end', 'constant.builtin')
  })

  it('scopes a block comment apart from a line comment and a cell heading', () => {
    const code = '%{\nhidden = 1;\n%}\nx = 2; % note\n'
    assertHas(code, 'matlab', '%{\nhidden = 1;\n%}', 'comment')
    assertHas(code, 'matlab', '% note', 'comment')
    // Code after the block closes is still code.
    assertHas(code, 'matlab', '2', 'number')
    assertHas('%% Section\nx = 1;\n', 'matlab', '%% Section', 'comment.doc')
    // A stray `%{` mid-line is an ordinary comment, not a block opener.
    assertHas('x = 1; %{ not a block\ny = 2;\n', 'matlab', '%{ not a block', 'comment')
  })

  it('tells an ignored output from the not operator', () => {
    assertHas('[~, idx] = max(v);\n', 'matlab', '~', 'variable.parameter')
    assertHas('function [~, n] = f(~, x)\nend\n', 'matlab', '~', 'variable.parameter')
    assertHas('if ~isempty(v)\nend\n', 'matlab', '~', 'operator')
    assertHas('t = a ~= b;\n', 'matlab', '~=', 'operator')
  })

  it('escapes a quote by doubling it in both string kinds', () => {
    assertHas("s = 'it''s here';\n", 'matlab', "''", 'string.escape')
    assertHas('s = "she said ""go""";\n', 'matlab', '""', 'string.escape')
    assertHas('s = "plain";\n', 'matlab', '"plain"', 'string')
    assertHas("fprintf('%5.2f done\\n');\n", 'matlab', '%5.2f', 'string.special')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['42', '3.14', '.5', '1e-3', '2.5E+4', '3i', '0x1F', '0b1010', '2.', '2.e3']) {
      assertHas(`x = ${literal};\n`, 'matlab', literal, 'number')
    }
    // A dot operator takes the dot back off the literal, which is how MATLAB
    // splits the same line: `2` and `./`, not `2.` and `/`.
    assertHas('y = 2./x;\n', 'matlab', '2', 'number')
    assertHas('y = 2./x;\n', 'matlab', './', 'operator')
    // The element-wise operator after a full float is still not part of it.
    assertHas('y = 1.5.^2;\n', 'matlab', '1.5', 'number')
    assertHas('y = 1.5.^2;\n', 'matlab', '.^', 'operator')
  })

  it('does not open a char array on a transpose that follows a literal', () => {
    // Both of these used to hand the apostrophe to `char-array`, which then
    // swallowed the rest of the line as a string.
    const numeric = "x = 2.';\ny = 3;\n"
    assertHas(numeric, 'matlab', '2', 'number')
    assertHas(numeric, 'matlab', ".'", 'operator')
    assertHas(numeric, 'matlab', '3', 'number')
    expect(scoped(numeric, 'matlab').some(([, s]) => s.startsWith('string'))).toBeFalsy()

    // `"abc"'` transposes a string scalar, so the quote before it closes a
    // literal rather than opening one.
    const quoted = 'x = "abc"\';\ny = 1;\n'
    assertHas(quoted, 'matlab', '"abc"', 'string')
    assertHas(quoted, 'matlab', "'", 'operator')
    assertHas(quoted, 'matlab', '1', 'number')

    // The non-conjugate form of the same expression.
    assertHas('x = "abc".\';\ny = 1;\n', 'matlab', '"abc"', 'string')
    assertHas('x = "abc".\';\ny = 1;\n', 'matlab', ".'", 'operator')
  })

  it('ends a one-line definition at its separator', () => {
    // A `function` or `classdef` header can be closed with a comma and the
    // whole body written after it, so `end` closes the block.
    assertHas('function y = f(x), y = 1; end\n', 'matlab', 'end', 'keyword.control')
    assertHas('classdef Foo < handle, end\n', 'matlab', 'end', 'keyword.control')
    // The multi-line spelling is unaffected: the header still runs to `$`.
    assertHas('function [a, b] = f(c, d)\n    a = c;\nend\n', 'matlab', 'a', 'variable.parameter')
    assertHas('function [a, b] = f(c, d)\n    a = c;\nend\n', 'matlab', 'd', 'variable.parameter')
  })

  it('stays linear on a block keyword followed by a long whitespace run', () => {
    // The contextual `properties` lookahead had two `[ \t]*` runs separated by
    // an optional group, so a failing `$` made the engine enumerate every way
    // to split the whitespace: 2.5 s at 32k characters and no answer at all at
    // 200k. Highlighted source is untrusted, so that is a denial of service.
    const code = `properties ${' '.repeat(100_000)}x`
    tokenize(code, 'matlab') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'matlab')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `a block keyword before ${100_000} spaces took ${elapsed.toFixed(0)}ms — the lookahead is rescanning`,
    ).toBeLessThan(1000)
  })

  it('scopes a property access apart from a method call', () => {
    assertHas('v = obj.Name;\n', 'matlab', 'Name', 'variable.member')
    assertHas('v = obj.tally(3);\n', 'matlab', 'tally', 'function.method')
    // Matched at the dot, so a member never picks up the builtin colour.
    assertHas('n = obj.numel;\n', 'matlab', 'numel', 'variable.member')
  })

  it('scopes an anonymous function parameter and a named handle', () => {
    const code = 'f = @(x, y) x.^2 + y;\n'
    assertHas(code, 'matlab', '@', 'keyword.declaration')
    assertHas(code, 'matlab', 'x', 'variable.parameter')
    assertHas('g = @mean;\n', 'matlab', 'mean', 'function.builtin')
    assertHas('g = @myfun;\n', 'matlab', 'myfun', 'function.call')
  })

  it('treats block keywords as contextual', () => {
    assertHas('properties (Access = private)\nend\n', 'matlab', 'properties', 'keyword.declaration')
    assertHas('    arguments\n        x double\n    end\n', 'matlab', 'arguments', 'keyword.declaration')
    // The same names are ordinary functions when they are used as ones.
    const call = scoped('p = properties(obj);\n', 'matlab')
    expect(call.some(([t, s]) => t === 'properties' && s === 'keyword.declaration')).toBeFalsy()
    expect(call.some(([t, s]) => t === 'properties' && s === 'function.call')).toBeTruthy()
  })

  it('continues a wrapped signature across a line break', () => {
    const code = 'function y = f(a, ...\n               b)\n    y = a + b;\nend\n'
    assertHas(code, 'matlab', 'b', 'variable.parameter')
    assertHas(code, 'matlab', '...', 'punctuation')
    assertHas(code, 'matlab', 'f', 'function')
  })
})

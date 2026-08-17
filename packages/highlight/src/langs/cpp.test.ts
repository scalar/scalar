import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import cpp from './cpp'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(cpp)

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
const patterns = (grammar: typeof cpp): string[] => {
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
 * Idiomatic C++, chosen for what breaks regex tokenizers here: raw strings with
 * and without a delimiter, `'` as a digit separator beside `'` as a quote, a
 * multi-line macro spliced with backslashes, attributes, lambdas, templates,
 * `::` paths, and every numeric literal form the language has.
 */
const SAMPLE = `// A tiny ring buffer, written the way a real header would be.
#pragma once

#include <array>
#include <cstdint>
#include <iostream>
#include <string>
#include "buffer.hpp"

#define LOG_PREFIX "[ring] "
#define CLAMP(x, lo, hi) ((x) < (lo) ? (lo) : ((x) > (hi) ? (hi) : (x)))
#define RING_ASSERT(cond, msg)                \\
  do {                                        \\
    if (!(cond)) std::cerr << (msg) << '\\n';  \\
  } while (0)

#ifdef RING_DEBUG
constexpr bool kVerbose = true;
#else
constexpr bool kVerbose = false;
#endif

namespace ring::detail {

/// Bytes we refuse to buffer past, mostly to keep the tests honest.
inline constexpr size_t MAX_BYTES = 1'048'576u;
constexpr double kGrowth = 1.5;
constexpr auto kMask = 0xFF'FFu;
constexpr int kFlags = 0b1010'0110;
constexpr int kMode = 0755;
constexpr double kEpsilon = 1e-9;
constexpr float kHalf = .5f;
constexpr unsigned long long kBig = 18'446'744'073ULL;

enum class Level : uint8_t { trace, info, error };

template <typename T, size_t N>
class Ring {
 public:
  explicit Ring(std::string_view name) : name_(name), head_(0) {}

  /** Whether anything has been pushed since the last flush. */
  [[nodiscard]] bool empty() const noexcept { return head_ == 0; }

  void push(const T& value) {
    if (head_ >= N) {
      throw std::runtime_error("ring overflow");
    }
    slots_[head_++] = value;
  }

 private:
  std::string name_;
  size_t head_;
  std::array<T, N> slots_{};
};

}  // namespace ring::detail

using namespace ring::detail;
using Bytes = std::vector<uint8_t>;

static const char* kUsage = R"(usage: ring [--verbose] "path")";
static const char* kQuery = R"sql(SELECT * FROM logs WHERE tag = "ring")sql";
static const std::string kBanner = "tab\\there, a quote \\" and \\x41\\n";
static const char kSep = '\\t';

int main(int argc, char** argv) {
  Ring<std::string, 8> ring{"main"};
  auto shout = [&ring](std::string_view text) -> std::string {
    std::string out;
    for (char c : text) out += static_cast<char>(std::toupper(c));
    ring.push(out);
    return out;
  };

  std::vector<std::string> args(argv + 1, argv + argc);
  for (const auto& arg : args) {
    if (arg == "--verbose" && kVerbose) {
      std::cout << LOG_PREFIX << shout(arg) << std::endl;
    }
  }
  RING_ASSERT(!args.empty(), "no arguments");
  printf("%-8s %#06x %.2f\\n", kUsage, kMask, kGrowth);
  return ring.empty() ? EXIT_FAILURE : 0;
}
`

describe('cpp', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'cpp')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'cpp')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'cpp')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `cpp emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'cpp')
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
        tokenize(prefix, 'cpp')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('starts no rule with a lookbehind', () => {
    // A rule whose pattern opens with a lookbehind has no known first
    // character, so the merged alternation loses the first-character scan the
    // whole grammar's throughput rests on. The user-defined-literal suffix used
    // to be written that way and cost 1.5-2x across every input shape,
    // including 4 KB of plain indentation.
    for (const src of patterns(cpp)) {
      expect(LEADING_LOOKBEHIND.test(src), `cpp rule starts with a lookbehind: ${src}`).toBeFalsy()
    }
  })

  it('separates control flow from declarations and from the cast operators', () => {
    const code = 'constexpr int f() {\n  if (kOn) return 1;\n  co_return 0;\n}\n'
    assertHas(code, 'cpp', 'constexpr', 'keyword.declaration')
    assertHas(code, 'cpp', 'if', 'keyword.control')
    assertHas(code, 'cpp', 'co_return', 'keyword.control')
    // `_` is a word character, so `\bstatic\b` cannot reach inside a cast.
    assertHas('static int n = static_cast<int>(x);\n', 'cpp', 'static', 'keyword.declaration')
    assertHas('static int n = static_cast<int>(x);\n', 'cpp', 'static_cast', 'keyword.operator')
  })

  it('tells a definition from a call and from a prototype', () => {
    assertHas('int add(int a, int b) { return a + b; }\n', 'cpp', 'add', 'function')
    assertHas('int y = add(1, 2);\n', 'cpp', 'add', 'function.call')
    // A prototype has no body to look ahead to, so it reads as a call.
    assertHas('int add(int a, int b);\n', 'cpp', 'add', 'function.call')
  })

  it('sees through a trailing return type and a member-initialiser list', () => {
    const method = 'auto Buffer::flush() const noexcept -> bool {\n  return true;\n}\n'
    assertHas(method, 'cpp', 'flush', 'function')
    // The class qualifier keeps its own reading rather than becoming the name.
    assertHas(method, 'cpp', 'Buffer', 'type')

    const ctor = 'Buffer::Buffer(size_t cap) : data_(cap), size_(0) {}\n'
    assertHas(ctor, 'cpp', 'Buffer', 'function')
    // Every initialiser is a call, including the last one, which is spelled
    // exactly like a definition: `size_(0) {`.
    assertHas(ctor, 'cpp', 'size_', 'function.call')
    expect(scoped(ctor, 'cpp').some(([t, s]) => t === 'size_' && s === 'function')).toBeFalsy()
  })

  it('keeps a constructor a definition when an access specifier precedes it', () => {
    // The `:` of `public:` is not a member-initialiser list, so the guard that
    // demotes initialiser entries must not reach the constructor under it. The
    // destructor two lines down is the control: it never had a `:` in front.
    const header = 'class R {\n public:\n  R(size_t n) : n_(n) {}\n  ~R() {}\n};\n'
    const pairs = scoped(header, 'cpp')
    expect(pairs.filter(([t, s]) => t === 'R' && s === 'function')).toHaveLength(2)
    expect(pairs.some(([t, s]) => t === 'R' && s === 'function.call')).toBeFalsy()
    // The initialiser entry itself is still held back from reading as one.
    assertHas(header, 'cpp', 'n_', 'function.call')
  })

  it('reaches a member-initialiser list past the qualifiers in front of it', () => {
    // The guard that holds an initialiser entry back from reading as a
    // definition keys off the `)` of the parameter list, and `noexcept`, a
    // cv-qualifier and the `try` of a function-try-block all legally sit
    // between that `)` and the `:`.
    for (const head of ['Foo::Foo(int n) noexcept', 'Foo::Foo(int n) const noexcept', 'Foo::Foo(int n) try']) {
      const code = `${head} : n_(n) {}\n`
      assertHas(code, 'cpp', 'n_', 'function.call')
      expect(
        scoped(code, 'cpp').some(([t, s]) => t === 'n_' && s === 'function'),
        code,
      ).toBeFalsy()
    }
    // The qualifiers keep their own colour, which is why the guard steps over
    // them in a state instead of swallowing them into one unscoped run.
    assertHas('Foo::Foo(int n) noexcept : n_(n) {}\n', 'cpp', 'noexcept', 'keyword.operator')
    assertHas('Foo::Foo(int n) const noexcept : n_(n) {}\n', 'cpp', 'const', 'keyword.declaration')
    assertHas('Foo::Foo(int n) try : n_(n) {}\n', 'cpp', 'try', 'keyword.control')
  })

  it('reads a constructor the same way at every indentation', () => {
    // Three levels of four-space indent put thirteen characters between the `)`
    // and the `:` on the next line, one past the window this used to allow —
    // and the break was silent, so the colouring changed with the nesting.
    for (const indent of [0, 4, 11, 12, 13, 24]) {
      const code = `C(int v)\n${' '.repeat(indent)}: v_(v) {}\n`
      assertHas(code, 'cpp', 'C', 'function')
      assertHas(code, 'cpp', 'v_', 'function.call')
    }
    // The comma that introduces every later entry has the same window, and the
    // same indentation reaches it.
    const wrapped = 'C::C(int v)\n    : a_(v),\n          b_(v) {}\n'
    assertHas(wrapped, 'cpp', 'a_', 'function.call')
    assertHas(wrapped, 'cpp', 'b_', 'function.call')
  })

  it('keeps a builtin builtin after a label, a case and a ternary', () => {
    assertHas('switch (k) { case 1: printf("x"); }\n', 'cpp', 'printf', 'function.builtin')
    assertHas('bool ok = a ? b : free(p);\n', 'cpp', 'free', 'function.builtin')
    assertHas('void f() {\n done:\n  exit(0);\n}\n', 'cpp', 'exit', 'function.builtin')
  })

  it('does not read a ternary with a braced false branch as a definition', () => {
    // `ok ? parse(s) : Result{}` has an identifier, a parameter list, a `:` and
    // a `{` in the order a constructor writes them. What a real member
    // initialiser also has is the `)` closing its last entry.
    const ternary = 'auto v = ok ? parse(s) : Result{};\n'
    assertHas(ternary, 'cpp', 'parse', 'function.call')
    expect(scoped(ternary, 'cpp').some(([t, s]) => t === 'parse' && s === 'function')).toBeFalsy()
    assertHas('x = a ? malloc(4) : Buf{};\n', 'cpp', 'malloc', 'function.builtin')
  })

  it('separates a builtin type from a user-defined one', () => {
    assertHas('size_t n = 0;\n', 'cpp', 'size_t', 'type.builtin')
    assertHas('std::string s;\n', 'cpp', 'string', 'type.builtin')
    assertHas('using Bytes = int;\n', 'cpp', 'Bytes', 'type')
    assertHas('class Ring {};\n', 'cpp', 'Ring', 'class')
    assertHas('enum class Level : uint8_t {};\n', 'cpp', 'Level', 'class')
  })

  it('scopes a namespace path apart from a class qualifier', () => {
    assertHas('auto v = ring::detail::flush();\n', 'cpp', 'ring', 'namespace')
    assertHas('auto v = ring::detail::flush();\n', 'cpp', '::', 'operator')
    assertHas('auto v = ring::detail::flush();\n', 'cpp', 'flush', 'function.call')
    // Capitalised, so it reads as the type it is rather than as a namespace.
    assertHas('auto v = Ring::make();\n', 'cpp', 'Ring', 'type')
    assertHas('namespace ring::detail {}\n', 'cpp', 'ring::detail', 'namespace')
  })

  it('tells a member from a method through both accessors', () => {
    assertHas('auto n = ptr->size();\n', 'cpp', 'size', 'function.method')
    assertHas('auto n = ptr->count;\n', 'cpp', 'count', 'variable.member')
    assertHas('auto n = box.size();\n', 'cpp', 'size', 'function.method')
    assertHas('auto n = box.count;\n', 'cpp', 'count', 'variable.member')
  })

  it('reads an apostrophe as a digit separator inside a number and as a quote outside one', () => {
    assertHas("size_t n = 1'048'576u;\n", 'cpp', "1'048'576u", 'number')
    assertHas("char sep = '\\t';\n", 'cpp', "'\\t'", 'string')
    // A separated literal must not open a character literal that runs on.
    expect(scoped("int a = 1'000, b = 2'000;\n", 'cpp').some(([, s]) => s === 'string')).toBeFalsy()
  })

  it('keeps a raw string raw, delimiter and all', () => {
    const code = 'auto q = R"sql(SELECT "x" FROM t)sql";\n'
    assertHas(code, 'cpp', 'R', 'string.special')
    assertHas(code, 'cpp', '"sql(SELECT "x" FROM t)sql"', 'string')
    // An ordinary literal still interprets its escapes and its format specs.
    assertHas('auto s = "a\\tb";\n', 'cpp', '\\t', 'string.escape')
    assertHas('printf("%#06x", n);\n', 'cpp', '%#06x', 'string.special')
    // A user-defined literal suffix belongs to the literal, not to the code.
    // The closing quote carries it, so no rule has to look behind for one.
    assertHas('auto s = "hi"sv;\n', 'cpp', 'sv', 'string.special')
    assertHas('auto q = R"(x)"s;\n', 'cpp', 's', 'string.special')
    assertHas('using namespace std::literals;\nauto d = "1s"s;\n', 'cpp', 's', 'string.special')
    // A quote that ends a literal with nothing glued to it stays a lone quote.
    assertHas('auto s = "hi";\n', 'cpp', '"hi"', 'string')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ["0xFF'FFu", "0b1010'0110", '0755', '1e-9', '.5f', '1.5', "18'446'744'073ULL", '100ms']) {
      assertHas(`auto x = ${literal};\n`, 'cpp', literal, 'number')
    }
    // A hex float keeps its binary exponent instead of stopping at the `0`.
    assertHas('auto x = 0x1p-3;\n', 'cpp', '0x1p-3', 'number')
  })

  it('reads the preprocessor as its own language', () => {
    assertHas('#include <vector>\n', 'cpp', '#include', 'keyword.import')
    assertHas('#include <vector>\n', 'cpp', '<vector>', 'string')
    assertHas('#include "buffer.hpp"\n', 'cpp', '"buffer.hpp"', 'string')
    // A macro is function-like exactly when `(` touches its name.
    assertHas('#define CLAMP(x) (x)\n', 'cpp', 'CLAMP', 'function')
    assertHas('#define MAX_BYTES 4096\n', 'cpp', 'MAX_BYTES', 'constant')
    assertHas('#ifdef RING_DEBUG\n#endif\n', 'cpp', '#ifdef', 'keyword.control')
    // C++23 added these two beside `elif`.
    assertHas('#elifdef X\n', 'cpp', '#elifdef', 'keyword.control')
    assertHas('#elifndef X\n', 'cpp', '#elifndef', 'keyword.control')
    assertHas('#pragma once\n', 'cpp', '#pragma', 'keyword')
    // The backslash that splices a macro onto the next line.
    assertHas('#define TWO(a) \\\n  a\n', 'cpp', '\\', 'operator')
  })

  it('scopes an attribute apart from the brackets around it', () => {
    assertHas('[[nodiscard]] bool ok();\n', 'cpp', '[[nodiscard]]', 'decorator')
    // A lambda's capture list is bracket-shaped, not attribute-shaped.
    assertHas('auto f = [](int x) { return x; };\n', 'cpp', '[](', 'punctuation.bracket')
    expect(scoped('auto f = [](int x) { return x; };\n', 'cpp').some(([, s]) => s === 'decorator')).toBeFalsy()
  })

  it('tells importing a namespace from declaring an alias', () => {
    assertHas('using namespace ring::detail;\n', 'cpp', 'using', 'keyword.import')
    assertHas('using namespace ring::detail;\n', 'cpp', 'namespace', 'keyword.import')
    // The whole path, the same way `namespace ring::detail {}` reads it. The
    // `(?=::)` rule alone leaves the last segment unscoped.
    assertHas('using namespace ring::detail;\n', 'cpp', 'ring::detail', 'namespace')
    assertHas('using Bytes = std::vector<uint8_t>;\n', 'cpp', 'using', 'keyword.declaration')
  })

  it('keeps the language constants and the stream globals apart', () => {
    assertHas('T* p = nullptr;\n', 'cpp', 'nullptr', 'constant.builtin')
    assertHas('bool ok = true;\n', 'cpp', 'true', 'boolean')
    assertHas('auto n = this->head_;\n', 'cpp', 'this', 'variable.builtin')
    assertHas('std::cout << x << std::endl;\n', 'cpp', 'cout', 'variable.builtin')
    assertHas('std::cout << x << std::endl;\n', 'cpp', 'std', 'namespace')
  })
})

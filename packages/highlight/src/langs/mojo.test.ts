import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import mojo from './mojo'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(mojo)

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
 * Idiomatic Mojo, chosen for what separates it from the Python it extends:
 * `fn` beside `def`, `struct`/`trait` instead of `class`, argument conventions,
 * a compile-time parameter list in `[]` ahead of the runtime one in `()`,
 * decorators that take arguments, SIMD types, and every literal form.
 */
const SAMPLE = `from math import sqrt
from memory import UnsafePointer

alias TILE = 64
alias Vec4 = SIMD[DType.float32, 4]
alias EPSILON: Float64 = 1e-9

trait Reducible:
    fn reduce(self) -> Float64:
        ...

@value
@register_passable("trivial")
struct Pixel(Copyable, Movable):
    """A packed RGBA pixel.

    Escapes stay literal in a docstring: \\n is a backslash and an n.
    """

    var rgba: SIMD[DType.uint8, 4]

    @always_inline
    fn __init__(out self, r: Int, g: Int, b: Int, a: Int = 0xFF):
        self.rgba = SIMD[DType.uint8, 4](r, g, b, a)

    fn __str__(self) -> String:
        return String("#{}").format(hex(self.luma()))

    fn luma(self) -> Int:
        var acc = 0

        @parameter
        for i in range(3):
            acc += Int(self.rgba[i])
        return acc // 3

struct Matrix[dtype: DType, rows: Int, cols: Int](Reducible):
    var data: UnsafePointer[Scalar[dtype]]

    fn __init__(out self):
        self.data = UnsafePointer[Scalar[dtype]].alloc(rows * cols)

    fn __del__(owned self):
        self.data.free()

    fn reduce(self) -> Float64:
        var total: Float64 = 0.0
        for i in range(rows * cols):
            total += Float64(self.data[i])
        return total

    fn scale(inout self, factor: Scalar[dtype]) -> Self:
        for i in range(rows * cols):
            self.data[i] *= factor
        return self

    fn dot(borrowed self, other: Self) -> Float64:
        return sqrt(self.reduce() * other.reduce())

fn load_mask(path: String) raises -> List[Int]:
    var mask = List[Int]()
    with open(path, "r") as handle:
        for line in handle.read().split("\\n"):
            if not line:
                continue
            mask.append(Int(line))
    return mask

fn describe[T: Stringable](read value: T, mut log: String, out ok: Bool):
    log += String("value={}").format(str(value))
    ok = True

async fn fetch(owned url: String) -> String:
    return await get(url)

def main():
    var flags = 0b1010_1101
    var mode = 0o755
    var scale = 6.022_140e23
    var p = Pixel(0x1F, 12, 255)
    print(f"luma={p.luma()} flags={flags:#x} scale={scale}")
    var m = Matrix[DType.float32, 4, 4]()
    var log = String()
    var ok = False
    describe(TILE, log, ok)
    if m.scale(2.5).reduce() > EPSILON and not flags == mode:
        print("scaled", m.dot(m), sep=", ")
    consume(log^)
`

describe('mojo', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'mojo')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'mojo')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'mojo')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `mojo emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'mojo')
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
        tokenize(prefix, 'mojo')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('answers to the fire alias', () => {
    // `.🔥` is a real Mojo file extension, and the registry lower-cases names,
    // which leaves an emoji alias untouched.
    assertHas('fn main():\n    pass\n', 'mojo', 'fn', 'keyword.declaration')
    assertHas('fn main():\n    pass\n', '🔥', 'fn', 'keyword.declaration')
  })

  it('separates the declaration keywords from control flow', () => {
    const code = 'alias N = 4\nstruct Box:\n    fn get(self) -> Int:\n        if N > 0:\n            return N\n'
    assertHas(code, 'mojo', 'alias', 'keyword.declaration')
    assertHas(code, 'mojo', 'struct', 'keyword.declaration')
    assertHas(code, 'mojo', 'fn', 'keyword.declaration')
    assertHas(code, 'mojo', 'if', 'keyword.control')
    assertHas(code, 'mojo', 'return', 'keyword.control')
  })

  it('reads an argument convention as a keyword and the name after it as a parameter', () => {
    const code = 'fn blit(inout dst: List[Int], read src: List[Int], out ok: Bool):\n'
    assertHas(code, 'mojo', 'inout', 'keyword')
    assertHas(code, 'mojo', 'dst', 'variable.parameter')
    assertHas(code, 'mojo', 'read', 'keyword')
    assertHas(code, 'mojo', 'out', 'keyword')
    assertHas(code, 'mojo', 'ok', 'variable.parameter')
    // `self` keeps its own identity after a convention rather than being read
    // as the first parameter name.
    assertHas('fn scale(inout self, factor: Int):\n', 'mojo', 'self', 'variable.builtin')

    // Outside a signature the same words are ordinary names, and inside one a
    // convention spelling used as an argument name still reads as a name.
    expect(scoped('var read = handle.read()\n', 'mojo').some(([t, s]) => t === 'read' && s === 'keyword')).toBeFalsy()
    assertHas('fn f(out=1)\n', 'mojo', 'out', 'variable.parameter')
  })

  it('tells the definition site from the call site', () => {
    assertHas('fn scale(v: Int) -> Int:\n    return v\n', 'mojo', 'scale', 'function')
    assertHas('var y = scale(v)\n', 'mojo', 'scale', 'function.call')
  })

  it('names the compile-time parameter list without losing its bounds', () => {
    const code = 'fn splat[T: AnyType, n: Int](value: T) -> Tuple[T]:\n    return value\n'
    assertHas(code, 'mojo', 'T', 'variable.parameter')
    assertHas(code, 'mojo', 'n', 'variable.parameter')
    assertHas(code, 'mojo', 'AnyType', 'type.builtin')
    assertHas(code, 'mojo', 'value', 'variable.parameter')
  })

  it('reads what follows the argument list as a return type, not as more parameters', () => {
    const code = 'fn load(path: String) raises -> List[Int]:\n    return List[Int]()\n'
    assertHas(code, 'mojo', 'path', 'variable.parameter')
    assertHas(code, 'mojo', 'raises', 'keyword')
    assertHas(code, 'mojo', 'List', 'type.builtin')
    // The `Int` of the return type sits after the signature's parameter states
    // have been left behind, so it is a type rather than a parameter name.
    expect(scoped(code, 'mojo').some(([t, s]) => t === 'Int' && s === 'variable.parameter')).toBeFalsy()
    assertHas(code, 'mojo', 'Int', 'type.builtin')
  })

  it('separates a builtin type from a user-defined struct', () => {
    assertHas('var n: Int = 0\n', 'mojo', 'Int', 'type.builtin')
    assertHas('alias V = SIMD[DType.float32, 4]\n', 'mojo', 'SIMD', 'type.builtin')
    assertHas('struct Matrix(Reducible):\n    var n: Int\n', 'mojo', 'Matrix', 'class')
    assertHas('struct Matrix(Reducible):\n    var n: Int\n', 'mojo', 'Reducible', 'type')
    assertHas('var m = Matrix[DType.float32]()\n', 'mojo', 'Matrix', 'type')
  })

  it('scopes a decorator apart from a call of the same name', () => {
    assertHas('@value\nstruct Pixel:\n    var n: Int\n', 'mojo', '@value', 'decorator')
    assertHas('@register_passable("trivial")\nstruct P:\n    var n: Int\n', 'mojo', '@register_passable', 'decorator')
    assertHas('var v = value(n)\n', 'mojo', 'value', 'function.call')
  })

  it('keeps an f-string interpolation apart from the literal text around it', () => {
    const code = 'print(f"rows={self.rows:>4} done")\n'
    assertHas(code, 'mojo', 'f', 'string.special')
    assertHas(code, 'mojo', '"rows=', 'string')
    assertHas(code, 'mojo', '{', 'interpolation')
    assertHas(code, 'mojo', 'self', 'variable.builtin')
    assertHas(code, 'mojo', 'rows', 'variable.member')
    assertHas(code, 'mojo', ':>4', 'string.special')
  })

  it('handles every numeric literal form', () => {
    for (const literal of ['0xFF', '0b1010_1101', '0o755', '6.022_140e23', '1e-9', '255']) {
      assertHas(`var x = ${literal}\n`, 'mojo', literal, 'number')
    }
  })

  it('separates a docstring from a comment and from an ordinary string', () => {
    assertHas('"""Summarise a run."""\n', 'mojo', '"""Summarise a run."""', 'comment.doc')
    assertHas('# just a note\n', 'mojo', '# just a note', 'comment')
    assertHas('var s = "text"\n', 'mojo', '"text"', 'string')
    assertHas('var s = "a\\tb"\n', 'mojo', '\\t', 'string.escape')
  })

  it('scopes a variadic parameter together with its sigil', () => {
    // The parameter-name rule is anchored on either the sigil or a word
    // boundary, because a plain `\b` in front never matches before a `*`.
    const code = 'fn f(a: Int, *args, **kwargs):\n    pass\n'
    assertHas(code, 'mojo', '*', 'operator')
    assertHas(code, 'mojo', 'args', 'variable.parameter')
    assertHas(code, 'mojo', '**', 'operator')
    assertHas(code, 'mojo', 'kwargs', 'variable.parameter')
    assertHas(code, 'mojo', 'a', 'variable.parameter')
  })

  it('reads a format spec that contains colons', () => {
    // The spec scan is length-capped rather than colon-free, because a real
    // one can hold several: `{now:%H:%M:%S}` is a whole spec, not three.
    assertHas('print(f"{now:%H:%M:%S}")\n', 'mojo', ':%H:%M:%S', 'string.special')
  })

  it('stays linear on a long name in a parameter list', () => {
    // The parameter-name rule was unanchored with an unbounded identifier, so
    // it restarted the scan at every column: 2.7 s at 32k characters. An
    // unterminated `fn f(` is what an editor sees mid-keystroke, and in a docs
    // pipeline it is untrusted text.
    const code = `fn f(${'a'.repeat(64_000)}`
    tokenize(code, 'mojo') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'mojo')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `a ${64_000}-character parameter name took ${elapsed.toFixed(0)}ms — the name rule is rescanning`,
    ).toBeLessThan(1000)
  })

  it('stays linear on a run of colons inside an unclosed interpolation', () => {
    // The format-spec scan ran to the end of the line and then failed, once per
    // colon: 1.9 s at 32k characters before the cap.
    const code = `var s = "{${':'.repeat(32_000)}`
    tokenize(code, 'mojo') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'mojo')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join('')).toBe(code)
    expect(
      elapsed,
      `${32_000} colons in an unclosed interpolation took ${elapsed.toFixed(0)}ms — the spec scan is rescanning`,
    ).toBeLessThan(1000)
  })

  it('scopes a parameter whose name starts outside ASCII', () => {
    // `ID` allows non-ASCII names, so the rule cannot be anchored with `\b`:
    // there is no word boundary in front of `π`.
    assertHas('fn f(π: Float64):\n    pass\n', 'mojo', 'π', 'variable.parameter')
  })

  it('keeps self and dunder names distinct inside a definition', () => {
    const code = 'struct P:\n    fn __init__(out self, n: Int):\n        self.n = n\n'
    assertHas(code, 'mojo', '__init__', 'function')
    assertHas(code, 'mojo', 'self', 'variable.builtin')
    assertHas(code, 'mojo', 'n', 'variable.member')
    assertHas(code, 'mojo', 'n', 'variable.parameter')
  })
})

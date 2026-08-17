import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import c from './c'

registerLanguage(c)

const known = new Set(Object.keys(SCOPES))

/**
 * A ring buffer, which is where C keeps everything a regex tokenizer trips
 * over: an apostrophe inside a comment, `/*` and `//` inside a string literal, a
 * double quote inside a character literal, a line-spliced macro, and a call and
 * a definition of the same function.
 */
const code = String.raw`/**
 * Fixed-capacity ring buffer.
 *
 * The capacity has to be a power of two - that is what turns the wrap-around
 * into a mask instead of a modulo.
 */
#include <stdio.h>
#include <stdlib.h>
#include "ring.h"

#define RING_CAP 1024u
#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define LOG(fmt, ...) \
    fprintf(stderr, "[%s:%d] " fmt "\n", __FILE__, __LINE__, __VA_ARGS__)

#ifndef NDEBUG
#  define TRACE(msg) fputs(msg, stderr)
#else
#  define TRACE(msg) ((void)0)
#endif

typedef enum { RING_OK = 0, RING_FULL = -1 } ring_status;

typedef struct ring {
    unsigned char *data;  /* storage, owned by the ring */
    size_t head, tail, cap;
    int (*on_drop)(struct ring *self, unsigned char byte);
} ring_t;

static const char *const STATUS_NAMES[] = { "ok", "full" };

/* A '\0' terminator isn't written here - the caller doesn't own the tail. */
static size_t ring_used(const ring_t *r)
{
    return (r->head - r->tail) & (r->cap - 1);
}

ring_t *ring_new(size_t cap)
{
    ring_t *r = calloc(1, sizeof(*r));
    if (r == NULL)
        return NULL;
    r->data = malloc(cap);
    r->cap = cap;
    r->head = r->tail = 0;
    return r;
}

int ring_push(ring_t *r, unsigned char byte)
{
    if (ring_used(r) + 1 >= r->cap) {
        if (r->on_drop != NULL && r->on_drop(r, byte) == 0)
            goto store;
        return RING_FULL;
    }
store:
    r->data[r->head] = byte;
    r->head = (r->head + 1) & (r->cap - 1);
    return RING_OK;
}

int main(void)
{
    static const double ratios[] = { 0.5, 1e-3, 0x1p-3, 3.14f };
    const char *note = "escape \t \"quoted\" \x41 and a /* not a comment */";
    const char *home = "https://scalar.com/docs#c";  // the // in there is data
    const wchar_t *wide = L"wide\u00e9";
    char sep = '\'', quote = '"', nul = '\0';
    unsigned long mask = 0xDEADBEEFUL, perms = 0755, half = 42UL / 2;

    ring_t *r = ring_new(RING_CAP);
    if (r == NULL) {
        perror("ring_new");
        return EXIT_FAILURE;
    }
    for (int i = 0; i < (int)MIN(RING_CAP, 8); i++)
        ring_push(r, (unsigned char)('a' + i));

    printf("used=%zu mask=%#lx ratio=%.3f sep=%c%s%s\n",
           ring_used(r), mask, ratios[0], sep, STATUS_NAMES[0], note);
    LOG("perms=%lo half=%lu quote=%c home=%s", perms, half, quote, home);
    free(r->data);
    free(r);
    return 0;
}
`

/**
 * Tokens as the renderer sees them: adjacent ranges sharing a scope are one
 * run, so a quoted string is `"abc"` rather than three separate pieces.
 */
const runs = (source: string, lang: string): [string, string | null][] => {
  const out: [string, string | null][] = []
  for (const token of tokenize(source, lang)) {
    const last = out[out.length - 1]
    if (last && last[1] === token.scope) last[0] += token.text
    else out.push([token.text, token.scope])
  }
  return out
}

/** All (text, scope) pairs for runs that carry a scope. */
const scoped = (source: string, lang: string): [string, string][] => {
  return runs(source, lang).filter((r) => r[1] !== null) as [string, string][]
}

const assertHas = (source: string, lang: string, text: string, scope: string): void => {
  const pairs = scoped(source, lang)
  expect(
    pairs.some(([t, s]) => t === text && s === scope),
    `expected ${JSON.stringify(text)} to be ${scope} in ${lang}, got ${JSON.stringify(
      pairs.filter(([t]) => t === text),
    )}`,
  ).toBeTruthy()
}

describe('c', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(code, 'c')
        .map((t) => t.text)
        .join(''),
    ).toBe(code)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(code, 'c')) {
      expect(code.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(code, 'c')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `c emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(code, 'c')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(code)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A half-typed `/*`, an unclosed string or a dangling `#define` is what an
    // editor feeds a highlighter on every keystroke.
    const step = Math.max(1, Math.floor(code.length / 60))
    for (let end = 0; end <= code.length; end += step) {
      const prefix = code.slice(0, end)
      expect(
        tokenize(prefix, 'c')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('separates control flow from declaration keywords', () => {
    assertHas(code, 'c', 'return', 'keyword.control')
    assertHas(code, 'c', 'goto', 'keyword.control')
    assertHas(code, 'c', 'static', 'keyword.declaration')
    assertHas(code, 'c', 'typedef', 'keyword.declaration')
    // `sizeof` looks like a call but is an operator on a type.
    assertHas(code, 'c', 'sizeof', 'keyword.operator')
  })

  it('tells a definition site from a call site', () => {
    // `ring_used` is defined with its brace on the next line and called twice.
    assertHas(code, 'c', 'ring_used', 'function')
    assertHas(code, 'c', 'ring_used', 'function.call')
    assertHas(code, 'c', 'main', 'function')
    // A libc name only counts as a builtin where it is being called.
    assertHas(code, 'c', 'printf', 'function.builtin')
    assertHas(code, 'c', 'free', 'function.builtin')
  })

  it('tells a builtin type from a typedef', () => {
    assertHas(code, 'c', 'size_t', 'type.builtin')
    assertHas(code, 'c', 'unsigned', 'type.builtin')
    assertHas(code, 'c', 'ring_t', 'type')
    // The tag of `struct ring` is the type, not part of the keyword.
    assertHas(code, 'c', 'ring', 'type')
  })

  it('scopes the preprocessor as its own layer', () => {
    assertHas(code, 'c', '#include', 'keyword.import')
    assertHas(code, 'c', '<stdio.h>', 'string')
    assertHas(code, 'c', '#define', 'keyword.declaration')
    assertHas(code, 'c', '#ifndef', 'keyword.control')
    // An object-like macro is a constant; a function-like one is a function,
    // and the same name at a use site is a call.
    assertHas(code, 'c', 'RING_CAP', 'constant')
    assertHas(code, 'c', 'MIN', 'function')
    assertHas(code, 'c', 'MIN', 'function.call')
    assertHas(code, 'c', '__FILE__', 'variable.special')
  })

  it('keeps member access apart from the operator that reaches it', () => {
    assertHas(code, 'c', '->', 'operator')
    assertHas(code, 'c', 'head', 'variable.member')
    // A member holding a function pointer is called through, so it reads as a
    // method rather than as a field.
    assertHas(code, 'c', 'on_drop', 'function.method')
  })

  it('reads every literal form', () => {
    assertHas(code, 'c', '1024u', 'number')
    assertHas(code, 'c', '0x1p-3', 'number')
    assertHas(code, 'c', '1e-3', 'number')
    assertHas(code, 'c', '3.14f', 'number')
    assertHas(code, 'c', '0755', 'number')
    assertHas(code, 'c', '0xDEADBEEFUL', 'number')
  })

  it('does not let a character literal open a string', () => {
    // `'"'` and `'\''` are the two ways a quote hides inside a char constant.
    assertHas(code, 'c', `'"'`, 'string')
    assertHas(code, 'c', String.raw`'\''`, 'string')
    assertHas(code, 'c', 'NULL', 'constant.builtin')
    assertHas(code, 'c', 'stderr', 'variable.builtin')
  })

  it('scopes escapes, format specs and encoding prefixes inside a string', () => {
    assertHas(code, 'c', String.raw`\t`, 'string.escape')
    assertHas(code, 'c', String.raw`\u00e9`, 'string.escape')
    assertHas(code, 'c', '%zu', 'string.special')
    assertHas(code, 'c', '%#lx', 'string.special')
    assertHas(code, 'c', 'L', 'string.special')
    // A `/*` or a `//` inside a literal is text, not the start of a comment.
    assertHas(code, 'c', ` and a /* not a comment */"`, 'string')
  })

  it('reads both comment forms, apostrophes and all', () => {
    assertHas(code, 'c', '// the // in there is data', 'comment')
    assertHas(
      code,
      'c',
      String.raw`/* A '\0' terminator isn't written here - the caller doesn't own the tail. */`,
      'comment',
    )
  })

  it('scopes rules the sample never reaches', () => {
    // These rules ship but the SAMPLE does not exercise them, so without this
    // they could regress silently.
    assertHas('p.field = 1;\n', 'c', '.', 'punctuation')
    assertHas('p.field = 1;\n', 'c', 'field', 'variable.member')
    assertHas('p.call();\n', 'c', 'call', 'function.method')
    assertHas('#pragma once\n', 'c', '#pragma', 'keyword')
    assertHas('int x = true;\n', 'c', 'true', 'boolean')
  })
})

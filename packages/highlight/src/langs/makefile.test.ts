import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import makefile from './makefile'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(makefile)

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
 * An idiomatic GNU Makefile, picked for the constructs that break a regex
 * tokenizer: every assignment operator, a `:` that means four different things,
 * `$` in all of its forms, tab-significant recipes, a tab-indented value
 * continuation, and a `define` body that would otherwise read as a rule.
 *
 * Recipe lines are indented with real tabs — with spaces make would reject the
 * file and this grammar would scope it as something else entirely.
 */
const SAMPLE = `# Build the widget toolkit.
# Run "make help" for the target list.

CC        ?= gcc
AR        := ar
VERSION   ::= 0.9.3
GIT_SHA   != git rev-parse --short HEAD
PREFIX    ?= /usr/local
BUILD_DIR := build
SRC_DIRS  := src \\
	src/platform
CFLAGS     = -std=c11 -Wall -Wextra
CFLAGS    += -I include -DVERSION='"$(VERSION)"'
LDLIBS    := -lm
UNAME_S   := $(shell uname -s)
SRCS      := $(foreach d,$(SRC_DIRS),$(wildcard $(d)/*.c))
OBJS      := $(patsubst %.c,$(BUILD_DIR)/%.o,$(SRCS))
DEPS      := $(OBJS:.o=.d)
export PATH := $(BUILD_DIR)/bin:\${PATH}

ifeq ($(UNAME_S),Darwin)
  CFLAGS += -DAPPLE
else ifeq ($(UNAME_S),Linux)
  CFLAGS += -pthread
endif

ifdef DEBUG
  CFLAGS += -O0 -g
else
  CFLAGS += -O2 -DNDEBUG
endif

ifneq ($(strip $(GIT_SHA)),)
  CFLAGS += -DGIT_SHA=$(GIT_SHA)
endif

define announce
	@printf '  %-8s %s\\n' "$(1)" "$(2)"
endef

include config.mk
-include $(DEPS)

.PHONY: all clean install test
.DEFAULT_GOAL := all

all: $(BUILD_DIR)/widget

$(BUILD_DIR)/widget: $(OBJS) | $(BUILD_DIR)
	$(call announce,LINK,$@)
	+$(CC) $(CFLAGS) -o $@ $^ $(LDLIBS)

$(BUILD_DIR)/%.o: %.c | $(BUILD_DIR)
	@mkdir -p $(dir $@)  # nested source trees
	@echo "compiling $* from $<"
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

$(BUILD_DIR):
	@mkdir -p \${BUILD_DIR}

install: all
	install -d $(DESTDIR)$(PREFIX)/bin
	install -m 0755 $(BUILD_DIR)/widget $(DESTDIR)$(PREFIX)/bin

test: all
	@for t in tests/*.sh; do \\
		echo "running $$t"; \\
		sh "$$t" || exit 1; \\
	done

clean::
	-rm -rf $(BUILD_DIR)
	@-rm -f $$HOME/.widget-cache
`

describe('makefile', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'makefile')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'makefile')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'makefile')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `makefile emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'makefile')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke, and a Makefile is full
    // of states that only a line ending closes.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'makefile')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('tells a target from an assignment when either reading has a colon', () => {
    assertHas('install: all\n', 'makefile', 'install', 'function')
    assertHas('install := /usr/bin/install\n', 'makefile', 'install', 'variable')
    assertHas('install := /usr/bin/install\n', 'makefile', ':=', 'operator')
    // The classic false positive: a URL in a value, where the `=` arrives long
    // before the `:` that would make this a rule line.
    expect(scoped('DOCS = https://example.com/make\n', 'makefile').some(([, s]) => s === 'function')).toBeFalsy()
  })

  it('scopes every assignment operator, including the ones opening with a colon', () => {
    for (const op of ['=', ':=', '::=', '?=', '+=', '!=']) {
      assertHas(`V ${op} x\n`, 'makefile', op, 'operator')
      assertHas(`V ${op} x\n`, 'makefile', 'V', 'variable')
    }
  })

  it('tells a make function from a variable whose name merely starts like one', () => {
    assertHas('S := $(shell uname -s)\n', 'makefile', 'shell', 'function.builtin')
    assertHas('S := $(shell uname -s)\n', 'makefile', '$(', 'punctuation.bracket')
    // No whitespace after the name, so make reads this as a reference to a
    // variable called `shellcheck` — brackets and all.
    assertHas('S := $(shellcheck)\n', 'makefile', '$(shellcheck)', 'variable')
    assertHas('S := $(SHELL)\n', 'makefile', '$(SHELL)', 'variable')
  })

  it('separates an automatic variable from a user variable', () => {
    const code = '%.o: %.c\n\t$(CC) -o $@ $< $(CFLAGS)\n'
    assertHas(code, 'makefile', '$@', 'variable.builtin')
    assertHas(code, 'makefile', '$<', 'variable.builtin')
    assertHas(code, 'makefile', '$(CC)', 'variable')
    // `$(@D)` is still the automatic variable, not a reference to `@D`.
    assertHas('all:\n\t@mkdir -p $(@D)\n', 'makefile', '$(@D)', 'variable.builtin')
  })

  it('tells a conditional directive from a target or variable called ifeq', () => {
    assertHas('ifeq ($(A),$(B))\nendif\n', 'makefile', 'ifeq', 'keyword.control')
    assertHas('ifeq: prepare\n', 'makefile', 'ifeq', 'function')
    assertHas('ifeq ?= yes\n', 'makefile', 'ifeq', 'variable')
    // `else ifneq` is one directive, and its arguments are bracketed.
    assertHas('else ifneq ($(A),)\n', 'makefile', 'else ifneq', 'keyword.control')
    assertHas('else ifneq ($(A),)\n', 'makefile', '(', 'punctuation.bracket')
  })

  it('reads $$ as an escape rather than as the start of an expansion', () => {
    const code = 'run:\n\t@echo $$HOME $(HOME) $$(date)\n'
    assertHas(code, 'makefile', '$$', 'string.escape')
    assertHas(code, 'makefile', '$(HOME)', 'variable')
    // `$$(date)` reaches the shell as a command substitution; make never sees
    // an expansion there, so neither does the highlighter.
    expect(scoped(code, 'makefile').some(([t]) => t === '$(date)')).toBeFalsy()
  })

  it('scopes recipe prefixes, an ignored-error rm, and a shell comment', () => {
    assertHas('clean:\n\t@-rm -rf build\n', 'makefile', '@-', 'operator')
    assertHas('all:\n\t+$(MAKE) -C sub\n', 'makefile', '+', 'operator')
    // A leading `-` on a recipe line is make's; a leading `-` on `include` is
    // part of the directive.
    assertHas('-include $(DEPS)\n', 'makefile', '-include', 'keyword.import')
    // The space in front of `#` is part of the match: the shell only starts a
    // comment at a word boundary, so `build#1` stays intact.
    assertHas('all:\n\t@mkdir -p build # if missing\n', 'makefile', ' # if missing', 'comment')
  })

  it('pulls the pattern stem out of both halves of a pattern rule', () => {
    const code = '$(BUILD)/%.o: %.c\n'
    expect(scoped(code, 'makefile').filter(([t, s]) => t === '%' && s === 'operator')).toHaveLength(2)
    assertHas(code, 'makefile', '$(BUILD)', 'variable')
    // The target name survives being split by the expansion and the stem.
    assertHas(code, 'makefile', '.o', 'function')
    assertHas(code, 'makefile', ':', 'punctuation.delimiter')
  })

  it('scopes function arguments as plain text with make-level separators', () => {
    const code = 'OBJS := $(patsubst %.c,%.o,$(SRCS))\n'
    assertHas(code, 'makefile', 'patsubst', 'function.builtin')
    assertHas(code, 'makefile', ',', 'punctuation.delimiter')
    assertHas(code, 'makefile', '$(SRCS)', 'variable')
    // The nested reference closes as a variable; the call closes as a bracket.
    assertHas(code, 'makefile', ')', 'punctuation.bracket')
    assertHas('L := $(foreach d,$(DIRS),$(d)/x)\n', 'makefile', 'foreach', 'function.builtin')
  })

  it('keeps a define body out of the rule and assignment rules', () => {
    const code = 'define greet\nhello: world\nendef\n'
    assertHas(code, 'makefile', 'define', 'keyword.declaration')
    assertHas(code, 'makefile', 'greet', 'variable')
    assertHas(code, 'makefile', 'endef', 'keyword.declaration')
    // The body is text until `endef`, so this line is not a rule.
    expect(scoped(code, 'makefile').some(([t]) => t === 'hello')).toBeFalsy()
  })

  it('tells a directive from a target that happens to share its name', () => {
    // Every one of these is also a legal target name, and reading one as a
    // directive swallowed the `:` and the prerequisites with it.
    for (const word of ['include', 'export', 'override', 'private', 'unexport', 'undefine', 'vpath']) {
      const code = `${word}: build\n`
      assertHas(code, 'makefile', word, 'function')
      assertHas(code, 'makefile', ':', 'punctuation.delimiter')
    }

    // The directives themselves are untouched.
    assertHas('include config.mk\n', 'makefile', 'include', 'keyword.import')
    assertHas('-include $(DEPS)\n', 'makefile', '-include', 'keyword.import')
    assertHas('export CFLAGS\n', 'makefile', 'export', 'keyword')
    assertHas('vpath %.c src\n', 'makefile', 'vpath', 'keyword')
    assertHas('override CFLAGS += -g\n', 'makefile', 'override', 'keyword')
  })

  it('scopes a comment at the end of a conditional line', () => {
    // The condition state holds to the end of the line, so root's comment rule
    // never sees this one.
    assertHas('ifeq ($(A),$(B))  # note\n', 'makefile', '# note', 'comment')
    assertHas('ifneq (a,b) # note\n', 'makefile', '# note', 'comment')
    // The line shapes that already scoped it, kept here so the four agree.
    assertHas('SRC := x # note\n', 'makefile', '# note', 'comment')
    assertHas('ifdef X # note\n', 'makefile', '# note', 'comment')
    assertHas('all: dep # note\n', 'makefile', '# note', 'comment')
  })

  it('expands the brace form and a substitution reference', () => {
    // Written as a template literal so the `${` is not read as a placeholder.
    assertHas('D := ${BUILD_DIR}\n', 'makefile', '${BUILD_DIR}', 'variable')
    const code = 'DEPS := $(OBJS:.o=.d)\n'
    assertHas(code, 'makefile', ':', 'operator')
    assertHas(code, 'makefile', '=', 'operator')
  })
})

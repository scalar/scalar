import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import dockerfile from './dockerfile'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(dockerfile)

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
 * An idiomatic multi-stage build, chosen for the constructs that break a
 * regex tokenizer: the `# syntax=` parser directive, logical lines held open by
 * trailing backslashes, `${VAR:-default}` expansion, `--mount=` flags with
 * comma-separated parts, both heredoc forms, and the JSON exec form of the
 * final `CMD` next to the shell form of `RUN`.
 */
const SAMPLE = `# syntax=docker/dockerfile:1.7
# check=error=true

ARG NODE_VERSION=20.14
ARG ALPINE_VERSION=3.20

FROM node:\${NODE_VERSION}-alpine\${ALPINE_VERSION} AS base
ENV PNPM_HOME="/pnpm" \\
    PATH="\${PNPM_HOME}:\${PATH}" \\
    NODE_ENV=production
WORKDIR /srv/app

FROM base AS deps
# A cache mount keeps the store between builds; a cold install costs minutes.
RUN --mount=type=cache,target=/pnpm/store,sharing=locked \\
    --mount=type=bind,source=package.json,target=package.json \\
    corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY --link . .
RUN <<EOF
set -eux
pnpm run build
find dist -name '*.map' -delete
EOF

FROM base AS runtime
LABEL org.opencontainers.image.source="https://github.com/scalar/highlight" \\
      org.opencontainers.image.licenses=MIT \\
      maintainer="platform@example.com"

ARG PORT
ENV PORT=\${PORT:-8080}
ENV TZ Etc/UTC

RUN --mount=type=cache,target=/var/cache/apk \\
    apk add --no-cache curl tini \\
 && addgroup -S app && adduser -S -G app app \\
 && printf 'fs.file-max = 65536\\n' > /etc/sysctl.d/99-app.conf

COPY --from=build --chown=app:app /srv/app/dist ./dist
COPY --from=deps --chmod=755 /srv/app/node_modules ./node_modules
COPY <<-'EOT' /etc/app/banner.txt
  $NOT_EXPANDED, because the opener quoted its terminator
EOT

USER app:app
EXPOSE 8080/tcp 9229
VOLUME ["/srv/app/data"]
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -fsS "http://127.0.0.1:\${PORT}/healthz" || exit 1

SHELL ["/bin/sh", "-eu", "-o", "pipefail", "-c"]
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/server.js"]

ONBUILD COPY ./hooks /srv/app/hooks
`

describe('dockerfile', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'dockerfile')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'dockerfile')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'dockerfile')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `dockerfile emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'dockerfile')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: this is what an
    // editor feeds the highlighter on every keystroke, and a heredoc or a
    // continued line is exactly the shape that gets stuck.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'dockerfile')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('reads an instruction only at the start of a logical line', () => {
    const code = 'RUN run copy nginx\nCMD ["nginx"]\n'
    assertHas(code, 'dockerfile', 'RUN', 'keyword')
    assertHas(code, 'dockerfile', 'CMD', 'keyword')
    const pairs = scoped(code, 'dockerfile')
    expect(pairs.some(([t]) => t === 'run' || t === 'copy')).toBeFalsy()
  })

  it('binds the stage name AS declares and the flag that refers back to it', () => {
    const code = 'FROM node:20-alpine AS builder\nCOPY --from=builder /app /app\n'
    assertHas(code, 'dockerfile', 'FROM', 'keyword.import')
    assertHas(code, 'dockerfile', 'node:20-alpine', 'string')
    assertHas(code, 'dockerfile', 'AS', 'keyword.operator')
    assertHas(code, 'dockerfile', 'builder', 'type')
    assertHas(code, 'dockerfile', '--from', 'constant')
  })

  it('tells a flag from a hyphen inside a command name', () => {
    const code = 'RUN apt-get install -y --no-install-recommends curl\n'
    assertHas(code, 'dockerfile', '-y', 'constant')
    assertHas(code, 'dockerfile', '--no-install-recommends', 'constant')
    // The `-get` of `apt-get` is not a flag, so nothing may claim it.
    expect(scoped(code, 'dockerfile').some(([t]) => t === '-get')).toBeFalsy()
  })

  it('takes a mount flag apart into its named fields', () => {
    const code = 'RUN --mount=type=cache,target=/root/.cache pip install .\n'
    assertHas(code, 'dockerfile', '--mount', 'constant')
    assertHas(code, 'dockerfile', 'type', 'variable.parameter')
    assertHas(code, 'dockerfile', 'target', 'variable.parameter')
    assertHas(code, 'dockerfile', ',', 'punctuation.delimiter')
  })

  it('separates the braces of an expansion from what is inside them', () => {
    const code = 'ENV PORT=${PORT:-8080}\n'
    assertHas(code, 'dockerfile', '${', 'interpolation')
    assertHas(code, 'dockerfile', '}', 'interpolation')
    assertHas(code, 'dockerfile', 'PORT', 'variable')
    assertHas(code, 'dockerfile', ':-', 'operator')
    // The default is a value rather than more of the variable name.
    assertHas(code, 'dockerfile', '8080', 'string')
  })

  it('names an ENV key in both the modern and the legacy form', () => {
    assertHas('ENV TZ Etc/UTC\n', 'dockerfile', 'TZ', 'variable')
    const code = 'ENV NODE_ENV=production PORT=3000\n'
    assertHas(code, 'dockerfile', 'NODE_ENV', 'variable')
    assertHas(code, 'dockerfile', 'PORT', 'variable')
    assertHas(code, 'dockerfile', '3000', 'number')
    assertHas('ARG NODE_VERSION\n', 'dockerfile', 'NODE_VERSION', 'variable')
  })

  it('scopes a dotted LABEL key as a property, not as a variable', () => {
    const code = 'LABEL org.opencontainers.image.title="app" version="1.0"\n'
    assertHas(code, 'dockerfile', 'org.opencontainers.image.title', 'property')
    assertHas(code, 'dockerfile', 'version', 'property')
    assertHas(code, 'dockerfile', '"app"', 'string')
  })

  it('reads a parser directive as a setting and everything else as a comment', () => {
    const code = '# syntax=docker/dockerfile:1\n# just a note\n'
    assertHas(code, 'dockerfile', '#', 'comment')
    assertHas(code, 'dockerfile', 'syntax', 'keyword')
    assertHas(code, 'dockerfile', 'docker/dockerfile:1', 'string')
    assertHas(code, 'dockerfile', '# just a note', 'comment')
  })

  it('keeps a continued line inside the instruction that opened it', () => {
    const code = 'RUN set -e \\\n && echo ok\nCMD ["x"]\n'
    assertHas(code, 'dockerfile', '\\\n', 'operator')
    assertHas(code, 'dockerfile', '&&', 'operator')
    // The instruction after the continuation is a keyword again, which only
    // holds if the logical line ended where it should.
    assertHas(code, 'dockerfile', 'CMD', 'keyword')
  })

  it('ends a heredoc body at its terminator and hands the file back', () => {
    const code = 'RUN <<EOF\napt-get update\nEOF\nUSER app\n'
    assertHas(code, 'dockerfile', '<<', 'operator')
    assertHas(code, 'dockerfile', 'EOF', 'string.special')
    assertHas(code, 'dockerfile', 'apt-get update\n', 'string')
    assertHas(code, 'dockerfile', 'USER', 'keyword')
  })

  it('scopes the JSON exec form but leaves the shell form bare', () => {
    const code = 'CMD ["node", "app.js"]\n'
    assertHas(code, 'dockerfile', '[', 'punctuation.bracket')
    assertHas(code, 'dockerfile', '"node"', 'string')
    assertHas(code, 'dockerfile', ',', 'punctuation.delimiter')
    // The shell form is a command line, so only the instruction is coloured.
    expect(scoped('CMD node app.js\n', 'dockerfile').map(([t]) => t)).toEqual(['CMD'])
  })

  it('recognises the CMD that HEALTHCHECK carries, but only as its first argument', () => {
    const code = 'HEALTHCHECK --interval=30s CMD curl -f http://localhost/cmd\n'
    assertHas(code, 'dockerfile', 'CMD', 'keyword')
    assertHas(code, 'dockerfile', '30', 'number')
    assertHas(code, 'dockerfile', 's', 'unit')
    // The `/cmd` of the URL is guarded by its slash, so it proves less than it
    // looks: the words below are the ones that used to be read as a second
    // instruction, because the rule matched anywhere on the line.
    expect(scoped(code, 'dockerfile').some(([t, s]) => t === 'cmd' && s === 'keyword')).toBeFalsy()

    const trailing = 'HEALTHCHECK --retries=3 CMD sh -c "x" || cmd\n'
    expect(scoped(trailing, 'dockerfile').some(([t]) => t === 'cmd')).toBeFalsy()

    const literal = 'HEALTHCHECK CMD echo none\n'
    assertHas(literal, 'dockerfile', 'CMD', 'keyword')
    expect(scoped(literal, 'dockerfile').some(([t]) => t === 'none')).toBeFalsy()

    assertHas('HEALTHCHECK NONE\n', 'dockerfile', 'NONE', 'constant.builtin')
  })

  it('scopes an instruction that has no arguments yet', () => {
    // What an editor sees on every keystroke while the line is being typed.
    for (const word of ['ENV', 'ARG', 'LABEL']) {
      assertHas(`${word}\n`, 'dockerfile', word, 'keyword.declaration')
    }
    assertHas('FROM\n', 'dockerfile', 'FROM', 'keyword.import')
    assertHas('ONBUILD ENV\n', 'dockerfile', 'ENV', 'keyword.declaration')
  })

  it('keeps a whole image reference a string, expansion and all', () => {
    // Template literals so the `${` is not read as a placeholder here.
    // An expansion in the middle of the reference: the state is what carries
    // the string colour past the closing brace and back onto the tail.
    const middle = 'FROM node:${TAG}-alpine AS base\n'
    assertHas(middle, 'dockerfile', 'node:', 'string')
    assertHas(middle, 'dockerfile', '-alpine', 'string')
    assertHas(middle, 'dockerfile', '${', 'interpolation')
    assertHas(middle, 'dockerfile', 'TAG', 'variable')
    assertHas(middle, 'dockerfile', 'base', 'type')

    // A reference may also open with the expansion, which is how a registry is
    // parameterised. Holding `$` out of the reference left the tail unscoped
    // and handed the tag to the port rule, which read it as a number.
    for (const code of ['FROM ${REGISTRY}/node:18\n', 'FROM $REG/node:18\n']) {
      assertHas(code, 'dockerfile', '/node:18', 'string')
      expect(
        scoped(code, 'dockerfile').some(([, s]) => s === 'number'),
        code,
      ).toBeFalsy()
    }
    // A flag still is not one, so `--platform` keeps its own reading.
    assertHas('FROM --platform=$TARGETPLATFORM node:18\n', 'dockerfile', '--platform', 'constant')
    assertHas('FROM --platform=$TARGETPLATFORM node:18\n', 'dockerfile', 'node:18', 'string')
  })

  it('reads a dash as a flag only where a word can start', () => {
    // `\B` holds after every non-word character, not only after whitespace, so
    // a dash glued to an `=` or to the brace of an expansion opened a flag.
    const value = 'RUN cmd --opt=-value\n'
    assertHas(value, 'dockerfile', '--opt', 'constant')
    expect(scoped(value, 'dockerfile').some(([t]) => t === '-value')).toBeFalsy()
    const glued = 'RUN cmd ${X}-y\n'
    expect(scoped(glued, 'dockerfile').some(([t]) => t === '-y')).toBeFalsy()
    // The flags that are flags are unaffected, on both spellings.
    assertHas('RUN cmd -y --no-cache\n', 'dockerfile', '-y', 'constant')
    assertHas('RUN cmd -y --no-cache\n', 'dockerfile', '--no-cache', 'constant')
  })

  it('reads a number only where a number starts a word', () => {
    assertHas('EXPOSE 8080/tcp\n', 'dockerfile', '8080', 'number')
    assertHas('ENV PORT=3000\n', 'dockerfile', '3000', 'number')
    assertHas('RUN cmd 2>&1\n', 'dockerfile', '1', 'number')
    // A version, a release and a tool name carry digits that are part of a
    // word, and none of them is a number.
    expect(scoped('RUN cat 18.04 python3 v1.2.3 x2\n', 'dockerfile').some(([, s]) => s === 'number')).toBeFalsy()
  })

  it('reads an uppercase unit the same way after every instruction', () => {
    // `ignoreCase` used to be set on the states carrying `AS` and `CMD`, and it
    // applied to every rule they include as well — so `30S` split into a number
    // and a unit after a flag while it stayed one bare word after `EXPOSE`.
    expect(scoped('EXPOSE 30S\n', 'dockerfile').some(([, s]) => s === 'unit')).toBeFalsy()
    expect(scoped('HEALTHCHECK --interval=30S CMD x\n', 'dockerfile').some(([, s]) => s === 'unit')).toBeFalsy()
    // The instruction words themselves are still case-insensitive.
    assertHas('from node:20 as build\n', 'dockerfile', 'as', 'keyword.operator')
    assertHas('healthcheck cmd x\n', 'dockerfile', 'cmd', 'keyword')
  })

  it('keeps lookbehind out of every pattern', () => {
    // Lookbehind takes the whole merged pattern of a state off JavaScriptCore's
    // fast path, and the penalty is all or nothing: `RUN a b c d e …` measured
    // 454 ns/char with the three lookbehinds `args` used to carry and 22
    // ns/char with none, so one rule putting one back gives the win away.
    const offenders: string[] = []
    for (const [name, state] of Object.entries(dockerfile.states)) {
      for (const rule of state.rules) {
        if (!('match' in rule)) continue
        const src = typeof rule.match === 'string' ? rule.match : rule.match.source
        if (src.includes('(?<=') || src.includes('(?<!')) offenders.push(`${name}: ${src}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

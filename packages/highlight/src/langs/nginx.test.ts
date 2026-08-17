import { describe, expect, it } from 'vitest'

import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import nginx from './nginx'

// Registered here so this suite stands on its own rather than depending on
// `src/all.ts` import order; registering twice is harmless.
// The registry is a module-level singleton, and re-registering is idempotent.
registerLanguage(nginx)

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
 * An idiomatic edge-proxy `nginx.conf`, chosen for the constructs that break
 * regex tokenizers: `http` > `server` > `location` nesting, every `location`
 * matcher, regexes carrying `{`, `}` and a quoted `;`, `if` conditions with
 * both a regex and a file test, `$var` and `${var}` inside and outside quotes,
 * a multi-line quoted `log_format`, and `server` meaning two different things
 * depending on whether its line ends in a brace.
 */
const SAMPLE = `# /etc/nginx/nginx.conf — edge proxy for the docs site
user                 www-data;
worker_processes     auto;
error_log            /var/log/nginx/error.log warn;
pid                  /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include            /etc/nginx/mime.types;
    default_type       application/octet-stream;
    sendfile           on;
    keepalive_timeout  65s;
    client_max_body_size 10m;
    gzip on;

    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent "\${http_referer}"';
    access_log /var/log/nginx/access.log main;

    map $http_upgrade $connection_upgrade {
        default    upgrade;
        ''         close;
        ~*^polling close;
    }

    upstream docs_backend {
        least_conn;
        server 10.0.0.11:8080 weight=5 max_fails=3 fail_timeout=30s;
        server 10.0.0.12:8080 backup;
        keepalive 32;
    }

    server {
        listen      80 default_server;
        listen      [::]:80;
        server_name example.com *.docs.example.com;
        return      301 https://$host$request_uri;
    }

    server {
        listen              443 ssl http2;
        server_name         docs.example.com;
        ssl_certificate     /etc/letsencrypt/live/docs/fullchain.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_session_timeout 1d;
        root                /srv/www/docs;

        if ($request_method !~ ^(GET|HEAD|POST)$) {
            return 405;
        }

        if (-f $document_root/maintenance.html) {
            return 503;
        }

        location = /healthz {
            access_log off;
            return 200 "ok\\n";
        }

        location ^~ /assets/ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        location ~* \\.(?:css|js|png|jpe?g|woff2)$ {
            expires 7d;
            try_files $uri =404;
        }

        location ~ ^/api/v[0-9]{1,2}/(.*)$ {
            proxy_pass         http://docs_backend/$1;
            proxy_http_version 1.1;
            proxy_set_header   Host       $host;
            proxy_set_header   Upgrade    $http_upgrade;
            proxy_set_header   Connection $connection_upgrade;
            proxy_set_header   X-Trace-Id "\${request_id}";
            proxy_read_timeout 60s;
        }

        location / {
            try_files $uri $uri/ /index.html;
        }

        rewrite ^/docs/v{1,2}/(.*)$ /$1 permanent;
        rewrite "^/legacy;path$" /new break;

        error_page 500 502 503 504 /50x.html;
    }
}
`

describe('nginx', () => {
  it('emits tokens that cover the source exactly', () => {
    expect(
      tokenize(SAMPLE, 'nginx')
        .map((t) => t.text)
        .join(''),
    ).toBe(SAMPLE)
  })

  it('emits ranges that agree with their text', () => {
    for (const token of tokenize(SAMPLE, 'nginx')) {
      expect(SAMPLE.slice(token.start, token.end)).toBe(token.text)
    }
  })

  it('only uses scopes from the shared vocabulary', () => {
    for (const token of tokenize(SAMPLE, 'nginx')) {
      if (token.scope !== null) {
        expect(known.has(token.scope), `nginx emitted unregistered scope "${token.scope}"`).toBeTruthy()
      }
    }
  })

  it('round-trips through the HTML renderer', () => {
    const text = highlight(SAMPLE, 'nginx')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
    expect(text).toBe(SAMPLE)
  })

  it('terminates and stays consistent on every truncation', () => {
    // A state that never pops shows up here and nowhere else: an open block, a
    // half-typed regex operand and an unclosed quote are what an editor feeds
    // the highlighter on every keystroke.
    const step = Math.max(1, Math.floor(SAMPLE.length / 60))
    for (let end = 0; end <= SAMPLE.length; end += step) {
      const prefix = SAMPLE.slice(0, end)
      expect(
        tokenize(prefix, 'nginx')
          .map((t) => t.text)
          .join(''),
      ).toBe(prefix)
    }
  })

  it('tells a block directive from a simple one', () => {
    const code = 'server {\n    listen 80;\n}\n'
    assertHas(code, 'nginx', 'server', 'keyword')
    assertHas(code, 'nginx', 'listen', 'property')
  })

  it('reads the same word as a context or a directive depending on the line', () => {
    // `server` opens a context under `http` and is a plain directive under
    // `upstream`. Nothing but the trailing brace can tell them apart.
    const code = 'upstream pool {\n    server 10.0.0.11:8080 weight=5;\n}\n'
    assertHas(code, 'nginx', 'upstream', 'keyword')
    assertHas(code, 'nginx', 'server', 'property')
    expect(scoped(code, 'nginx').some(([t, s]) => t === 'server' && s === 'keyword')).toBeFalsy()
  })

  it('scopes only the first word of a statement as the directive', () => {
    const code = 'proxy_set_header Host $host;\n'
    const directives = scoped(code, 'nginx')
      .filter(([, s]) => s === 'property')
      .map(([t]) => t)
    expect(directives).toEqual(['proxy_set_header'])
    assertHas(code, 'nginx', '$host', 'variable')
  })

  it('separates a location regex from a plain prefix', () => {
    const regex = 'location ~ ^/api/(.*)$ {\n}\n'
    assertHas(regex, 'nginx', '^/api/(.*)$', 'regexp')

    const prefix = 'location /static/ {\n}\n'
    assertHas(prefix, 'nginx', '/static/', 'string')
    expect(scoped(prefix, 'nginx').some(([, s]) => s === 'regexp')).toBeFalsy()
  })

  it('keeps a brace inside a regex out of the block structure', () => {
    // The classic trap: `{` here is a repetition count, not a context opener.
    const location = 'location ~ ^/v[0-9]{1,2}/x$ {\n}\n'
    assertHas(location, 'nginx', 'location', 'keyword')
    assertHas(location, 'nginx', '^/v[0-9]{1,2}/x$', 'regexp')

    // The same braces on a `rewrite` line, which opens nothing.
    const rewrite = 'rewrite ^/docs/v{1,2}/(.*)$ /$1 permanent;\n'
    assertHas(rewrite, 'nginx', 'rewrite', 'property')
    assertHas(rewrite, 'nginx', '^/docs/v{1,2}/(.*)$', 'regexp')
    expect(scoped(rewrite, 'nginx').some(([, s]) => s === 'keyword')).toBeFalsy()
  })

  it('lets a quoted regex carry a semicolon', () => {
    const code = 'rewrite "^/legacy;path$" /new break;\n'
    assertHas(code, 'nginx', '"^/legacy;path$"', 'regexp')
    assertHas(code, 'nginx', ';', 'punctuation.delimiter')
  })

  it('scopes every location matcher as an operator', () => {
    assertHas('location = /50x.html {\n}\n', 'nginx', '=', 'operator')
    assertHas('location ^~ /assets/ {\n}\n', 'nginx', '^~', 'operator')
    assertHas('location ~* \\.css$ {\n}\n', 'nginx', '~*', 'operator')
    assertHas('location ~* \\.css$ {\n}\n', 'nginx', '\\.css$', 'regexp')
  })

  it('reads an if condition without letting the regex eat the paren', () => {
    const code = 'if ($request_method !~ ^(GET|HEAD)$) {\n    return 405;\n}\n'
    assertHas(code, 'nginx', 'if', 'keyword')
    assertHas(code, 'nginx', '$request_method', 'variable')
    assertHas(code, 'nginx', '!~', 'operator')
    assertHas(code, 'nginx', '^(GET|HEAD)$', 'regexp')
    assertHas(code, 'nginx', ')', 'punctuation.bracket')
    // The file tests of the other `if` shape, which is not a regex at all.
    assertHas('if (-f $document_root/x.html) {\n}\n', 'nginx', '-f', 'keyword.operator')
  })

  it('expands variables inside a quoted value but keeps the rest a string', () => {
    const code = `return 200 "hello $host \${request_id}";\n`
    assertHas(code, 'nginx', '"hello ', 'string')
    assertHas(code, 'nginx', '$host', 'variable')
    assertHas(code, 'nginx', '${request_id}', 'variable')
  })

  it('splits a size or a duration into a number and a unit', () => {
    const literals: [string, string][] = [
      ['10', 'm'],
      ['30', 's'],
      ['1', 'd'],
    ]
    for (const [value, unit] of literals) {
      const code = `keepalive_timeout ${value}${unit};\n`
      assertHas(code, 'nginx', value, 'number')
      assertHas(code, 'nginx', unit, 'unit')
    }
    // An address is one literal, and a version is not a number at all.
    assertHas('server 127.0.0.1:8080;\n', 'nginx', '127.0.0.1', 'number')
    expect(scoped('ssl_protocols TLSv1.2 TLSv1.3;\n', 'nginx').some(([, s]) => s === 'number')).toBeFalsy()
  })

  it('does not read a directive out of a comment', () => {
    const code = '# server {\nlisten 80;\n'
    assertHas(code, 'nginx', '# server {', 'comment')
    expect(scoped(code, 'nginx').some(([, s]) => s === 'keyword')).toBeFalsy()
  })

  it('reads a comment where a regex operand should be', () => {
    // The operand state holds until it has taken a word, so without a rule for
    // it the `#` was the operand and the comment after it was nothing.
    const code = 'rewrite # note\nlocation ~ # note\n'
    assertHas(code, 'nginx', '# note', 'comment')
    expect(scoped(code, 'nginx').some(([, s]) => s === 'regexp')).toBeFalsy()
    // A `#` *inside* an operand is still part of it: the operand starts first,
    // and the earlier match wins.
    assertHas('rewrite ^/a#b$ /c;\n', 'nginx', '^/a#b$', 'regexp')
  })

  it('opens a context through the braces of a repetition count', () => {
    // The block lookahead stops at each brace and tolerates three of them
    // before the one that ends the line, which is what a repetition count in a
    // `location` regex needs.
    for (const regex of ['^/v[0-9]{1,2}/x$', '^/a{1,2}/b{3,4}$', '^/a{1,2}/b{3,4}/c{5,6}$']) {
      assertHas(`location ~ ${regex} {\n}\n`, 'nginx', 'location', 'keyword')
    }
  })
})

/**
 * Two shapes of untrusted input that used to cost hundreds of times what the
 * text is worth. A fenced block in someone else's document reaches the
 * highlighter, so this is a denial of service rather than a slow render.
 */
describe('nginx cost on a pathological line', () => {
  /**
   * Per-character cost of two inputs, measured against each other.
   *
   * The two are timed alternately inside one loop rather than one after the
   * other, and each keeps its best run. A ratio of two separately-timed
   * measurements is only as stable as the quieter of them, so a scheduler
   * stall landing in the middle of the first input's runs shows up as a
   * regression; alternating puts that stall in both sides' samples, and
   * best-of keeps whichever runs were not disturbed.
   */
  const costRatio = (a: string, b: string): number => {
    let bestA = Number.POSITIVE_INFINITY
    let bestB = Number.POSITIVE_INFINITY
    for (let run = 0; run < 9; run++) {
      let start = performance.now()
      tokenize(a, 'nginx')
      bestA = Math.min(bestA, (performance.now() - start) / a.length)

      start = performance.now()
      tokenize(b, 'nginx')
      bestB = Math.min(bestB, (performance.now() - start) / b.length)
    }
    return bestA / bestB
  }

  it('does not backtrack a directive name into the block lookahead', () => {
    // One very long word is one directive. Until the name was made
    // non-backtracking, every shorter prefix of it re-ran the capped
    // block-opening lookahead: 1.2 s of CPU per megabyte on V8 and 3.1 s on
    // JavaScriptCore, against 20 ms now. The bound is loose on purpose — three
    // orders of magnitude separate the two, so it cannot flake under load.
    const code = 'a'.repeat(1_000_000)
    tokenize(code.slice(0, 1000), 'nginx') // compile the grammar outside the measurement

    const start = performance.now()
    const tokens = tokenize(code, 'nginx')
    const elapsed = performance.now() - start

    expect(tokens.map((t) => t.text).join(''), 'a one-word megabyte did not round-trip').toBe(code)
    expect(
      elapsed,
      `a one-word megabyte took ${elapsed.toFixed(0)}ms — the directive name is backtracking into the lookahead`,
    ).toBeLessThan(1000)
  })

  it('does not walk the whole lookahead window at every brace', () => {
    // `${a${a…` starts a statement every three characters. `$;a$;a…` starts
    // just as many, but the lookahead stops dead at the `;`, so the pair
    // isolates what the block check costs. Comparing the two rather than the
    // clock keeps this a property of the grammar: it was 2.4x to 3.9x when the
    // scan ran to the cap at every brace, and is 1.0x to 1.3x now.
    const braces = '${a'.repeat(120_000)
    const semicolons = '$;a'.repeat(120_000)
    tokenize(braces.slice(0, 300), 'nginx') // compile the grammar outside the measurement

    const ratio = costRatio(braces, semicolons)
    expect(
      ratio,
      `a brace-dense line cost ${ratio.toFixed(1)}x a semicolon-dense one of the same shape, ` +
        'which means the block lookahead is scanning its whole window at every brace',
    ).toBeLessThan(2)
    // Eighteen timed passes over 360 KB do not fit the 5 s default. The
    // payload is deliberately this large: the shorter one made each run brief
    // enough that a scheduler stall was a large fraction of it, and the ratio
    // flaked to 2.7x under CPU contention against a healthy 1.2x.
  }, 60_000)
})

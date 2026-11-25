import type { ElementContent } from 'hast'
import { describe, expect, it } from 'vitest'

import { textFromHtml } from '../../test/html'
import { toHast } from '../compat/hast'
import { standardLanguages } from '../compat/languages'
import { syntaxHighlight } from '../compat/syntax-highlight'
import { SCOPES } from '../core/scopes'
import { highlight, registerLanguage, tokenize } from '../index'
import { loadLanguage, resolveLanguageName } from '../lazy'
import log from './log'

/** Merge adjacent ranges as the HTML renderers do. */
const runs = (code: string): [string, string | null][] => {
  const result: [string, string | null][] = []
  for (const token of tokenize(code, log)) {
    const previous = result.at(-1)
    if (previous && previous[1] === token.scope) {
      previous[0] += token.text
    } else {
      result.push([token.text, token.scope])
    }
  }
  return result
}

const scoped = (code: string): [string, string | null][] => runs(code).filter(([, scope]) => scope !== null)

const hastText = (nodes: ElementContent[]): string =>
  nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.value
      }
      if (node.type === 'element') {
        return hastText(node.children)
      }
      return ''
    })
    .join('')

// Independent layout examples, with messages changed to keep fixtures brief.
// Log4j PatternLayout: %-5p [%t]: %m%n
// https://logging.apache.org/log4j/2.x/manual/pattern-layout.html
const LOG4J = 'DEBUG [main]: Cache warmed\nWARN  [worker-2]: Queue busy\n'
// log4net PatternLayout: %date [%thread] %-5level %logger - %message%newline
// https://logging.apache.org/log4net/manual/configuration/layouts.html
const LOG4NET = '2024-12-21 14:07:41,517 [main] DEBUG Animals.Carnivora.Dog - Animal ready\n'

const MULTILINE = `${LOG4J}${LOG4NET}[Error] Request failed: java.lang.IllegalStateException: invalid state\r\n\tat example.Service.run(Service.java:42)\r\nCaused by: java.io.IOException: missing file\r\n    at read (/srv/worker.js:12:4)\n    at the end of an ordinary sentence\n追加の詳細 🦊 café e\u0301\nINFO Done\n`

describe('log', () => {
  it('loads log directly, lazily, eagerly, and through compatibility output', async () => {
    expect(log.name).toBe('log')
    expect(resolveLanguageName('LOG')).toBe('log')
    expect((await loadLanguage('LOG')).name).toBe('log')
    const { languages, highlight: eagerHighlight } = await import('../all')
    expect(languages.filter((grammar) => grammar.name === 'log').map((grammar) => grammar.name)).toStrictEqual(['log'])
    expect(eagerHighlight('INFO ready', 'log')).toBe('<span class="shl-k">INFO</span> ready')
    expect(Object.hasOwn(standardLanguages, 'log')).toBe(false)
    expect(syntaxHighlight('INFO ready', { lang: 'log' })).toBe(
      '<pre><code class="hljs language-log"><span class="hljs-keyword">INFO</span> ready</code></pre>',
    )
    // Existing shell aliases retain their meaning; log has no additional alias.
    expect(resolveLanguageName('console')).toBe('bash')
  })

  it('recognizes the documented Log4j severity-first layout', () => {
    expect(scoped(LOG4J)).toStrictEqual([
      ['DEBUG', 'keyword'],
      ['[main]', 'namespace'],
      ['WARN', 'keyword'],
      ['[worker-2]', 'namespace'],
    ])
  })

  it('recognizes the documented log4net date-first layout', () => {
    expect(scoped(LOG4NET)).toStrictEqual([
      ['2024-12-21 14:07:41,517', 'number'],
      ['[main]', 'namespace'],
      ['DEBUG', 'keyword'],
      ['Animals.Carnivora.Dog', 'namespace'],
    ])
  })

  it('recognizes log4net SimpleLayout without requiring a timestamp', () => {
    expect(runs('[warn] - Queue busy')).toStrictEqual([
      ['[warn]', 'keyword'],
      [' - Queue busy', null],
    ])
  })

  it.each([
    '2012-11-02 14:34:02,123',
    '2012-11-02T14:34:02.123456789Z',
    '2012-11-02T14:34:02,781-07',
    '2012-11-02T14:34:02,781-0700',
    '2012-11-02T14:34:02,781-07:00',
    '20121102T143402,781Z',
    '14:34:02,123456',
    '14:34:02.123 UTC',
    '02 Nov 2012 14:34:02,781',
    'Nov  2 14:34:02',
    '2012/11/02',
    '02/11/2012',
    '2012.11.02',
  ])('recognizes timestamp %s independently of severity', (timestamp) => {
    expect(scoped(`${timestamp} [INFO] ready`)).toStrictEqual([
      [timestamp, 'number'],
      ['[INFO]', 'keyword'],
    ])
  })

  it('accepts bracketed timestamps and reordered context, process, and component prefixes', () => {
    expect(scoped('worker[42]: [warn] [2012-11-02T14:34:02.123+01:00] ready')).toStrictEqual([
      ['worker', 'namespace'],
      ['[', 'punctuation.bracket'],
      ['42', 'number'],
      [']', 'punctuation.bracket'],
      [':', 'punctuation.delimiter'],
      ['[warn]', 'keyword'],
      ['2012-11-02T14:34:02.123+01:00', 'number'],
    ])
    expect(scoped('[worker-2] 42 INFO 14:34:02 Cache.Store - ready')).toStrictEqual([
      ['[worker-2]', 'namespace'],
      ['42', 'number'],
      ['INFO', 'keyword'],
      ['14:34:02', 'number'],
      ['Cache.Store', 'namespace'],
    ])
    expect(scoped('cache: info: ready')).toStrictEqual([
      ['cache:', 'namespace'],
      ['info:', 'keyword'],
    ])
    expect(scoped('App.Worker 2012-11-02 [main] INFO ready')).toStrictEqual([
      ['App.Worker', 'namespace'],
      ['2012-11-02', 'number'],
      ['[main]', 'namespace'],
      ['INFO', 'keyword'],
    ])
  })

  it('keeps IP addresses, dotted versions, and colon-separated numbers out of numeric headers', () => {
    expect(scoped('192.168.0.1 - - [21/Dec/2024:14:07:41 +0000] "GET / HTTP/1.1" 200')).toStrictEqual([
      ['"GET / HTTP/1.1"', 'string'],
    ])
    expect(scoped('42 INFO ready')).toStrictEqual([
      ['42', 'number'],
      ['INFO', 'keyword'],
    ])
  })

  it.each([
    '1.2.3 released',
    '2024.12.21.123 released',
    '2024.12.21-rc.1 released',
    '2024.12.21+build.7 released',
    '12:34 messages processed',
    '12:34:56:78 messages processed',
    '12:34:56::1 connected',
    '12:34:56:abcd::1 connected',
    '42ème appel',
    '12:34:56é reported',
  ])('leaves numeric token continuations plain in %s', (code) => {
    expect(scoped(code)).toStrictEqual([])
  })

  it.each([
    'TRACE',
    'DEBUG',
    'VERBOSE',
    'INFO',
    'INFORMATION',
    'NOTICE',
    'WARN',
    'WARNING',
    'ERROR',
    'FATAL',
    'CRITICAL',
    'ALERT',
    'EMERG',
    'EMERGENCY',
  ])('recognizes common casing for delimited %s severity', (level) => {
    for (const label of [level, level.toLowerCase(), level[0] + level.slice(1).toLowerCase()]) {
      expect(scoped(`[ ${label} ] ready`)).toStrictEqual([[`[ ${label} ]`, 'keyword']])
      expect(scoped(`${label}: ready`)).toStrictEqual([[`${label}:`, 'keyword']])
    }
    expect(scoped(`${level} ready`)).toStrictEqual([[level, 'keyword']])
  })

  it.each([
    'There was an ERROR while trying to debug the warning',
    'Error handling is normal prose',
    'error handling is normal prose',
    'debug logging is enabled',
    'No ERROR occurred',
    'No [ERROR] occurred',
    'INFO no ERROR found',
    'INFO ERROR is message text',
    'INFO [ERROR] is message text',
    'INFO error: details',
    'INFO Message contains WARN and [ERROR] with error: details',
    'INFO - ERROR is quoted documentation here',
    'INFO: ERROR is part of the message',
    'WARNED INFORMATIONAL ERROR_CODE debugged',
    'at the end of a normal sentence',
    '    at home (today)',
    'https://example.com/ERROR',
  ])('keeps message prose conservative: %s', (code) => {
    const levels = scoped(code).filter(([, scope]) => scope === 'keyword')
    const header = code.match(/^INFO:?/)?.[0]
    expect(levels).toStrictEqual(header ? [[header, 'keyword']] : [])
  })

  it('distinguishes qualified logger prefixes from ordinary words before severity', () => {
    expect(scoped('App.Worker ERROR failed')).toStrictEqual([
      ['App.Worker', 'namespace'],
      ['ERROR', 'keyword'],
    ])
    expect(scoped('No ERROR occurred')).toStrictEqual([])
    expect(scoped('INFO no ERROR found')).toStrictEqual([['INFO', 'keyword']])
    expect(scoped('INFO [ERROR] is message text')).toStrictEqual([['INFO', 'keyword']])
  })

  it('highlights strings and URLs without inspecting their severity words', () => {
    expect(scoped('INFO read "ERROR \\"quoted\\"" and \'WARN\' from https://example.com/a?b=1&c=2')).toStrictEqual([
      ['INFO', 'keyword'],
      ['"ERROR ', 'string'],
      ['\\"', 'string.escape'],
      ['quoted', 'string'],
      ['\\"', 'string.escape'],
      ['"', 'string'],
      ["'WARN'", 'string'],
      ['https://example.com/a?b=1&c=2', 'link'],
    ])
  })

  it.each(["user's", "café's", "cafe\u0301's"])('keeps the apostrophe in %s as message prose', (word) => {
    expect(scoped(`INFO ${word} request failed`)).toStrictEqual([['INFO', 'keyword']])
  })

  it('recognizes exception types and structured Java and JavaScript stack frames', () => {
    expect(
      scoped(
        'java.lang.IllegalStateException: failed\n\tat example.Service.run(Service.java:42)\nCaused by: TypeError: invalid\n    at read (/srv/worker.js:12:4)',
      ),
    ).toStrictEqual([
      ['java.lang.IllegalStateException', 'type'],
      ['\tat ', 'keyword.control'],
      ['example.Service.run', 'function.call'],
      ['Service.java:42', 'link'],
      ['Caused by:', 'keyword.control'],
      ['TypeError', 'type'],
      ['    at ', 'keyword.control'],
      ['read', 'function.call'],
      ['/srv/worker.js:12:4', 'link'],
    ])
    expect(scoped('    at /srv/worker.js:12:4\n\tat example.Service.run(Native Method)')).toStrictEqual([
      ['    at ', 'keyword.control'],
      ['/srv/worker.js:12:4', 'link'],
      ['\tat ', 'keyword.control'],
      ['example.Service.run', 'function.call'],
      ['Native Method', 'link'],
    ])
  })

  it('distinguishes exception class names from lowercase identifiers in messages', () => {
    expect(scoped('INFO calling onError, handleError, lastError, isError and hooks.onError')).toStrictEqual([
      ['INFO', 'keyword'],
    ])
    expect(scoped('INFO Error: failed\nException: failed\nCaused by: java.io.IOException: missing file')).toStrictEqual(
      [
        ['INFO', 'keyword'],
        ['Error', 'type'],
        ['Exception', 'type'],
        ['Caused by:', 'keyword.control'],
        ['java.io.IOException', 'type'],
      ],
    )
  })

  it('highlights only complete qualified exception names', () => {
    expect(
      scoped(
        'INFO: ExpectedError$Factory, TypeError.com, caféCustomError, caféException and TypeErroré are names. Retry after java.io.IOException.',
      ),
    ).toStrictEqual([
      ['INFO:', 'keyword'],
      ['java.io.IOException', 'type'],
    ])
  })

  it.each(['\u2028', '\u2029'])('starts a new entry after a truncated stack frame separated by %j', (separator) => {
    expect(
      scoped(`    at example.Service.run(${separator}INFO listening on Server.java:42)${separator}WARN recovered`),
    ).toStrictEqual([
      ['INFO', 'keyword'],
      ['WARN', 'keyword'],
    ])
  })

  it.each(['\n', '\r\n', '\r', '\u2028', '\u2029'])(
    'recognizes fields immediately before the line ending %j',
    (newline) => {
      expect(
        scoped(
          [
            'INFO',
            'warning:',
            'service:',
            'service -',
            'App.Worker WARN',
            '    at /srv/worker.js:12:4',
            'WARN ready',
          ].join(newline),
        ),
      ).toStrictEqual([
        ['INFO', 'keyword'],
        ['warning:', 'keyword'],
        ['service:', 'namespace'],
        ['service', 'namespace'],
        ['App.Worker', 'namespace'],
        ['WARN', 'keyword'],
        ['    at ', 'keyword.control'],
        ['/srv/worker.js:12:4', 'link'],
        ['WARN', 'keyword'],
      ])
    },
  )

  it('resets truncated strings and message state at every kind of line ending', () => {
    for (const newline of ['\n', '\r\n', '\r', '\u2028', '\u2029']) {
      expect(scoped(`INFO message "unfinished${newline}[warn] ready${newline}ERROR recovered`)).toStrictEqual([
        ['INFO', 'keyword'],
        ['"unfinished', 'string'],
        ['[warn]', 'keyword'],
        ['ERROR', 'keyword'],
      ])
    }
  })

  it('preserves every source range, multiline text, whitespace, and Unicode', () => {
    const tokens = tokenize(MULTILINE, log)
    expect(tokens.map((token) => token.text).join('')).toBe(MULTILINE)
    expect(tokens.map((token) => token.start)).toStrictEqual([0, ...tokens.slice(0, -1).map((token) => token.end)])
    expect(tokens.at(-1)?.end).toBe(MULTILINE.length)
    for (const token of tokens) {
      expect(MULTILINE.slice(token.start, token.end)).toBe(token.text)
      if (token.scope !== null) {
        expect(Object.hasOwn(SCOPES, token.scope)).toBe(true)
      }
    }
    registerLanguage(log)
    expect(textFromHtml(highlight(MULTILINE, log))).toBe(MULTILINE)
    expect(textFromHtml(syntaxHighlight(MULTILINE, { lang: 'log' }))).toBe(MULTILINE)
    expect(hastText(toHast(MULTILINE, 'log') ?? [])).toBe(MULTILINE)
  })

  it('preserves empty input and every truncation of a mixed log', () => {
    for (let end = 0; end <= MULTILINE.length; end++) {
      const code = MULTILINE.slice(0, end)
      expect(
        tokenize(code, log)
          .map((token) => token.text)
          .join(''),
      ).toBe(code)
    }
  })

  it('escapes HTML in both native and compatibility renderers', () => {
    const code = '[INFO] <script>alert("🦊 & <tag>")</script> &lt; <img src=x onerror=alert(1)>'
    registerLanguage(log)
    for (const html of [highlight(code, log), syntaxHighlight(code, { lang: 'log' })]) {
      expect(textFromHtml(html)).toBe(code)
      expect(html.includes('<script>')).toBe(false)
      expect(html.includes('<img')).toBe(false)
      expect(html.includes('&lt;script&gt;')).toBe(true)
      expect(html.includes('&amp;lt;')).toBe(true)
    }
  })

  it('does not parse JSON fields or interpret ANSI controls', () => {
    expect(scoped('{"level":"ERROR","count":42}').filter(([, scope]) => scope !== 'string')).toStrictEqual([])
    expect(
      tokenize('\u001b[31mERROR\u001b[0m', log)
        .map((token) => token.text)
        .join(''),
    ).toBe('\u001b[31mERROR\u001b[0m')
  })

  it('handles long prose, malformed prefixes, dotted names, and escaped quotes', () => {
    for (const code of [
      `INFO message ${'x'.repeat(200_000)}`,
      '['.repeat(200_000),
      `message ${'a.'.repeat(100_000)}`,
      'a.'.repeat(100_000),
      `message "${'\\"'.repeat(100_000)}`,
      `${' '.repeat(200_000)}at the end`,
    ]) {
      const started = performance.now()
      expect(
        tokenize(code, log)
          .map((token) => token.text)
          .join(''),
      ).toBe(code)
      // A generous guard against quadratic rescanning, not a throughput benchmark.
      expect(performance.now() - started).toBeLessThan(1_000)
    }
  })
})

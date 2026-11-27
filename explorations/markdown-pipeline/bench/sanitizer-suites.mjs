/**
 * Collects the attack vectors of other sanitizers' and XSS projects' test
 * suites into `.out/sanitizer-vectors.json`, as `[vector, source]` pairs.
 *
 *   node bench/sanitizer-suites.mjs
 *
 * Every file is downloaded as text and parsed as data. Nothing downloaded is
 * imported or evaluated: suites written as JavaScript or Python have their
 * string literals extracted with a tokenizer for that language's literals.
 */
import { writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const RAW = 'https://raw.githubusercontent.com/'

const get = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  return res.text()
}

/** The files of a GitHub repository at a ref, from jsDelivr's listing. */
const list = async (repo, ref) => {
  const res = await fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@${ref}?structure=flat`)
  if (!res.ok) throw new Error(`${repo}: ${res.status}`)
  return (await res.json()).files.map((f) => f.name)
}

/** Unescapes a JavaScript or Python string literal body (the common escapes only). */
const unescape = (body) =>
  body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[0-7]{1,3}|\r?\n|.)/g, (_, e) => {
    if (e[0] === 'u') return String.fromCodePoint(Number.parseInt(e.replace(/[u{}]/g, ''), 16))
    if (e[0] === 'x') return String.fromCharCode(Number.parseInt(e.slice(1), 16))
    if (/^[0-7]+$/.test(e)) return e === '0' ? '\0' : String.fromCharCode(Number.parseInt(e, 8))
    if (e === '\n' || e === '\r\n') return ''
    return { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v' }[e] ?? e
  })

/** Every quoted string literal in JavaScript or Python source, in order. Template literals count when they hold no `${`. */
const literals = (source) => {
  const out = []
  const re = /'((?:\\[\s\S]|[^'\\\n])*)'|"((?:\\[\s\S]|[^"\\\n])*)"|`((?:\\[\s\S]|[^`\\])*)`/g
  for (const m of source.matchAll(re)) {
    if (m[3] !== undefined && m[3].includes('${')) continue
    out.push(unescape(m[1] ?? m[2] ?? m[3]))
  }
  return out
}

/** The bodies of fenced code blocks in a Markdown file. */
const fences = (markdown) =>
  [...markdown.matchAll(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n[ \t]*\2[ \t]*$/gm)].map((m) =>
    // Cheat sheets nest fences in list items: strip the fence's own indentation from every line.
    m[3].replace(new RegExp(`^${m[1]}`, 'gm'), ''),
  )

/** A block and each of its non-empty lines, since cheat sheets mix one-vector-per-line and multi-line vectors. */
const blockAndLines = (block) => [block, ...block.split('\n').filter((l) => l.trim())]

const looksLikeAttack = (s) => /[<>]|javascript|vbscript|data:|on\w+\s*=|&#|\\u00|expression\(/i.test(s)

const vectors = new Map()
const add = (source, list) => {
  let n = 0
  for (const v of list) {
    if (typeof v !== 'string' || !v.trim() || v.length > 20_000) continue
    if (!vectors.has(v)) {
      vectors.set(v, source)
      n++
    }
  }
  console.log(`${source.padEnd(40)} ${String(n).padStart(6)} new vectors`)
}

const suites = {
  /** DOMPurify's own regression fixtures: every payload it is tested against. */
  async dompurify() {
    const text = await get(`${RAW}cure53/DOMPurify/main/test/fixtures/expect.mjs`)
    const payloads = [...text.matchAll(/"payload"\s*:\s*("(?:\\[\s\S]|[^"\\])*")/g)].map((m) => JSON.parse(m[1]))
    add('DOMPurify fixtures', payloads)
  },

  /** Cure53's HTML5 Security Cheatsheet, with its payload placeholders filled in. */
  async h5sc() {
    const items = await get(`${RAW}cure53/H5SC/master/items.js`)
    const payloads = await get(`${RAW}cure53/H5SC/master/payloads.js`)
    const fill = Object.fromEntries(
      [...payloads.matchAll(/'(\w+)'\s*:\s*'((?:\\[\s\S]|[^'\\])*)'/g)].map((m) => [m[1], unescape(m[2])]),
    )
    const data = [...items.matchAll(/'data'\s*:\s*'((?:\\[\s\S]|[^'\\])*)'/g)].map((m) =>
      unescape(m[1]).replace(/%(\w+)%/g, (all, k) => fill[k] ?? all),
    )
    add('HTML5 Security Cheatsheet (H5SC)', data)
  },

  async owasp() {
    const md = await get(`${RAW}OWASP/CheatSheetSeries/master/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.md`)
    add('OWASP XSS Filter Evasion', fences(md).flatMap(blockAndLines).filter(looksLikeAttack))
  },

  /** Every `code` sample in PortSwigger's XSS cheat sheet. */
  async portswigger() {
    const files = (await list('PortSwigger/xss-cheatsheet-data', 'master')).filter((f) => /^\/json\/.*\.json$/.test(f))
    const codes = []
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk)
      if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) {
          if (k === 'code' && typeof x === 'string') codes.push(x)
          else walk(x)
        }
      }
    }
    for (const f of files) walk(JSON.parse(await get(`${RAW}PortSwigger/xss-cheatsheet-data/master${f}`)))
    add('PortSwigger XSS cheat sheet', codes)
  },

  async payloadsAllTheThings() {
    const files = (await list('swisskyrepo/PayloadsAllTheThings', 'master')).filter((f) =>
      /^\/XSS Injection\/(Intruders\/.*\.txt|[^/]*\.md)$/.test(f),
    )
    const base = `${RAW}swisskyrepo/PayloadsAllTheThings/master`
    for (const f of files) {
      const text = await get(base + f.split('/').map(encodeURIComponent).join('/'))
      const found = f.endsWith('.md') ? fences(text).flatMap(blockAndLines) : text.split('\n')
      add(`PayloadsAllTheThings ${f.split('/').at(-1)}`.slice(0, 40), found.filter(looksLikeAttack))
    }
  },

  async markdownXss() {
    const text = await get(`${RAW}cujanovic/Markdown-XSS-Payloads/master/Markdown-XSS-Payloads.txt`)
    add('Markdown-XSS-Payloads', text.split('\n'))
  },

  /** The inputs of sanitize-html's tests: string literals that look like markup or URLs. */
  async sanitizeHtml() {
    const text = await get(`${RAW}apostrophecms/sanitize-html/main/test/test.js`)
    add('sanitize-html tests', literals(text).filter(looksLikeAttack))
  },

  async bleach() {
    const text = await get(`${RAW}mozilla/bleach/main/tests/test_clean.py`)
    add('bleach tests', literals(text).filter(looksLikeAttack))
  },

  async hastUtilSanitize() {
    const input = await get(`${RAW}syntax-tree/hast-util-sanitize/main/test/input.html`)
    const tests = await get(`${RAW}syntax-tree/hast-util-sanitize/main/test/index.js`)
    add('hast-util-sanitize tests', [...blockAndLines(input), ...literals(tests).filter(looksLikeAttack)])
  },

  /**
   * html5lib's tree-construction tests: documents whose parse is surprising
   * (misnesting, foreign content, raw text, adoption agency). These are what
   * mutation XSS is built from.
   */
  async html5lib() {
    // `HTML5LIB_TESTS` points at a local `tree-construction` folder, such as the one in the
    // `html5lib` source distribution on PyPI, for when GitHub's raw files are not reachable.
    const local = process.env.HTML5LIB_TESTS
    const texts = []
    if (local) {
      const { readdirSync, readFileSync } = await import('node:fs')
      for (const f of readdirSync(local).filter((f) => f.endsWith('.dat')))
        texts.push(readFileSync(`${local}/${f}`, 'utf8'))
    } else {
      const files = (await list('html5lib/html5lib-tests', 'master')).filter((f) =>
        /^\/tree-construction\/.*\.dat$/.test(f),
      )
      for (const f of files) texts.push(await get(`${RAW}html5lib/html5lib-tests/master${f}`))
    }
    const docs = []
    for (const text of texts) {
      for (const m of text.matchAll(/^#data\n([\s\S]*?)\n#(?:errors|document)/gm)) docs.push(m[1])
    }
    add('html5lib tree-construction', docs)
  },
}

for (const [name, run] of Object.entries(suites)) {
  try {
    await run()
  } catch (error) {
    console.log(`${name}: FAILED ${error.message}`)
  }
}
writeFileSync(`${OUT}sanitizer-vectors.json`, JSON.stringify([...vectors]))
console.log(`total: ${vectors.size} unique vectors`)

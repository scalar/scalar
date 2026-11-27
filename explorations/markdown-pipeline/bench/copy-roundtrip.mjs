/**
 * Round-trip property fuzz for the Copy as Markdown serializer: for random mdast trees, and for
 * the trees random Markdown parses to, `parse(serialize(tree))` must give the tree back, with the
 * pipeline's parser and with remark. Text full of Markdown punctuation, `<`, `&`, backticks, pipes
 * in table cells and URLs with parentheses or spaces must never come back as markup.
 *
 *   node bench/copy-roundtrip.mjs [trees] [markdown corpus.json] [limit] [label]
 *
 * Every failure is checked against the upstream serializer (mdast-util-to-markdown 2.1.2 with
 * mdast-util-gfm): the port must produce the same bytes, so a failure it shares is upstream's.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown as toMarkdownLatest } from 'mdast-util-to-markdown-latest'

import { explainSerializer, joinFix } from './copy-explain.mjs'
import { OUT } from './paths.mjs'

const [count = '100000', corpusPath, limit = '20000', label = 'roundtrip'] = process.argv.slice(2)
const old = await import(`${OUT}copy-old.mjs`)
const neu = await import(`${OUT}copy-new.mjs`)

const join = [
  (left, right, parent) => {
    if (!('spread' in parent)) return undefined
    if (left.type === 'list' && right.type !== 'list') return 1
    if (left.type === 'code' || right.type === 'code') return 1
    return undefined
  },
]
const serialize = neu.createMarkdownSerializer({ bullet: '-', join })
const upstream = (tree) => toMarkdownLatest(tree, { bullet: '-', join, extensions: [gfmToMarkdown()] })
const upstreamFixed = (tree) =>
  toMarkdownLatest(
    { ...tree, children: explainSerializer(tree.children) },
    { bullet: '-', join: [joinFix, ...join], extensions: [gfmToMarkdown()] },
  )

// Deterministic PRNG (mulberry32), so failures reproduce.
let seed = 0x5ca1a
const random = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (n) => Math.floor(random() * n)
const pick = (list) => list[int(list.length)]
const chance = (p) => random() < p

/** Pieces of text that are Markdown syntax somewhere, plus plain words and a little Unicode. */
const PIECES = [
  ...'abcxyz ABC 0123 '.split(''),
  ...'*_[]()<>&!#`|~\\:@.-+=^"\'{}$%/;?,'.split(''),
  'word',
  'two words',
  '  ',
  '\t',
  '\n',
  '\n\n',
  ' ',
  'é',
  '🙂',
  '&amp;',
  '&lt;b&gt;',
  '&#x27;',
  '&copy',
  '<b>',
  '</div>',
  '<script>alert(1)</script>',
  '<!-- c -->',
  '<a href="javascript:alert(1)">x</a>',
  '<img src=x onerror=alert(1)>',
  '[x](javascript:alert(1))',
  '[a][b]',
  '[^1]',
  '![i](u)',
  '<http://a.b>',
  'http://example.com/a_(b)',
  'https://x.y/z?q=1&r=2',
  'www.example.com',
  'user@example.com',
  'mailto:a@b.c',
  '**bold**',
  '*em*',
  '_u_',
  '~~del~~',
  '`code`',
  '``',
  '# h',
  '> q',
  '- li',
  '1. li',
  '1) li',
  '---',
  '***',
  '===',
  '| a | b |',
  '|-|-|',
  ':-',
  '[ ] task',
  '[x]',
  '    indented',
  '```',
  '~~~',
  '\\*',
  '\\',
]
const textValue = (min = 1) => {
  let s = ''
  const n = min + int(5)
  for (let i = 0; i < n; i++) s += pick(PIECES)
  return s
}
/** Phrasing text: a blank line cannot be written inside a paragraph, so there is none in parsed text either. */
const inlineText = () =>
  textValue()
    .replace(/\n[ \t]*(?=\n)/g, '')
    .replace(/\n+/g, '\n')

const URLS = [
  'http://example.com',
  'https://example.com/a b',
  'https://example.com/a(b)c',
  'https://example.com/a)b',
  'https://example.com/<x>',
  'https://example.com/"q"',
  '/relative/path',
  '#anchor',
  'mailto:user@example.com',
  'a\\b',
  'é/ü',
  '',
  'http://a.b/c?d=e&f=g',
  'x y)z',
  '<p>x</p>',
  '<',
  '<>',
  'javascript:alert(1)',
]

const phrasing = (depth, { inLink = false, breaks = true } = {}) => {
  const out = []
  const n = 1 + int(4)
  for (let i = 0; i < n; i++) {
    const r = random()
    if (r < 0.45 || depth > 2) out.push({ type: 'text', value: inlineText() })
    else if (r < 0.55) out.push({ type: 'emphasis', children: phrasing(depth + 1, { inLink, breaks }) })
    else if (r < 0.65) out.push({ type: 'strong', children: phrasing(depth + 1, { inLink, breaks }) })
    else if (r < 0.7) out.push({ type: 'delete', children: phrasing(depth + 1, { inLink, breaks }) })
    else if (r < 0.8) out.push({ type: 'inlineCode', value: textValue().replace(/[\r\n]/g, ' ') })
    else if (r < 0.92 && !inLink) {
      out.push({
        type: 'link',
        url: pick(URLS),
        // A title can hold blank lines (from an HTML `title`), which a raw one would end the paragraph at.
        title: chance(0.3) ? textValue() : null,
        children: chance(0.1) ? [] : phrasing(depth + 1, { inLink: true, breaks }),
      })
    } else if (breaks && i > 0 && i < n - 1) out.push({ type: 'break' })
    else out.push({ type: 'text', value: inlineText() })
    // Two code spans in a row are one span to every parser, and no parser makes that tree.
    if (out.at(-1).type === 'inlineCode' && out.at(-2)?.type === 'inlineCode')
      out.splice(-1, 0, { type: 'text', value: 'x' })
  }
  return canonical(out)
}

/** Adjacent text merged, and no empty text, as any parser gives it. */
const canonical = (nodes) => {
  const out = []
  for (const node of nodes) {
    if (node.type === 'text') {
      if (!node.value) continue
      const last = out.at(-1)
      if (last?.type === 'text') {
        last.value += node.value
        continue
      }
    }
    out.push(node)
  }
  return out
}

const flow = (depth, footnotes) => {
  const out = []
  const n = 1 + int(depth ? 3 : 5)
  for (let i = 0; i < n; i++) {
    const r = random()
    if (r < 0.35 || depth > 2) out.push({ type: 'paragraph', children: phrasing(0) })
    else if (r < 0.45) {
      out.push({ type: 'heading', depth: 1 + int(6), children: phrasing(1, { breaks: false }) })
    } else if (r < 0.55) {
      const ordered = chance(0.4)
      const spread = chance(0.3)
      out.push({
        type: 'list',
        ordered,
        start: ordered ? int(12) : null,
        spread,
        children: Array.from({ length: 1 + int(3) }, () => {
          const children = flow(depth + 1, footnotes)
          return {
            type: 'listItem',
            spread,
            checked: children[0]?.type === 'paragraph' && chance(0.3) ? chance(0.5) : null,
            children,
          }
        }),
      })
    } else if (r < 0.62) out.push({ type: 'blockquote', children: flow(depth + 1, footnotes) })
    else if (r < 0.7) {
      out.push({
        type: 'code',
        lang: chance(0.5) ? pick(['js', 'json', 'a`b', 'x y', 'c~', '']) || null : null,
        meta: null,
        value: textValue(),
      })
    } else if (r < 0.74) out.push({ type: 'thematicBreak' })
    else if (r < 0.84) {
      const width = 1 + int(3)
      out.push({
        type: 'table',
        align: Array.from({ length: width }, () => pick([null, 'left', 'right', 'center'])),
        children: Array.from({ length: 1 + int(3) }, () => ({
          type: 'tableRow',
          children: Array.from({ length: width }, () => ({
            type: 'tableCell',
            children: phrasing(1, { breaks: false }),
          })),
        })),
      })
    } else if (r < 0.9 && depth === 0) {
      const id = `n${footnotes.length + 1}`
      footnotes.push(id)
      out.push({
        type: 'paragraph',
        children: canonical([
          { type: 'text', value: inlineText() },
          { type: 'footnoteReference', identifier: id, label: id },
        ]),
      })
    } else out.push({ type: 'html', value: `<a id="scalar-${int(100)}"></a>` })
  }
  return out
}

const randomTree = () => {
  const footnotes = []
  const children = flow(0, footnotes)
  for (const id of footnotes) {
    children.push({ type: 'footnoteDefinition', identifier: id, label: id, children: flow(1, []) })
  }
  return { type: 'root', children }
}

/**
 * What the comparison ignores, because Markdown cannot express it or mdast leaves it open:
 * `spread`, how text is split, and the position of a footnote definition.
 */
const comparable = (node) => {
  const out = {}
  for (const [k, v] of Object.entries(node)) {
    if (k === 'position' || k === 'spread' || v === undefined) continue
    if (k === 'children') out[k] = canonical(v.map((c) => ({ ...c }))).map(comparable)
    else out[k] = v
  }
  if (node.type === 'footnoteReference' || node.type === 'footnoteDefinition')
    out.identifier = out.identifier.toLowerCase()
  if (node.type === 'table') {
    const width = node.children[0]?.children.length ?? 0
    out.children = out.children.map((row) => ({
      ...row,
      children: [
        ...row.children,
        ...Array(Math.max(0, width - row.children.length)).fill({ type: 'tableCell', children: [] }),
      ],
    }))
  }
  return out
}

/** Markup, and where its URLs point: text that turns into any of these is an injection. */
const MARKUP = new Set([
  'html',
  'link',
  'image',
  'linkReference',
  'imageReference',
  'definition',
  'inlineCode',
  'code',
  'footnoteReference',
])
/**
 * A link that a GFM autolink literal makes from text: its text is its URL. remark and the pipeline
 * find these in decoded text, so no escape stops them (`www\\.example.com` is a link to both),
 * and the old serializer wrote the same bytes. The text stays visible and the URL is that text.
 */
const isLiteral = (node) => {
  if (node.type !== 'link' || node.children.length !== 1 || node.children[0].type !== 'text') return false
  const text = node.children[0].value
  return node.url === text || node.url === `http://${text}` || node.url === `mailto:${text}`
}
const markup = (node, out = [], literals = false) => {
  if (MARKUP.has(node.type) && !(literals && isLiteral(node))) {
    // An HTML block and the same HTML inline in a paragraph are the same markup.
    if (node.type === 'html' && out.at(-1)?.startsWith('html:')) out[out.length - 1] += node.value
    else out.push(`${node.type}:${node.url ?? node.value ?? node.identifier ?? ''}`)
  }
  for (const c of (literals && isLiteral(node) ? [] : node.children) ?? []) markup(c, out, literals)
  return out
}
/**
 * What the round trip gained that the tree did not have: raw HTML that is not the tree's own, or a
 * link (other than an autolink literal) to a URL the tree has no link to.
 */
const injection = (tree, back) => {
  const html = (n, out = []) => {
    if (n.type === 'html') out.push(n.value)
    for (const c of n.children ?? []) html(c, out)
    return out
  }
  const urls = (n, out = new Set()) => {
    if ((n.type === 'link' || n.type === 'image') && !isLiteral(n)) out.add(`${n.type}:${n.url}`)
    for (const c of n.children ?? []) urls(c, out)
    return out
  }
  const own = html(tree).join('')
  if (html(back).some((value) => !own.includes(value))) return 'raw HTML'
  const before = urls(tree)
  if ([...urls(back)].some((url) => !before.has(url))) return 'link or image'
  return undefined
}
const textOf = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join(''))

const results = {
  trees: { total: 0, sameAsUpstream: 0, sameAsUpstreamWithFixes: 0, ours: 0, remark: 0, injection: 0 },
  markdown: { total: 0, sameAsUpstream: 0, sameAsUpstreamWithFixes: 0, ours: 0, remark: 0, injection: 0, skipped: 0 },
}
const failures = { trees: {}, markdown: {} }
const note = (kind, cls, sample) => {
  const list = (failures[kind][cls] ??= { count: 0, samples: [] })
  list.count++
  if (list.samples.length < 10) list.samples.push(sample)
}

/** What the serializer writes differently on purpose: a link title with line endings, a URL starting with `<`, blank lines in text. */
const hasIntendedDifference = (node) =>
  (node.type === 'link' && (/[\r\n]/.test(node.title ?? '') || node.url.startsWith('<'))) ||
  // A line ending at the start of text can follow another (the paragraph's start, a hard break).
  (node.type === 'text' && /^(?:\r\n|\r|\n)|(?:\r\n|\r|\n)(?:\r\n|\r|\n)/.test(node.value)) ||
  (node.children ?? []).some(hasIntendedDifference)

const check = (kind, tree) => {
  const r = results[kind]
  r.total++
  const markdown = serialize(tree)
  if (markdown === upstream(tree)) r.sameAsUpstream++
  else if (markdown === upstreamFixed(tree)) r.sameAsUpstreamWithFixes++
  else if (hasIntendedDifference(tree)) r.sameAsUpstreamWithFixes++
  else note(kind, 'PORT DIFFERS FROM UPSTREAM', { tree, markdown, upstream: upstream(tree) })
  const expected = JSON.stringify(comparable(tree))
  for (const [name, parse] of [
    ['ours', neu.parseMarkdown],
    ['remark', old.parseMarkdown],
  ]) {
    const back = parse(markdown)
    if (JSON.stringify(comparable(back)) === expected) {
      r[name]++
      continue
    }
    // Text may lose structure (emphasis that cannot close, say), but must never gain markup.
    const changed = markup(back, [], true).join('\n') !== markup(tree, [], true).join('\n')
    const literal = !changed && markup(back).join('\n') !== markup(tree).join('\n')
    const injected = changed ? injection(tree, back) : undefined
    if (injected && name === 'ours') r.injection++
    const cls = `${name}: ${
      injected
        ? `INJECTED ${injected}`
        : changed
          ? 'markup lost or moved (none gained)'
          : literal
            ? 'text with a literal URL or email became an autolink'
            : textOf(back) === textOf(tree)
              ? 'same text, different structure'
              : 'text changed'
    }`
    note(kind, cls, { markdown, tree: injected ? tree : JSON.stringify(tree).slice(0, 3000) })
  }
}

for (let i = 0; i < Number(count); i++) check('trees', randomTree())

// Random Markdown, through the OpenAPI package's description path (which removes images and
// converts raw HTML), so the trees are the ones the serializer really gets.
if (corpusPath) {
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8')).slice(0, Number(limit))
  const parser = neu.createDescriptionParser()
  for (const entry of corpus) {
    const value = Array.isArray(entry) ? entry[0] : entry
    if (typeof value !== 'string' || !value.trim()) continue
    const children = await parser()(value)
    if (!children.length) {
      results.markdown.skipped++
      continue
    }
    check('markdown', { type: 'root', children })
  }
}

console.log(JSON.stringify(results, null, 2))
for (const kind of ['trees', 'markdown']) {
  console.log(kind, Object.fromEntries(Object.entries(failures[kind]).map(([k, v]) => [k, v.count])))
}
writeFileSync(`${OUT}copy-${label}.json`, JSON.stringify({ results, failures }, null, 1))

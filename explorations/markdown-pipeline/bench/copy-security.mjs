/**
 * Adversarial pass for Copy as Markdown. Every vector from `bench/sanitizer-suites.mjs` goes into
 * each place a description can hold it (the contexts of `bench/sanitizer-run.mjs`), through the
 * OpenAPI package's description path, and is serialized. The Markdown is then checked three ways:
 *
 * 1. Rendered with `htmlFromMarkdown`, it passes the policy check from `bench/security.mjs`.
 * 2. Rendered with the sanitizer off (`unsafe`), as a renderer that trusts its input would, it
 *    passes the same check: the Markdown itself holds no raw HTML and no unsafe URL.
 * 3. Parsed with the pipeline and with remark, it has no `html` or image nodes, and every link
 *    passes the URL policy (`safeUrl` in packages/openapi-to-markdown/src/markdown-nodes.ts).
 *
 * The fidelity errors of `problems()` (`restructured`, `reparse not stable`, `unbalanced`,
 * `unclosed`) are about how the HTML nests, not what it can do, and are ignored.
 *
 *   node bench/copy-security.mjs [vectors.json]
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'
import { problems } from './security.mjs'

const [vectorsPath = `${OUT}sanitizer-vectors.json`] = process.argv.slice(2)
const vectors = JSON.parse(readFileSync(vectorsPath, 'utf8'))
const sides = { old: await import(`${OUT}copy-old.mjs`), new: await import(`${OUT}copy-new.mjs`) }

const CONTEXTS = {
  raw: (v) => v,
  inline: (v) => `x ${v} y`,
  'list item': (v) => `- ${v}`,
  'table cell': (v) => `| a |\n| - |\n| ${v.replace(/\n/g, ' ')} |`,
  alert: (v) => `> [!NOTE]\n> ${v.replace(/\n/g, '\n> ')}`,
  'link destination': (v) => `[x](${v})`,
  'link destination <>': (v) => `[x](<${v}>)`,
  'image destination': (v) => `![x](${v})`,
  autolink: (v) => `<${v}>`,
  reference: (v) => `[x]\n\n[x]: ${v}`,
  footnote: (v) => `x[^1]\n\n[^1]: ${v}`,
  'inside raw <p>': (v) => `<p>*a* ${v}</p>`,
  'inside <details>': (v) => `<details><summary>x</summary>\n\n${v}\n\n</details>`,
  'after an open <div>': (v) => `<div>\n\n${v}`,
  'fence info string': (v) => `\`\`\`${v.replace(/\n/g, ' ')}\nx\n\`\`\``,
  'raw code block': (v) => `<pre><code class="language-html">${v}</code></pre>`,
  // Blocks where only inline content can go: written as blocks, they break out of the cell or
  // heading, and the code's escaped text comes back as Markdown and raw HTML.
  'code block in a table cell': (v) => `<table><tr><td><pre><code>${escapeHtml(v)}</code></pre></td></tr></table>`,
  'code block in emphasis': (v) => `<em><pre>${escapeHtml(v)}</pre></em>`,
  'code block after text in a paragraph': (v) => `<summary>a<pre>${escapeHtml(v)}</pre></summary>`,
  'code block in a heading': (v) => `<h3><pre>${escapeHtml(v)}</pre></h3>`,
  'blocks in a table cell': (v) =>
    `<table><tr><td><p>a</p><blockquote>${v}</blockquote><ul><li>${v}</li></ul></td></tr></table>`,
}
/** A vector as text: what `<pre>` holds when an author shows HTML as code. */
const escapeHtml = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const FIDELITY = /^(restructured|reparse not stable|unbalanced|unclosed)/
const REMOVED = ['img', 'picture']

/** `safeUrl` from markdown-nodes.ts: a scheme other than these is removed. */
const urlAllowed = (url) => {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: as in safeUrl
  const normalized = url.replace(/[\u0000- \u007f-\u009f]/g, '')
  const protocol = /^([^/?#]*):/.exec(normalized)?.[1]
  return !protocol || ['http', 'https', 'irc', 'ircs', 'mailto', 'xmpp'].includes(protocol.toLowerCase())
}
const treeProblems = (node, out = []) => {
  if (node.type === 'html') out.push(`html node ${JSON.stringify(node.value).slice(0, 80)}`)
  if (node.type === 'image' || node.type === 'imageReference') out.push('image node')
  if ((node.type === 'link' || node.type === 'definition') && !urlAllowed(node.url))
    out.push(`unsafe url ${JSON.stringify(node.url).slice(0, 80)}`)
  for (const c of node.children ?? []) treeProblems(c, out)
  return out
}

const join = [
  (left, right, parent) => {
    if (!('spread' in parent)) return undefined
    if (left.type === 'list' && right.type !== 'list') return 1
    if (left.type === 'code' || right.type === 'code') return 1
    return undefined
  },
]
const results = {}
const hits = []
const started = Date.now()
for (const [name, side] of Object.entries(sides)) {
  const serialize = side.createMarkdownSerializer({ bullet: '-', join })
  const parser = side.createDescriptionParser()
  const r = (results[name] = {
    descriptions: 0,
    distinct: 0,
    sanitized: 0,
    unsanitized: 0,
    ourTree: 0,
    remarkTree: 0,
    threw: 0,
  })
  const seen = new Set()
  for (const [vector, source] of vectors) {
    for (const [context, wrap] of Object.entries(CONTEXTS)) {
      r.descriptions++
      let markdown
      try {
        markdown = serialize({ type: 'root', children: await parser()(wrap(vector)) })
      } catch (error) {
        r.threw++
        hits.push({ side: name, source, context, vector, error: String(error) })
        continue
      }
      if (seen.has(markdown)) continue
      seen.add(markdown)
      r.distinct++
      const found = {
        sanitized: problems(sides.new.htmlFromMarkdown(markdown, { removeTags: REMOVED }), REMOVED).filter(
          (e) => !FIDELITY.test(e),
        ),
        unsanitized: problems(sides.new.htmlFromMarkdown(markdown, { unsafe: true }), REMOVED).filter(
          (e) => !FIDELITY.test(e),
        ),
        ourTree: treeProblems(sides.new.parseMarkdown(markdown)),
        remarkTree: treeProblems(sides.old.parseMarkdown(markdown)),
      }
      for (const [check, errors] of Object.entries(found)) {
        if (!errors.length) continue
        r[check]++
        if (hits.length < 2000)
          hits.push({ side: name, check, source, context, vector, markdown, errors: [...new Set(errors)] })
      }
    }
  }
}
results.seconds = Math.round((Date.now() - started) / 1000)
console.log(JSON.stringify(results, null, 2))
for (const name of Object.keys(sides)) {
  const mine = hits.filter((h) => h.side === name)
  if (mine.length) console.log(name, 'first hit:', JSON.stringify(mine[0], null, 2))
}
writeFileSync(`${OUT}copy-security.json`, JSON.stringify({ results, hits }, null, 1))

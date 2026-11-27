/**
 * Collects the test fixtures of other Markdown implementations: every example
 * they test, as input for comparing the two pipelines. Files are listed with
 * jsDelivr's API and fetched raw from GitHub; nothing downloaded is executed.
 */
import { writeFileSync } from 'node:fs'

import { OUT } from './paths.mjs'

const REPOS = [
  { repo: 'markdown-it/markdown-it', ref: 'master', match: /^\/test\/fixtures\/.*\.txt$/, format: 'markdown-it' },
  { repo: 'markedjs/marked', ref: 'master', match: /^\/test\/specs\/(new|original|redos)\/.*\.md$/, format: 'file' },
  {
    repo: 'markedjs/marked',
    ref: 'master',
    match: /^\/test\/specs\/(commonmark|gfm)\/.*\.json$/,
    format: 'marked-json',
  },
  { repo: 'commonmark/cmark', ref: 'master', match: /^\/test\/(regression|smart_punct)\.txt$/, format: 'spec' },
  { repo: 'github/cmark-gfm', ref: 'master', match: /^\/test\/(extensions.*|regression)\.txt$/, format: 'spec' },
  { repo: 'commonmark/commonmark.js', ref: 'master', match: /^\/test\/(regression|smart_punct)\.txt$/, format: 'spec' },
  { repo: 'remarkjs/remark-gfm', ref: 'main', match: /^\/test\/.*\.md$/, format: 'file' },
  { repo: 'syntax-tree/mdast-util-from-markdown', ref: 'main', match: /^\/test\/.*\.md$/, format: 'file' },
  { repo: 'syntax-tree/mdast-util-to-hast', ref: 'main', match: /^\/test\/.*\.md$/, format: 'file' },
]

const parseSpec = (text) => {
  const out = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!/^`{32} example/.test(lines[i])) continue
    let md = ''
    let j = i + 1
    while (j < lines.length && lines[j] !== '.') md += lines[j++] + '\n'
    out.push(md.replace(/→/g, '\t'))
    while (j < lines.length && !lines[j].startsWith('`'.repeat(32))) j++
    i = j
  }
  return out
}

/** markdown-it: a description, then `.`, Markdown, `.`, HTML, `.`. */
const parseMarkdownIt = (text) => {
  const out = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== '.') continue
    let md = ''
    let j = i + 1
    while (j < lines.length && lines[j] !== '.') md += lines[j++] + '\n'
    out.push(md.replace(/→/g, '\t'))
    j++
    while (j < lines.length && lines[j] !== '.') j++
    i = j
  }
  return out
}

const items = []
for (const { repo, ref, match, format } of REPOS) {
  const listing = await (await fetch(`https://data.jsdelivr.com/v1/packages/gh/${repo}@${ref}?structure=flat`)).json()
  const files = listing.files.map((f) => f.name).filter((n) => match.test(n))
  let count = 0
  for (const name of files) {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}${name}`)
    if (!res.ok) continue
    const text = await res.text()
    const source = `${repo}${name}`
    const examples =
      format === 'spec'
        ? parseSpec(text)
        : format === 'markdown-it'
          ? parseMarkdownIt(text)
          : format === 'marked-json'
            ? JSON.parse(text).map((e) => e.markdown)
            : [text]
    examples.forEach((md, k) => items.push([md, `${source}#${k + 1}`]))
    count += examples.length
  }
  console.log(`${repo} ${match}: ${files.length} files, ${count} examples`)
}
const unique = [...new Map(items.map(([md, s]) => [md, s]))]
console.log(`total ${items.length} examples, ${unique.length} unique`)
writeFileSync(`${OUT}fixtures.json`, JSON.stringify(unique))

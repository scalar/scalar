/** Collects every Markdown file in the repository and its node_modules, deduplicated by content. */
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync, writeFileSync } from 'node:fs'

import { OUT, ROOT } from './paths.mjs'

const find = (args) =>
  execFileSync('find', args, { maxBuffer: 1 << 30, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
const repo = find([
  ROOT,
  '-path',
  `${ROOT}node_modules`,
  '-prune',
  '-o',
  '-path',
  '*/node_modules',
  '-prune',
  '-o',
  '-path',
  `${ROOT}.git`,
  '-prune',
  '-o',
  '-path',
  '*/.out',
  '-prune',
  '-o',
  '-type',
  'f',
  '(',
  '-name',
  '*.md',
  '-o',
  '-name',
  '*.mdx',
  '-o',
  '-name',
  '*.markdown',
  ')',
  '-print',
])
const deps = find([`${ROOT}node_modules/.pnpm`, '-type', 'f', '(', '-iname', '*.md', '-o', '-iname', '*.markdown', ')'])
const seen = new Map()
for (const [group, files] of [
  ['repo', repo],
  ['node_modules', deps],
]) {
  for (const f of files) {
    if (statSync(f).size > 2_000_000) continue
    const text = readFileSync(f, 'utf8')
    if (!seen.has(text))
      seen.set(text, `${group}:${f.replace(ROOT, '').replace(/^node_modules\/\.pnpm\/[^/]+\/node_modules\//, '')}`)
  }
}
const bytes = [...seen.keys()].reduce((a, s) => a + s.length, 0)
console.log(
  `repo files ${repo.length}, node_modules files ${deps.length}, unique ${seen.size}, ${(bytes / 1e6).toFixed(1)} MB`,
)
writeFileSync(`${OUT}markdown-files.json`, JSON.stringify([...seen]))

/**
 * Differential run for Copy as Markdown: every description in a corpus goes through the OpenAPI
 * package's real description path (plain-text fast path, Markdown, or HTML and alerts) on both
 * sides, and is serialized with each package's options. Every difference is classified.
 *
 *   node bench/copy-parity.mjs <corpus.json> <label> [limit]
 *
 * A corpus is a JSON array of strings or of [string, source] pairs. Writes .out/copy-parity-<label>.json.
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown as toMarkdownLatest } from 'mdast-util-to-markdown-latest'

import { EXPLANATIONS, explainSerializer, hasIntendedDifference, joinFix } from './copy-explain.mjs'
import { OUT } from './paths.mjs'

const [corpusPath = `${OUT}apis-guru.json`, label = 'apis-guru', limit] = process.argv.slice(2)
const old = await import(`${OUT}copy-old.mjs`)
const neu = await import(`${OUT}copy-new.mjs`)

/** The OpenAPI package's `join` handler (packages/openapi-to-markdown/src/render-document.ts). */
const openapiJoin = (left, right, parent) => {
  if (!('spread' in parent)) return undefined
  if (left.type === 'list' && right.type !== 'list') return 1
  if (left.type === 'code' || right.type === 'code') return 1
  return undefined
}
const OPTIONS = {
  openapi: { bullet: '-', join: [openapiJoin] },
  asyncapi: { bullet: '-' },
}
const serializers = Object.fromEntries(
  Object.entries(OPTIONS).map(([name, options]) => [
    name,
    {
      old: old.createMarkdownSerializer(options),
      neu: neu.createMarkdownSerializer(options),
      // What `remark-stringify` does with the current `mdast-util-to-markdown` (2.1.2), which the port follows.
      latest: (tree) => toMarkdownLatest(tree, { ...options, extensions: [gfmToMarkdown()] }),
      // The same with the serializer's join fix, so only the tree fixes are left to explain.
      latestJoined: (tree) =>
        toMarkdownLatest(tree, { ...options, join: [joinFix, ...(options.join ?? [])], extensions: [gfmToMarkdown()] }),
    },
  ]),
)

const PLAIN =
  /[\n\r\t\\`*_[\]<>#|~!&=]|:\/\/|www\.|^\s*(?:[-+]|\d+[.)])|^ {4}/ /* the inverse of parse-description.ts's isPlainText */
const ALERT = /^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SUCCESS)\]/im
const containsHtml = (node) => node.type === 'html' || (node.children ?? []).some(containsHtml)
/** Which branch of `createDescriptionParser` a description takes on one side. */
const pathOf = (side, value) => {
  if (!PLAIN.test(value) && value.trim().length > 0) return 'plain'
  return containsHtml(side.parseMarkdown(value)) || ALERT.test(value) ? 'html' : 'markdown'
}

const UNSUPPORTED = new Set(['definition', 'linkReference', 'imageReference', 'image'])
const has = (nodes, types) => nodes.some((n) => types.has(n.type) || has(n.children ?? [], types))

/** A tree without the fields mdast does not require, for structural comparison. */
const normalize = (node) => {
  const out = {}
  for (const [k, v] of Object.entries(node)) {
    if (k === 'position' || v === undefined) continue
    out[k] = k === 'children' ? v.map(normalize) : v
  }
  return out
}
/** The first place two trees differ, as a path of node types and the field. */
const firstDifference = (a, b, path = 'root') => {
  if (a.length !== b.length) return `${path}: ${a.length} vs ${b.length} children`
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (x.type !== y.type) return `${path} > ${x.type} vs ${y.type}`
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (k === 'children') continue
      if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) return `${path} > ${x.type}.${k}`
    }
    const d = firstDifference(x.children ?? [], y.children ?? [], `${path} > ${x.type}`)
    if (d) return d
  }
  return null
}

/** Whether Markdown parses back (with remark) to the tree it was serialized from, ignoring `spread`. */
const comparable = (nodes) =>
  nodes.map((n) => {
    const out = {}
    for (const [k, v] of Object.entries(n)) {
      if (k === 'position' || k === 'spread' || v === undefined) continue
      out[k] = k === 'children' ? comparable(v) : v
    }
    return out
  })
const roundTrips = (markdown, nodes) =>
  JSON.stringify(comparable(old.parseMarkdown(markdown).children)) === JSON.stringify(comparable(nodes))

const raw = JSON.parse(readFileSync(corpusPath, 'utf8'))
const corpus = (limit ? raw.slice(0, Number(limit)) : raw).map((entry) => (Array.isArray(entry) ? entry : [entry, '']))

const oldParser = old.createDescriptionParser()
const newParser = neu.createDescriptionParser()
const stats = {
  total: 0,
  paths: {},
  identical: 0,
  classes: {},
  serializerPort: { checked: 0, identical: 0, identicalWithFixes: 0 },
}
const samples = {}
const record = (cls, sample) => {
  stats.classes[cls] = (stats.classes[cls] ?? 0) + 1
  const list = (samples[cls] ??= [])
  if (list.length < 25) list.push(sample)
}
const portMismatches = []
const started = Date.now()

for (const [value, source] of corpus) {
  stats.total++
  if (typeof value !== 'string') continue
  const path = `${pathOf(old, value)}/${pathOf(neu, value)}`
  stats.paths[path] = (stats.paths[path] ?? 0) + 1
  let oldNodes
  let newNodes
  try {
    oldNodes = await oldParser()(value)
  } catch (error) {
    record('old side throws', { value, source, error: String(error) })
    continue
  }
  try {
    newNodes = await newParser()(value)
  } catch (error) {
    record('NEW SIDE THROWS', { value, source, error: String(error) })
    continue
  }
  for (const [name, s] of Object.entries(serializers)) {
    const before = s.old({ type: 'root', children: oldNodes })
    let after
    try {
      after = s.neu({ type: 'root', children: newNodes })
    } catch (error) {
      record('NEW SERIALIZER THROWS', { value, source, error: String(error) })
      continue
    }
    // The port against the current upstream serializer, on the same tree: this must always match.
    stats.serializerPort.checked++
    const latest = s.latest({ type: 'root', children: newNodes })
    if (latest === after) stats.serializerPort.identical++
    else if (s.latestJoined({ type: 'root', children: explainSerializer(newNodes) }) === after) {
      // The tree needed one of the two fixes to upstream: blocks in inline content, or line endings in code spans.
      stats.serializerPort.identicalWithFixes++
    } else if (newNodes.some(hasIntendedDifference)) stats.serializerPort.identicalWithFixes++
    else if (portMismatches.length < 50) portMismatches.push({ value, source, options: name, latest, after })

    if (name !== 'openapi') continue
    if (before === after) {
      stats.identical++
      continue
    }
    const sample = { value, source, path, before, after }
    // Explain the difference by the known, intended changes, applied to the old tree one at a time.
    let tree = oldNodes
    const steps = []
    for (const [name, change] of EXPLANATIONS) {
      const next = change(tree)
      if (s.old({ type: 'root', children: next }) !== s.old({ type: 'root', children: tree })) steps.push(name)
      tree = next
    }
    const explained = s.old({ type: 'root', children: tree })
    const upstream = has(tree, UNSUPPORTED) ? undefined : s.latestJoined({ type: 'root', children: tree })
    if (explained === after || upstream === after) {
      if (explained !== after) steps.push('serializer: mdast-util-to-markdown 2.1.2 attention encoding')
      sample.roundTrip = { before: roundTrips(before, tree), after: roundTrips(after, tree) }
      record(steps.join(' + '), sample)
      continue
    }
    if (newNodes.some(hasIntendedDifference) && !firstDifference(tree.map(normalize), newNodes.map(normalize))) {
      record(
        [
          ...steps,
          'serializer: escapes no tree change can show (titles, `<` URLs, blank lines, upper case `HTTPS://`)',
        ].join(' + '),
        sample,
      )
      continue
    }
    // A different tree that none of the intended changes explain.
    const where = firstDifference(tree.map(normalize), newNodes.map(normalize)) ?? 'same tree'
    const sameHtml = neu.htmlFromMarkdown(before) === neu.htmlFromMarkdown(after)
    record(
      `UNEXPLAINED, ${sameHtml ? 'renders the same' : 'renders differently'}: ${path}: ${where.replace(/\d+/g, 'N')}`,
      {
        ...sample,
        where,
      },
    )
  }
}

stats.seconds = Math.round((Date.now() - started) / 1000)
const sorted = Object.fromEntries(Object.entries(stats.classes).sort((a, b) => b[1] - a[1]))
console.log(JSON.stringify({ ...stats, classes: sorted }, null, 2))
if (portMismatches.length) console.log('serializer port mismatches, first:', JSON.stringify(portMismatches[0], null, 2))
writeFileSync(
  `${OUT}copy-parity-${label}.json`,
  JSON.stringify({ stats: { ...stats, classes: sorted }, samples, portMismatches }, null, 1),
)

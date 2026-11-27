/**
 * The intended changes, applied to the old (remark) tree: what the old converters would give if
 * they behaved like the new ones where the new ones are meant to differ. Used to classify
 * differences in `copy-parity.mjs` and `copy-documents.mjs`.
 */

/** Reference-style links become inline links: the pipeline's parser resolves references. */
export const resolveReferences = (nodes) => {
  const definitions = new Map()
  const collect = (n) => {
    if (n.type === 'definition') definitions.set(n.identifier, n)
    for (const c of n.children ?? []) collect(c)
  }
  nodes.forEach(collect)
  const resolve = (list) =>
    list
      .filter((n) => n.type !== 'definition')
      .map((n) => {
        if (n.type === 'linkReference') {
          const d = definitions.get(n.identifier)
          return { type: 'link', url: d?.url ?? '', title: d?.title ?? null, children: resolve(n.children) }
        }
        const copy = { ...n }
        if (copy.children) copy.children = resolve(copy.children)
        return copy
      })
  return resolve(nodes)
}

/** CRLF and CR become LF: the pipeline's parser splits the input into lines. */
export const toLf = (nodes) =>
  nodes.map((n) => {
    const copy = { ...n }
    if (typeof copy.value === 'string' && copy.type !== 'html') copy.value = copy.value.replace(/\r\n?/g, '\n')
    if (copy.children) copy.children = toLf(copy.children)
    return copy
  })

/**
 * Rows fit the header: short ones get empty cells and long ones lose the extra cells, as GFM
 * renders them. micromark keeps the row as written in the tree.
 */
export const fitRows = (nodes) =>
  nodes.map((n) => {
    const copy = { ...n }
    if (copy.children) copy.children = fitRows(copy.children)
    if (n.type === 'table') {
      const width = n.children[0]?.children.length ?? 0
      copy.children = copy.children.map((row) => ({
        ...row,
        children: [
          ...row.children.slice(0, width),
          ...Array.from({ length: Math.max(0, width - row.children.length) }, () => ({
            type: 'tableCell',
            children: [],
          })),
        ],
      }))
    }
    return copy
  })

/**
 * A line ending in a code span is a space, as CommonMark says, and the next line's indentation is
 * not part of the paragraph. micromark keeps both in the tree.
 */
export const codeSpanLineEndings = (nodes) =>
  nodes.map((n) => {
    const copy = { ...n }
    if (n.type === 'inlineCode') copy.value = n.value.replace(/(?:\r\n|\r|\n)[ \t]*/g, ' ')
    if (copy.children) copy.children = codeSpanLineEndings(copy.children)
    return copy
  })

const PHRASING = new Set([
  'break',
  'delete',
  'emphasis',
  'footnote',
  'footnoteReference',
  'image',
  'imageReference',
  'inlineCode',
  'inlineMath',
  'link',
  'linkReference',
  'strong',
  'text',
])
const INLINE_PARENTS = new Set([
  'paragraph',
  'heading',
  'emphasis',
  'strong',
  'delete',
  'link',
  'linkReference',
  'tableCell',
])
const flattenInline = (nodes) => {
  if (nodes.every((n) => PHRASING.has(n.type) || n.type === 'html')) return nodes
  const out = []
  let afterBlock = false
  const add = (content, block) => {
    if (!content.length) return
    if (out.length && (block || afterBlock)) out.push({ type: 'break' })
    out.push(...content)
    afterBlock = block
  }
  for (const n of nodes) {
    if (PHRASING.has(n.type) || n.type === 'html') add([n], false)
    else if (n.type === 'code') add([{ type: 'inlineCode', value: n.value }], true)
    else if (n.children) add(flattenInline(n.children), true)
  }
  return out
}
/** Blocks inside inline content (a code block in an HTML table cell, say) become inline. */
export const inlineBlocks = (nodes) =>
  nodes.map((n) => {
    const copy = { ...n }
    if (copy.children)
      copy.children = inlineBlocks(INLINE_PARENTS.has(n.type) ? flattenInline(copy.children) : copy.children)
    return copy
  })

/** Line endings in code spans are written as the spaces they render as. */
export const codeSpanSpaces = (nodes) =>
  nodes.map((n) => {
    const copy = { ...n }
    if (n.type === 'inlineCode') copy.value = n.value.replace(/\r\n|\r|\n/g, ' ')
    if (copy.children) copy.children = codeSpanSpaces(copy.children)
    return copy
  })

/**
 * The serializer's one change to joining, as a `join` handler for upstream: a blank line after a
 * table, and before a list that cannot interrupt a paragraph, in a tight list.
 */
export const joinFix = (left, right, parent) => {
  if (!('spread' in parent)) return undefined
  const interrupts = (list) => (!list.ordered || (list.start ?? 1) === 1) && Boolean(list.children[0]?.children.length)
  if (
    left.type === 'table' ||
    left.type === 'html' ||
    (left.type === 'paragraph' && right.type === 'list' && !interrupts(right))
  ) {
    return 1
  }
  return undefined
}

/** Empty code spans go, and adjacent ones become one. */
export const codeSpans = (nodes) => {
  const out = []
  for (const n of nodes) {
    const copy = n.children ? { ...n, children: codeSpans(n.children) } : n
    if (copy.type === 'inlineCode' && !copy.value) continue
    const last = out.at(-1)
    if (copy.type === 'inlineCode' && last?.type === 'inlineCode')
      out[out.length - 1] = { ...last, value: last.value + copy.value }
    else out.push(copy)
  }
  return out
}

const FLOW_PARENTS = new Set(['listItem', 'blockquote', 'footnoteDefinition'])
/** Runs of inline nodes in a flow container (and the root) go into paragraphs. */
export const flowParagraphs = (nodes, flow = true) => {
  const out = []
  for (const n of nodes) {
    const copy = n.children ? { ...n, children: flowParagraphs(n.children, FLOW_PARENTS.has(n.type)) } : n
    const last = out.at(-1)
    // A list item outside a list gets a list of its own.
    if (flow && copy.type === 'listItem') {
      if (last?._list) last.children.push(copy)
      else out.push({ type: 'list', ordered: false, spread: false, children: [copy], _list: true })
    } else if (!flow || !PHRASING.has(copy.type)) out.push(copy)
    else if (last?._wrapped) last.children.push(copy)
    else out.push({ type: 'paragraph', children: [copy], _wrapped: true })
  }
  return out.map((n) =>
    n._wrapped
      ? { type: 'paragraph', children: n.children }
      : n._list
        ? { type: 'list', ordered: false, spread: false, children: n.children }
        : n,
  )
}

/** What the serializer does differently from upstream, for any tree, as changes to the tree. */
export const explainSerializer = (nodes) => codeSpans(codeSpanSpaces(inlineBlocks(flowParagraphs(nodes))))

export const EXPLANATIONS = [
  ['reference link becomes inline link', resolveReferences],
  ['CRLF becomes LF', toLf],
  ['table rows fit the header', fitRows],
  ['line ending in a code span becomes a space', codeSpanLineEndings],
  ['block in inline content written inline', inlineBlocks],
  ['line ending in a code span written as a space', codeSpanSpaces],
  ['empty code span dropped, adjacent ones joined', codeSpans],
  ['inline content in a list item written as a paragraph', flowParagraphs],
]
export const explain = (nodes) => EXPLANATIONS.reduce((tree, [, change]) => change(tree), nodes)

/**
 * Trees the serializer writes differently from upstream in ways no tree change can show: a link
 * title with line endings, a URL starting with `<`, blank lines in text, and the `:` of an upper
 * case `HTTPS://`.
 */
export const hasIntendedDifference = (node) =>
  (node.type === 'link' && (/[\r\n]/.test(node.title ?? '') || node.url.startsWith('<'))) ||
  (node.type === 'inlineCode' && /\\\|/.test(node.value)) ||
  (node.type === 'text' &&
    (/^(?:\r\n|\r|\n)|(?:\r\n|\r|\n)(?:\r\n|\r|\n)/.test(node.value) || /[PS]:\//.test(node.value))) ||
  (node.children ?? []).some(hasIntendedDifference)

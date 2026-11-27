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
const hasLineEnding = (n) => /\r|\n/.test(n.value ?? '') || n.type === 'break' || (n.children ?? []).some(hasLineEnding)
const text = (n) => n.value ?? (n.children ?? []).map(text).join('')
/**
 * Blocks inside inline content (a code block in an HTML table cell, say) become inline: each
 * block's content after a line break, and code blocks code spans, whose line endings are spaces
 * where a line ending would end the cell or ATX heading.
 */
export const inlineBlocks = (nodes, lineEndingsUnsafe = false) =>
  nodes.map((n) => {
    const copy = { ...n }
    if (copy.children) {
      const children = INLINE_PARENTS.has(n.type) ? flattenInline(copy.children) : copy.children
      const atx = n.type === 'heading' && !((n.depth ?? 1) < 3 && text({ children }) && hasLineEnding({ children }))
      copy.children = inlineBlocks(children, lineEndingsUnsafe || n.type === 'tableCell' || atx)
    }
    if (n.type === 'inlineCode' && lineEndingsUnsafe) copy.value = n.value.replace(/\r\n|\r|\n/g, ' ')
    return copy
  })

export const EXPLANATIONS = [
  ['reference link becomes inline link', resolveReferences],
  ['CRLF becomes LF', toLf],
  ['table rows fit the header', fitRows],
  ['line ending in a code span becomes a space', codeSpanLineEndings],
  ['block in inline content written inline', inlineBlocks],
]
export const explain = (nodes) => EXPLANATIONS.reduce((tree, [, change]) => change(tree), nodes)

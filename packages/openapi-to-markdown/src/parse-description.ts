import type { Nodes, Parent, Root, RootContent } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { safeUrl } from './markdown-nodes'

const parser = unified().use(remarkParse).use(remarkGfm).freeze()

const containsHtml = (node: Nodes): boolean =>
  node.type === 'html' || ('children' in node && node.children.some(containsHtml))

/** Remove images and unsafe URLs without converting ordinary Markdown to HTML. */
const clean = (node: Nodes): void => {
  if ('url' in node) {
    node.url = safeUrl(node.url)
  }
  if ('children' in node) {
    for (const child of node.children) {
      clean(child)
    }
    // The filter preserves the parent's existing child types.
    const previousLength = node.children.length
    node.children = node.children.filter(
      (child) =>
        child.type !== 'image' &&
        child.type !== 'imageReference' &&
        !(
          [
            'strong',
            'emphasis',
            'delete',
            'link',
            'linkReference',
            'paragraph',
            'heading',
            'blockquote',
            'list',
            'listItem',
          ].includes(child.type) &&
          'children' in child &&
          child.children.every((descendant) => descendant.type === 'text' && !descendant.value.trim())
        ),
    ) as typeof node.children
    if (node.children.length !== previousLength) {
      const first = node.children.at(0)
      const last = node.children.at(-1)
      if (first?.type === 'text') {
        first.value = first.value.trimStart()
      }
      if (last?.type === 'text') {
        last.value = last.value.trimEnd()
      }
    }
  }
  delete node.position
}

/** Removed images must not leave their reference definitions or empty paragraphs behind. */
const pruneDefinitions = (tree: Root): void => {
  const links = new Set<string>()
  const footnotes = new Set<string>()
  const definitions = new Map(
    tree.children.filter((node) => node.type === 'footnoteDefinition').map((node) => [node.identifier, node]),
  )
  const collect = (node: Nodes): void => {
    if (node.type === 'linkReference') {
      links.add(node.identifier)
    }
    if (node.type === 'footnoteReference') {
      footnotes.add(node.identifier)
    }
    if ('children' in node) {
      node.children.forEach(collect)
    }
  }
  tree.children.filter((node) => node.type !== 'footnoteDefinition').forEach(collect)
  // Set iteration also visits footnotes discovered inside another footnote.
  for (const identifier of footnotes) {
    definitions.get(identifier)?.children.forEach(collect)
  }
  tree.children = tree.children.filter((node) => {
    if (node.type === 'definition') {
      return links.has(node.identifier)
    }
    if (node.type === 'footnoteDefinition') {
      return footnotes.has(node.identifier)
    }
    if (node.type === 'paragraph') {
      return node.children.some((child) => child.type !== 'text' || child.value.trim())
    }
    return true
  })
}

/**
 * A single line without Markdown punctuation, entities, autolinks or block markers parses to one
 * paragraph containing the same text, so it does not need the parser.
 */
const isPlainText = (value: string): boolean =>
  !/[\n\r\t\\`*_[\]<>#|~!&=]|:\/\/|www\.|^\s*(?:[-+]|\d+[.)])|^ {4}/.test(value) && value.trim().length > 0

/** Parse one description into blocks suitable for insertion into the current document. */
export type DescriptionParser = (value?: string) => Promise<RootContent[]>

/** Share parsing across pages while giving every rendered document its own reference namespace. */
export const createDescriptionParser = (): (() => DescriptionParser) => {
  const cache = new Map<string, Promise<RootContent[]>>()
  const parse = async (value: string): Promise<RootContent[]> => {
    // Most schema descriptions are one plain sentence. Parsing them costs more than the page's other text.
    if (isPlainText(value)) {
      return [{ type: 'paragraph', children: [{ type: 'text', value: value.trim() }] }]
    }
    const parsed = parser.parse(value)
    // Raw HTML and GitHub alerts retain Scalar's existing conversion behavior.
    const tree =
      containsHtml(parsed) || /^\s*>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|SUCCESS)\]/im.test(value)
        ? await (await import('./parse-html-description')).parseHtmlDescription(value)
        : parsed
    clean(tree)
    pruneDefinitions(tree)
    return tree.children
  }
  const namespace = <T extends Nodes>(node: T, prefix: string): T => {
    const copy = { ...node }
    if ('identifier' in copy) {
      copy.identifier = `${prefix}${copy.identifier}`
      if ('label' in copy) {
        copy.label = copy.identifier
      }
      if ('referenceType' in copy) {
        copy.referenceType = 'full'
      }
    }
    if ('children' in copy) {
      copy.children = copy.children.map((child) => namespace(child, prefix)) as typeof copy.children
    }
    return copy
  }
  const hasReference = (node: Nodes): boolean =>
    'identifier' in node || ('children' in node && node.children.some(hasReference))
  return () => {
    const state = { nextId: 0 }
    return async (value) => {
      if (!value) {
        return []
      }
      const prefix = `description-${state.nextId++}-`
      const cached = cache.get(value) ?? parse(value)
      if (!cache.has(value)) {
        if (cache.size >= 8192) {
          cache.clear()
        }
        cache.set(value, cached)
      }
      const nodes = await cached
      // Ordinary Markdown can share immutable nodes. Reference definitions need a copy
      // so repeated descriptions and concurrent page renders cannot affect one another.
      return nodes.map((node) => (hasReference(node) ? namespace(node, prefix) : node))
    }
  }
}

/** Replace every deferred description in the given nodes with its parsed Markdown blocks. */
export const expandDescriptions = async (nodes: RootContent[], description: DescriptionParser): Promise<void> => {
  const found: { siblings: Nodes[]; node: Nodes }[] = []
  const collect = (siblings: Nodes[]): void => {
    for (const node of siblings) {
      if (node.type === 'descriptionPlaceholder') {
        found.push({ siblings, node })
      } else if ('children' in node) {
        collect((node as Parent).children)
      }
    }
  }
  collect(nodes)
  const parsed = await Promise.all(found.map(({ node }) => description((node as { value: string }).value)))
  // Replace from the end, so earlier positions in a shared sibling list stay valid.
  for (let index = found.length - 1; index >= 0; index--) {
    const { siblings, node } = found[index]!
    siblings.splice(siblings.indexOf(node), 1, ...(parsed[index] as Nodes[]))
  }
}

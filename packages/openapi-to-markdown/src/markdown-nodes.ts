import type {
  Emphasis,
  Heading,
  InlineCode,
  Link,
  List,
  ListItem,
  Node,
  Paragraph,
  PhrasingContent,
  Strong,
  Text,
} from 'mdast'

/**
 * A description that still has to be parsed as Markdown. Schema rendering is synchronous and
 * description parsing is not, so the page renderer replaces these before it serializes a page.
 */
type DescriptionPlaceholder = Node & { type: 'descriptionPlaceholder'; value: string }

declare module 'mdast' {
  interface BlockContentMap {
    descriptionPlaceholder: DescriptionPlaceholder
  }
  interface RootContentMap {
    descriptionPlaceholder: DescriptionPlaceholder
  }
}

/** Collapse HTML-style inline whitespace; the serializer escapes generated text as Markdown. */
export const text = (value: unknown): Text => ({
  type: 'text',
  value: String(value ?? '').replace(/[\t\n\f\r ]+/g, ' '),
})
/** Inline code fences are chosen by the serializer. */
export const inlineCode = (value: unknown): InlineCode => ({ type: 'inlineCode', value: String(value ?? '') })
/** Construct a paragraph from phrasing nodes. */
export const paragraph = (...children: PhrasingContent[]): Paragraph => ({ type: 'paragraph', children })
/** Construct an emphasized label. */
export const strong = (...children: PhrasingContent[]): Strong => ({ type: 'strong', children })
/** Construct emphasized text, for notes about the output itself. */
export const emphasis = (...children: PhrasingContent[]): Emphasis => ({ type: 'emphasis', children })
/** Construct a section heading. */
export const heading = (depth: Heading['depth'], ...children: PhrasingContent[]): Heading => ({
  type: 'heading',
  depth,
  children,
})
/** Construct a list item that may contain nested blocks. */
export const item = (...children: ListItem['children']): ListItem => ({ type: 'listItem', spread: false, children })
/** Construct an unordered list. */
export const list = (children: ListItem[]): List => ({ type: 'list', ordered: false, spread: false, children })
/**
 * Retain rehype-sanitize's protocol policy. The general sanitizeUrl helper allows
 * additional schemes and excludes IRC/XMPP, so it is not compatible here.
 */
export const safeUrl = (url: string): string => {
  const normalized = url.replace(/[\u0000-\u0020\u007f-\u009f]/g, '')
  const protocol = /^([^/?#]*):/.exec(normalized)?.[1]
  return protocol && !['http', 'https', 'irc', 'ircs', 'mailto', 'xmpp'].includes(protocol.toLowerCase()) ? '' : url
}
/** Links from OpenAPI metadata follow the same URL policy as descriptions. */
export const link = (url: string, label: string): Link => ({ type: 'link', url: safeUrl(url), children: [text(label)] })
/** Render a metadata label and value with the established nonbreaking separator. */
export const field = (label: string, value: PhrasingContent): ListItem =>
  item(paragraph(strong(text(`${label}:`)), text('\u00a0'), value))
/** Defer a description, so it keeps its paragraphs, links and code blocks once parsed. */
export const describe = (value: unknown): DescriptionPlaceholder[] =>
  typeof value === 'string' && value.trim() ? [{ type: 'descriptionPlaceholder', value }] : []

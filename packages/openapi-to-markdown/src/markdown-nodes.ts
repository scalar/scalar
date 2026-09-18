import type { Heading, InlineCode, Link, List, ListItem, Paragraph, PhrasingContent, Strong, Text } from 'mdast'

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

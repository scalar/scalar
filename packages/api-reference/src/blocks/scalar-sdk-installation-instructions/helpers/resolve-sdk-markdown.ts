import type { Node } from '@scalar/markdown'
import { type SecuritySchemeObjectSecret, resolveCredentialPlaceholders } from '@scalar/workspace-store/request-example'

/** An SDK code block with separate display and copy values. */
export type SdkCodeBlock = {
  marker: string
  language: string
  displayContent: string
  copyContent: string
}

type MarkdownNode = Node & { children?: MarkdownNode[]; value?: string; lang?: string }

/**
 * Resolve text after Markdown parsing so credentials cannot introduce links, HTML,
 * or code fences. Raw HTML and link destinations are deliberately left untouched.
 */
export const resolveSdkMarkdown = (
  root: Node,
  securitySchemes: SecuritySchemeObjectSecret[],
  markerPrefix: string,
): SdkCodeBlock[] => {
  const blocks: SdkCodeBlock[] = []
  const hasPlaceholders = securitySchemes.some((scheme) => 'x-scalar-credential-placeholders' in scheme)

  const visit = (node: MarkdownNode, resolvePlaceholders: boolean): MarkdownNode => {
    if (typeof node.value === 'string' && ['code', 'inlineCode', 'text'].includes(node.type)) {
      const { content, displayContent } = resolvePlaceholders
        ? resolveCredentialPlaceholders(node.value, securitySchemes)
        : { content: node.value, displayContent: node.value }
      node.value = displayContent

      if (node.type === 'code') {
        const marker = `${markerPrefix}-${blocks.length}`
        blocks.push({ marker, language: node.lang ?? 'plaintext', displayContent, copyContent: content })
        // Keep the code visible during SSR. In the browser, the wrapper receives
        // the same copyable component whether or not a credential is available.
        return {
          type: 'blockquote',
          children: [node],
          data: { hName: 'div', hProperties: { className: [marker] } },
        }
      }
      return node
    }
    if (node.children) {
      // Inline HTML is split into opening-tag, text, and closing-tag siblings.
      // Keep any text inside such a container from receiving credentials.
      const resolveChildren =
        resolvePlaceholders && (node.type === 'root' || !node.children.some((child) => child.type === 'html'))
      node.children = node.children.map((child) => visit(child, resolveChildren))
    }
    return node
  }
  visit(root, hasPlaceholders)
  return blocks
}

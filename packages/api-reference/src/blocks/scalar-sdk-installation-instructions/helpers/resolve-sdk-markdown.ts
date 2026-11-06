import type { Node } from '@scalar/code-highlight'
import {
  type SecuritySchemeObjectSecret,
  maskCredentialPlaceholders,
  resolveCredentialPlaceholders,
} from '@scalar/workspace-store/request-example'

/** A credential-bearing code block rendered with a separate display and copy value. */
export type SdkCredentialCodeBlock = {
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
): SdkCredentialCodeBlock[] => {
  const blocks: SdkCredentialCodeBlock[] = []
  const visit = (node: MarkdownNode): MarkdownNode => {
    // Inline HTML is split into sibling opening-tag, text, and closing-tag nodes.
    // Leave that whole text container alone rather than inserting into raw HTML.
    if (node.type === 'html' || (node.type !== 'root' && node.children?.some((child) => child.type === 'html'))) {
      return node
    }
    if (['text', 'inlineCode', 'code'].includes(node.type) && typeof node.value === 'string') {
      const resolved = resolveCredentialPlaceholders(node.value, securitySchemes)
      if (!resolved.segments.some((segment) => segment.credential)) {
        return node
      }
      const displayContent = maskCredentialPlaceholders(resolved)
      node.value = displayContent
      if (node.type === 'code') {
        const marker = `${markerPrefix}-${blocks.length}`
        blocks.push({ marker, language: node.lang ?? 'plaintext', displayContent, copyContent: resolved.content })
        // Keep masked Markdown code visible during SSR; the browser enhancement
        // replaces this controlled wrapper's contents with a copyable code block.
        return {
          type: 'blockquote',
          children: [node],
          data: { hName: 'div', hProperties: { className: [marker] } },
        }
      }
      return node
    }
    if (node.children) {
      node.children = node.children.map(visit)
    }
    return node
  }
  visit(root)
  return blocks
}

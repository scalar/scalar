import type { Element } from 'hast'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

const ALERT_TYPES = ['note', 'tip', 'important', 'warning', 'caution', 'success'] as const

// Simple whitespace check function
function isWhitespace(node: any): boolean {
  return node.type === 'text' && typeof node.value === 'string' && /^\s*$/.test(node.value)
}

export function rehypeAlert() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent: any) => {
      if (node.tagName !== 'blockquote' || typeof index !== 'number' || !parent || parent.type !== 'root') {
        return
      }

      // Find the first non-whitespace child
      const headIndex = node.children.findIndex((child) => !isWhitespace(child))
      if (headIndex === -1) {
        return
      }

      const head = node.children[headIndex]

      if (!head || head.type !== 'element' || head.tagName !== 'p') {
        return
      }

      const text = head.children[0]
      if (!text || text.type !== 'text' || !text.value.startsWith('[!')) {
        return
      }

      const end = text.value.indexOf(']')
      if (end === -1) {
        return
      }

      // Extract the alert type
      const alertType = text.value.slice(2, end).toLowerCase() as (typeof ALERT_TYPES)[number]
      if (!ALERT_TYPES.includes(alertType)) {
        return
      }

      // Remove the blockquote if it's empty
      if (end + 1 === text.value.length) {
        const next = head.children[1]
        if (next) {
          if (next.type !== 'element' || next.tagName !== 'br') {
            return
          }
          if (!head.children[2]) {
            return
          }
          head.children = head.children.slice(2)
          const node = head.children[0]
          if (node && node.type === 'text' && node.value.charAt(0) === '\n') {
            node.value = node.value.slice(1)
          }
        } else {
          const skipped = headIndex + 1 < node.children.length && isWhitespace(node.children[headIndex + 1])
          const nextIndex = skipped ? headIndex + 2 : headIndex + 1
          if (nextIndex >= node.children.length || node.children[nextIndex]?.type !== 'element') {
            return
          }

          node.children = node.children.slice(nextIndex)
        }
      } else if (
        text.value.charAt(end + 1) === '\n' &&
        // Check if the next character is a newline or a non-whitespace character
        (end + 2 === text.value.length || !/^\s*$/.test(text.value.slice(end + 2)))
      ) {
        text.value = text.value.slice(end + 2)
      } else {
        // Remove the alert marker if it's not followed by a newline or a non-whitespace character
        text.value = text.value.replace(/^\s*\[!.*?\]\s*/, '')
      }

      // Extract content from paragraphs to avoid wrapping in <p> tags
      const contentChildren = []
      for (let i = headIndex; i < node.children.length; i++) {
        const child = node.children[i]
        if (child?.type === 'element' && child.tagName === 'p' && child.children) {
          contentChildren.push(...child.children)
        } else {
          contentChildren.push(child)
        }
      }

      // Replace the blockquote with a div containing the alert
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['markdown-alert', `markdown-alert-${alertType}`] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['markdown-alert-icon'] },
            children: [],
          },
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['markdown-alert-content'] },
            children: [{ type: 'text', value: ' ' }, ...contentChildren],
          },
        ],
      }
    })
  }
}

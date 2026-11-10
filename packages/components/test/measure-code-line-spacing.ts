import type { Locator } from '@playwright/test'

/** Measure rendered line pitch across highlighted spans, including intervening blank lines. */
export const measureCodeLineSpacing = async (code: Locator): Promise<number[]> =>
  code.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) {
      nodes.push(walker.currentNode as Text)
    }

    const text = nodes.map((node) => node.data).join('')
    const positions = Array.from(text.matchAll(/[^\n]+/g), (match) => {
      const offset = match.index
      const nodeIndex = nodes.findIndex(
        (_, index) => nodes.slice(0, index + 1).reduce((sum, node) => sum + node.length, 0) > offset,
      )
      const node = nodes[nodeIndex]!
      const nodeOffset = offset - nodes.slice(0, nodeIndex).reduce((sum, node) => sum + node.length, 0)
      const range = document.createRange()
      range.setStart(node, nodeOffset)
      range.setEnd(node, nodeOffset + 1)
      return { line: text.slice(0, offset).split('\n').length - 1, top: range.getBoundingClientRect().top }
    })

    return positions.slice(1).map((position, index) => {
      const previous = positions[index]!
      return (position.top - previous.top) / (position.line - previous.line)
    })
  })

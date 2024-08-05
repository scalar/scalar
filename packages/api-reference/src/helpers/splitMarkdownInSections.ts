import { getMarkdownAst } from '@scalar/code-highlight/markdown'

/**
 * Takes Markdown and splits it into sections based on the level of the headers.
 */
export function splitMarkdownInSections(
  content: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1,
) {
  const ast = getMarkdownAst(content)

  console.log(ast)
  // Example:
  // {
  //   type: 'root',
  //   children: [
  //     { type: 'html', value: '<div>', position: [Object] },
  //     {
  //       type: 'heading',
  //       depth: 1,
  //       children: [Array],
  //       position: [Object]
  //     },
  //     { type: 'paragraph', children: [Array], position: [Object] },
  //     { type: 'html', value: '</div>', position: [Object] },
  //     {
  //       type: 'heading',
  //       depth: 2,
  //       children: [Array],
  //       position: [Object]
  //     },
  //     { type: 'paragraph', children: [Array], position: [Object] }
  //   ],
  //   position: {
  //     start: { line: 1, column: 1, offset: 0 },
  //     end: { line: 14, column: 5, offset: 72 }
  //   }
  // }

  // Split AST in multiple sections, the headings are the dividers

  return [content]
}

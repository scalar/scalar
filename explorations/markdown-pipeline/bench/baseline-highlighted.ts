/** The unified renderer exactly as `@scalar/markdown` shipped it before the move, highlighter included. */
import {
  createHtmlFromMarkdown,
  getHeadings,
  isHeading,
  splitContent,
  textFromNode,
} from '../../../packages/markdown/src/markdown/markdown'
import { rehypeHighlight } from '../../../packages/markdown/src/rehype-highlight'

export const htmlFromMarkdown = createHtmlFromMarkdown(() => rehypeHighlight({ className: 'custom-scroll' }))

export { getHeadings, isHeading, splitContent, textFromNode }

/** The unified renderer with the API `htmlFromMarkdown` had before the move, without a highlighter. */
import {
  createHtmlFromMarkdown,
  getHeadings,
  isHeading,
  splitContent,
  textFromNode,
} from '../../../packages/markdown/src/markdown/markdown'

export const htmlFromMarkdown = createHtmlFromMarkdown(() => () => undefined)

export { getHeadings, isHeading, splitContent, textFromNode }

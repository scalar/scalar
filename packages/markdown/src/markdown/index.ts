import { rehypeHighlight } from '../rehype-highlight'
import { createHtmlFromMarkdown } from './markdown'

export { type Node, getHeadings, isHeading, splitContent, textFromNode } from './markdown'

/** Render Markdown with Scalar's syntax highlighter. */
export const htmlFromMarkdown = createHtmlFromMarkdown(() => rehypeHighlight({ className: 'custom-scroll' }))

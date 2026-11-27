import { type HtmlFromMarkdownOptions as PipelineOptions, htmlFromMarkdown as render } from '../pipeline'
import { highlight } from './highlight'

export { type Node, getHeadings, isHeading, splitContent, textFromNode } from '../pipeline'

/** Options for {@link htmlFromMarkdown}. */
export type HtmlFromMarkdownOptions = Omit<PipelineOptions, 'highlight' | 'codeClassName' | 'unsafe'>

/** Render Markdown to sanitized HTML, with Scalar's syntax highlighter. */
export const htmlFromMarkdown = (markdown: string, options?: HtmlFromMarkdownOptions): string =>
  render(markdown, { ...options, highlight, codeClassName: 'custom-scroll' })

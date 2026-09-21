import { createLowlight } from 'lowlight'

import { standardLanguages } from '../languages/standard'
import { type HtmlFromMarkdownOptions, renderMarkdown } from './markdown'

let lowlight: ReturnType<typeof createLowlight> | undefined

/** Render Markdown synchronously with the complete language registry. */
export const htmlFromMarkdown = (markdown: string, options?: HtmlFromMarkdownOptions): string => {
  lowlight ??= createLowlight(standardLanguages)
  return renderMarkdown(markdown, options, lowlight)
}

import { htmlFromMarkdown, mdastFromHtml } from '@scalar/markdown'
import type { Root } from 'mdast'

/** Compatibility path loaded only for descriptions containing HTML or Scalar alerts. */
export const parseHtmlDescription = (value: string): Root => {
  const html = htmlFromMarkdown(value, { removeTags: ['img', 'picture'] })
  return mdastFromHtml(html)
}

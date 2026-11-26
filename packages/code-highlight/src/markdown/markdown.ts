import { createHtmlFromMarkdown } from '@scalar/markdown/renderer'

import { standardLanguages } from '@/languages'
import { rehypeHighlight } from '@/rehype-highlight'
import { getSharedLowlight } from '@/rehype-highlight/shared-lowlight'

/** Render Markdown with Lowlight and retain automatic language detection for unlabelled code fences. */
export const htmlFromMarkdown = createHtmlFromMarkdown(() =>
  rehypeHighlight({
    lowlight: getSharedLowlight(standardLanguages),
    detect: true,
    className: 'custom-scroll',
  }),
)

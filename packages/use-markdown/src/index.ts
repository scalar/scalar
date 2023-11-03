import rehypeDocument from 'rehype-document'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeFormat from 'rehype-format'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkHeadingId from 'rehype-slug-custom-id'
import rehypeStringify from 'rehype-stringify'
// import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import styles from './styles.module.css'
import css from './styles.module.css?raw'

// Apply TS def
const scalarStyles = styles as typeof styles & { markdown: string }
export { scalarStyles }

/**
 * Alternative way to apply scoped styles to the codemirror block
 * Provide a scoping class name and then use that class name on the element
 */
export function useStyles(className: string) {
  const style = document.createElement('style')
  style.innerHTML = css.replaceAll('scalar-reference-markdown', className)
  document.head.appendChild(style)
}

export function parseSwaggerDescription(description: string | undefined) {
  return (
    unified()
      .use(remarkParse)
      // TODO: @hans investigate why these breaks get added to all paragraphs
      // .use(remarkBreaks)
      .use(remarkGfm)
      .use(remarkRehype)
      // TODO: @hans refactor below to allow proper typing
      // @ts-ignore
      .use(remarkHeadingId)
      .use(rehypeDocument)
      .use(rehypeFormat)
      .use(rehypeSanitize, {
        ...defaultSchema,
        tagNames: defaultSchema.tagNames?.filter(
          (tag) => !['img'].includes(tag),
        ),
      })
      .use(rehypeHighlight, {
        detect: true,
      })
      .use(rehypeExternalLinks, { target: '_blank' })
      .use(rehypeStringify)
      .process(description)
  )
}

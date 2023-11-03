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

/* Converts a swagger description from a string to a markdown representation */
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

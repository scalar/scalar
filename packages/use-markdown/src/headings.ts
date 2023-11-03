import remarkHeadings from '@vcarl/remark-headings'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { type ZodSchema, z } from 'zod'

export type Heading = {
  depth: number
  value: string
  slug?: string
}

const headingSchema = z.object({
  depth: z.number(),
  value: z.string(),
  slug: z.string().optional(),
}) satisfies ZodSchema<Heading>

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify)
  .use(remarkHeadings)

export const findMarkdownHeadings = async (
  input: string,
): Promise<Heading[]> => {
  const { headings } = (await processor.process(input)).data

  const validated = headingSchema.array().safeParse(headings)
  if (!validated.success) {
    console.error('Invalid headings from the markdown')
  }

  return validated.success ? validated.data : []
}

import { type Heading } from './getHeadingsFromMarkdown'

export const getHeadingId = (heading: Heading) => {
  if (heading.slug) {
    return `description/${heading.slug}`
  }

  return ''
}

import { type Heading } from './getHeadingsFromMarkdown'

export const getHeadingId = (heading: Heading) => {
  console.log({ heading })
  if (heading.slug) {
    return `description=${heading.slug}`
  }

  return ''
}

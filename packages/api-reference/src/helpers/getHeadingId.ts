import { type Heading } from '@scalar/use-markdown'

export const getHeadingId = (heading: Heading) => {
  if (heading.slug) {
    return `user-content-${heading.slug}`
  }

  return ''
}

import GithubSlugger from 'github-slugger'

import { type Tag } from '../types'

export const getTagSectionId = (tag: Tag) => {
  console.log(tag)
  const slugger = new GithubSlugger()
  const slug = slugger.slug(tag.name)

  return `tag/${slug}`
}

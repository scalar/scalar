import GithubSlugger from 'github-slugger'

export const getModelSectionId = (name: string) => {
  const slugger = new GithubSlugger()
  const slug = slugger.slug(name)

  return `model//${slug}`
}

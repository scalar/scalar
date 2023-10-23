import GithubSlugger from 'github-slugger'

export const getModelSectionId = (name?: string) => {
  if (!name) {
    return 'models'
  }

  const slugger = new GithubSlugger()
  const slug = slugger.slug(name)

  return `model/${slug}`
}

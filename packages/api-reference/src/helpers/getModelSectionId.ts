import GithubSlugger from 'github-slugger'

export const getModelSectionId = (name?: string) => {
  console.log({ model: name })
  if (!name) {
    return 'models'
  }

  const slugger = new GithubSlugger()
  const slug = slugger.slug(name)

  return new URLSearchParams({ model: slug }).toString()
}

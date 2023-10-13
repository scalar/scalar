import GithubSlugger from 'github-slugger'
import { type TransformedOperation } from 'src/types'

export const getOperationSectionId = (operation: TransformedOperation) => {
  const slugger = new GithubSlugger()
  const slug = slugger.slug(`${operation.httpVerb}-${operation.path}`)

  return `operation-${slug}`
}

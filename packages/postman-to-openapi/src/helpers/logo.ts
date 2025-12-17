import type { PostmanCollection } from '../types'

/**
 * Processes logo information from a Postman Collection.
 * This function extracts logo-related variables from the collection
 * and constructs an object with logo properties.
 */
export function processLogo(postmanCollection: PostmanCollection) {
  const logoVariables = postmanCollection.variable?.filter((v) => v.key?.startsWith('x-logo.')) || []
  if (logoVariables.length === 0) {
    return null
  }

  const logo: Record<string, string> = {}
  logoVariables.forEach((v) => {
    if (v.key) {
      const key = v.key.replace('x-logo.', '').replace('Var', '')
      logo[key] = v.value as string
    }
  })

  return {
    url: logo.url,
    backgroundColor: logo.backgroundColor,
    altText: logo.altText,
    href: logo.href,
  }
}

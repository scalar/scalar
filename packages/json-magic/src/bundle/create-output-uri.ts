import { toResourceUri } from '@/helpers/to-resource-uri'

/** Map local retrieval documents to output identities without changing loader paths. */
export const createOutputUri = (origin: string, outputBase?: string): ((source: string) => string) => {
  if (outputBase === undefined) {
    // In-memory input has no filesystem identity to preserve.
    return (source) => (source === '/' ? 'https://scalar.invalid/' : toResourceUri(source))
  }
  const base = new URL(outputBase)
  if (base.hash || !URL.canParse('.', base)) {
    throw new TypeError('outputBase must be an absolute hierarchical URI without a fragment')
  }
  const root = toResourceUri(origin)
  const directory = URL.canParse('.', root) ? new URL('.', root) : undefined
  const outside = new Map<string, string>()
  return (source): string => {
    const uri = toResourceUri(source)
    if (uri === root) return base.href
    const target = new URL(uri)
    if (target.protocol !== 'file:') return uri
    if (directory && target.host === directory.host && target.pathname.startsWith(directory.pathname)) {
      const relative = target.pathname.slice(directory.pathname.length)
      return new URL(`${relative}${target.search}${target.hash}`, base).href
    }
    // Files outside the entry directory get isolated namespaces without exposing their paths.
    const location = new URL('.', target).href
    if (!outside.has(location)) outside.set(location, `./__bundle__/source-${outside.size}/`)
    return new URL(`${outside.get(location)}${target.pathname.split('/').at(-1)}${target.search}${target.hash}`, base)
      .href
  }
}

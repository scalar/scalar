/**
 * Maps well-known package registry and source hosts to a friendly link label.
 *
 * The host is matched on its registrable suffix, so `www.npmjs.com` and
 * `gist.github.com` resolve the same as their bare domains.
 */
const KNOWN_HOSTS: Record<string, string> = {
  'github.com': 'View on GitHub',
  'gitlab.com': 'View on GitLab',
  'bitbucket.org': 'View on Bitbucket',
  'npmjs.com': 'View on npm',
  'pypi.org': 'View on PyPI',
  'nuget.org': 'View on NuGet',
  'packagist.org': 'View on Packagist',
  'rubygems.org': 'View on RubyGems',
  'crates.io': 'View on crates.io',
  'pkg.go.dev': 'View on Go Packages',
  'pub.dev': 'View on pub.dev',
  'cocoapods.org': 'View on CocoaPods',
  'maven.apache.org': 'View on Maven',
  'mvnrepository.com': 'View on Maven',
}

/**
 * Resolve an SDK `url` to a safe, linkable `http(s)` URL.
 *
 * The `url` comes straight from the OpenAPI document, so it is untrusted. We
 * only ever render `http:`/`https:` links to avoid `javascript:`, `data:` and
 * other script-bearing schemes. Returns `undefined` when the value is not a
 * safe absolute URL.
 */
export const getSafeSdkUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url)

    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}

/**
 * Build the label for an SDK link.
 *
 * Returns a friendly "View on …" label for known hosts (GitHub, npm, PyPI, …)
 * and falls back to the raw URL for everything else so the link always shows
 * something meaningful.
 */
export const getSdkUrlLabel = (url: string): string => {
  try {
    const { hostname } = new URL(url)
    const host = hostname.replace(/^www\./, '')

    // Match either the exact host or its registrable suffix (for example `gist.github.com`).
    const match = Object.entries(KNOWN_HOSTS).find(([known]) => host === known || host.endsWith(`.${known}`))

    return match ? match[1] : url
  } catch {
    // Not a parseable URL, so just show whatever was passed.
    return url
  }
}

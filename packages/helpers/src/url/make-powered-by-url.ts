/** Where the "Powered by Scalar" attribution link points to */
const POWERED_BY_BASE_URL = 'https://scalar.com/'

/**
 * Builds the URL for the "Powered by Scalar" attribution link.
 *
 * The link carries UTM parameters so we can tell which integration a visitor came from.
 * We use `utm_source=powered-by` (and not `api-reference`, like the "Open API Client" button does)
 * on purpose, so the two traffic streams stay distinguishable in analytics.
 *
 * When no integration is known, we omit `utm_campaign` rather than guessing a default.
 * Plenty of setups (the SSR package, Java, Go or Rust) do not set an integration at all,
 * and labelling them as, say, `vue` would make the campaign data misleading.
 *
 * This never throws, the input is only ever added as an encoded query parameter.
 *
 * @example
 * makePoweredByUrl('express')
 * // 'https://scalar.com/?utm_source=powered-by&utm_medium=api-reference&utm_campaign=express'
 */
export const makePoweredByUrl = (integration?: string | null): string => {
  const url = new URL(POWERED_BY_BASE_URL)

  url.searchParams.set('utm_source', 'powered-by')
  url.searchParams.set('utm_medium', 'api-reference')

  const campaign = typeof integration === 'string' ? integration.trim() : ''

  if (campaign.length) {
    url.searchParams.set('utm_campaign', campaign)
  }

  return url.toString()
}

/** Official examples are loaded on demand rather than shipping large snapshots. */
export const documents = [
  { id: 'galaxy', name: 'Galaxy', source: 'https://github.com/scalar/scalar/tree/main/packages/galaxy' },
  {
    id: 'stripe',
    name: 'Stripe',
    source: 'https://raw.githubusercontent.com/stripe/openapi/master/latest/openapi.spec3.json',
  },
  {
    id: 'github',
    name: 'GitHub',
    source:
      'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    source: 'https://raw.githubusercontent.com/cloudflare/api-schemas/main/openapi.json',
  },
] as const

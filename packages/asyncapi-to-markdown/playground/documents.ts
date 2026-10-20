/** Local examples keep the playground reproducible without fetching remote descriptions. */
export const documents = [
  {
    id: 'events',
    name: 'Order events',
    source: 'https://github.com/scalar/scalar/tree/main/packages/asyncapi-to-markdown/src/fixtures',
  },
  {
    id: 'shared',
    name: 'Shared schemas (60 operations)',
    source: 'https://github.com/scalar/scalar/tree/main/packages/asyncapi-to-markdown/benchmarks',
  },
] as const

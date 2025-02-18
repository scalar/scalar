import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
}

export const GET = ApiReference(config)

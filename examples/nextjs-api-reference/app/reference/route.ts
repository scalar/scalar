import { ApiReference } from '../../../../integrations/nextjs-api-reference/dist'

const config = {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
}

export const GET = ApiReference(config)

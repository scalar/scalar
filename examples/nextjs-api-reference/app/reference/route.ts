import { ApiReference } from '@scalar/nextjs-api-reference'

const response = await fetch(
  'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
)

const config = {
  spec: {
    content: await response.text(),
  },
}

export const GET = ApiReference(config)

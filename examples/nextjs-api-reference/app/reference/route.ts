import { ApiReference } from '@scalar/nextjs-api-reference'

const config = {
  url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
}

export const GET = ApiReference(config)

import { ApiReference } from '@scalar/nextjs-api-reference'

import content from '../petstorev3.json'

const config = {
  spec: {
    content,
  },
}

export const GET = ApiReference(config)

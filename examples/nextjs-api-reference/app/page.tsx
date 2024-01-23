import { ApiReference } from '@scalar/nextjs-api-reference'

import content from '../../web/src/fixtures/petstorev3.json'

const Page = () => {
  const config = {
    isEditable: false,
    spec: {
      content,
    },
  }

  return <ApiReference config={config} />
}

export default Page

import React from 'react'

import content from '../../../web/src/fixtures/petstorev3.json'
import { ServerReference } from './components/ServerReference'

const Page = () => {
  return (
    <>
      <ServerReference
        configuration={{ isEditable: false, spec: { content } }}
      />
    </>
  )
}

export default Page

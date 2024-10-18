import Link from 'next/link'
import React from 'react'

import { Button, ClientWrapper } from '../client/components'

const Page = () => {
  return (
    <ClientWrapper>
      <Button />
      <Link href="/client">Go to client</Link>
    </ClientWrapper>
  )
}

export default Page

import Link from 'next/link'

import { Button } from '../client/components/Button'
import { ClientWrapper } from '../client/components/ClientWrapper'

const Page = () => {
  return (
    <ClientWrapper>
      <Button
        method="POST"
        path="/auth/token"
      />
      <Link href="/client">Go to client</Link>
    </ClientWrapper>
  )
}

export default Page

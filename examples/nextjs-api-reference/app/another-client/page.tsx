import Link from 'next/link'

import { Button, ClientWrapper } from '../client/components'

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

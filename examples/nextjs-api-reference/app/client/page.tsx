import Link from 'next/link'

import { Button } from '../client/components/Button'
import { ClientWrapper } from '../client/components/ClientWrapper'

const Page = () => {
  return (
    <ClientWrapper>
      <Button
        method="POST"
        path="/planets"
      />
      <Link href="/another-client">Go to another client</Link>
    </ClientWrapper>
  )
}

export default Page

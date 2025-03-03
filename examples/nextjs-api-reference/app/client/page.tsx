import Link from 'next/link'

import { Button, ClientWrapper } from './components'

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

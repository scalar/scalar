import Link from 'next/link'

import { Button } from '../client/components/Button'

const Page = () => {
  return (
    <>
      <Button
        method="post"
        path="/auth/token"
      />
      <Link href="/client">Go to client</Link>
    </>
  )
}

export default Page

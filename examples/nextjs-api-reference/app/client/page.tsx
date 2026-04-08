import Link from 'next/link'

import { Button } from '../client/components/Button'

const Page = () => {
  return (
    <>
      <Button
        method="get"
        path="/planets"
      />
      <Link href="/another-client">Go to another client</Link>
    </>
  )
}

export default Page

import type { Metadata } from 'next'
import type { JSX } from 'react'

import { Reference } from './reference'

export const metadata: Metadata = {
  title: 'Orbit API | Embedded reference',
  description: 'Explore the Orbit API inside a Next.js application.',
}

export default function Page(): JSX.Element {
  return <Reference />
}

import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Scalar for Next.js',
  description: 'Standalone and embedded API documentation with Scalar.',
}

export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

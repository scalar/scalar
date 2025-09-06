import type { JSX } from 'react'

import './style.css'

export default function DocsLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <div className="header">Header</div>
      {children}
      <div className="footer">Footer</div>
    </>
  )
}

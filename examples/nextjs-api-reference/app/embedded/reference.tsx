'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import Link from 'next/link'
import { type JSX, useState } from 'react'

import '@scalar/api-reference-react/style.css'
import './style.css'

/** Keep the application shell and reference on the same theme. */
export const Reference = (): JSX.Element => {
  const [dark, setDark] = useState(false)
  return (
    <div className={`scalar-app orbit ${dark ? 'dark-mode' : 'light-mode'}`}>
      <header className="orbit-header">
        <Link
          className="orbit-brand"
          href="/embedded">
          Orbit<span>Developer API</span>
        </Link>
        <nav aria-label="Reference navigation">
          <a href="/scalar">Standalone reference</a>
          <a href="/openapi.json">OpenAPI</a>
          <button
            type="button"
            aria-pressed={dark}
            onClick={() => setDark(!dark)}>
            Dark mode
          </button>
        </nav>
      </header>
      <ApiReferenceReact
        configuration={{
          url: '/openapi.json',
          withDefaultFonts: false,
          hideDarkModeToggle: true,
          forceDarkModeState: dark ? 'dark' : 'light',
        }}
      />
    </div>
  )
}

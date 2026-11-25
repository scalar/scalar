import { describe, expect, it } from 'vitest'

import { isLocalDevelopmentPage } from './is-local-development-page'

// A URL normalises its host the way the browser's `location` does (case, IPv6 brackets, numeric IPv4)
const page = (url: string): URL => new URL(url)

describe('is-local-development-page', () => {
  it.each([
    'http://localhost:3000/',
    'https://localhost:8443/docs',
    'http://LOCALHOST:3000/',
    'http://127.0.0.1:8000/docs',
    'http://127.0.1.1:8000/',
    'http://2130706433:8000/',
    'http://[::1]:5173/',
    'http://[0:0:0:0:0:0:0:1]:5173/',
    'http://0.0.0.0:8080/',
    'http://my-api.localhost:3000/',
  ])('accepts a development server on this machine (%s)', (url) => {
    expect(isLocalDevelopmentPage(page(url))).toBe(true)
  })

  it.each([
    // Public sites, including ones that only mention or look like localhost
    'https://docs.acme.io/',
    'https://docs.acme.io/reference?server=http://localhost:3000',
    'http://localhost@docs.acme.io/',
    'http://localhost.acme.io/',
    'http://127.0.0.1.nip.io/',
    // Reserved names the localhost shell counts as local, which can be shared sites
    'http://my-api.test/',
    'http://docs.example/',
    'http://docs.invalid/',
    // Other machines on the network
    'http://192.168.1.20:3000/',
    'http://10.0.0.5:8080/',
    // Apps shipped in a web view serve themselves on localhost names without a port
    'https://localhost/',
    'http://localhost/',
    'http://localhost:80/',
    'http://wails.localhost/',
    'https://wails.localhost/',
    'https://0.0.0.0/',
    // Files and opaque addresses
    'file:///Users/dev/docs/index.html',
    'about:srcdoc',
    'blob:http://localhost:3000/0b3d7a2e-0000-4000-8000-000000000000',
    'data:text/html,<p>docs</p>',
    'tauri://localhost/',
    'http://tauri.localhost/',
    'capacitor://localhost/',
  ])('turns down every other page (%s)', (url) => {
    expect(isLocalDevelopmentPage(page(url))).toBe(false)
  })

  it('reads the current page when given none', () => {
    expect(isLocalDevelopmentPage()).toBe(isLocalDevelopmentPage(page(window.location.href)))
  })
})

/* eslint-disable */
// ESLint is configured to prefere types about interfaces, which is good. But not in that case.

// @prettier-ignore
interface Window {
  process: any
}

if (typeof window !== 'undefined') {
  window.process = window.process || {
    platform: 'browser',
    browser: true,
  }
}

interface Window {
  process: any
}

if (typeof window !== 'undefined') {
  window.process = window.process || {
    platform: 'browser',
    browser: true,
  }
}

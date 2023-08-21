interface Window {
  process: any
}

if (window) {
  window.process = window.process || {
    platform: 'browser',
    browser: true,
  }
}

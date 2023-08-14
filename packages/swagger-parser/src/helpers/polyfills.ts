interface Window {
  process: any
}

window.process = window.process || {
  platform: 'browser',
  browser: true,
}

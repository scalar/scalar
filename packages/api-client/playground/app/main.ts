import { createApiClientApp } from '@/layouts/App'
import { postResponseScriptsPlugin } from '@scalar/scripts/plugins/post-response-scripts'
import '@scalar/scripts/style.css'

createApiClientApp(
  document.getElementById('scalar-client'),
  {
    proxyUrl: 'https://proxy.scalar.com',
  },
  true,
  undefined,
  // Oh, we need to move this to another parameter, we don't need a separate parameter for plugins.
  [postResponseScriptsPlugin],
)

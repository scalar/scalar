import { createApiClientApp } from '@/layouts/App'
import { postResponseScriptsPlugin } from '@/plugins/post-response-scripts'

createApiClientApp(
  document.getElementById('scalar-client'),
  {
    proxyUrl: 'https://proxy.scalar.com',
  },
  true,
  undefined,
  [postResponseScriptsPlugin],
)

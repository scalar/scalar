import { createApiClientApp } from '@/layouts/App'
import { postResponseScriptsPlugin } from '@scalar/scripts/plugins/post-response-scripts'
import '@scalar/scripts/style.css'

createApiClientApp(
  document.getElementById('scalar-client'),
  {
    proxyUrl: 'https://proxy.scalar.com',
    plugins: [postResponseScriptsPlugin()],
  },
  true,
  undefined,
)

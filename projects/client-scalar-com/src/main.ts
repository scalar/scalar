import { createApiClientWeb } from '@scalar/api-client/layouts/Web'
import { postResponseScriptsPlugin } from '@scalar/scripts/plugins/post-response-scripts'
import '@scalar/api-client/style.css'
import '@scalar/scripts/style.css'

createApiClientWeb(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
  plugins: [postResponseScriptsPlugin()],
})

import { webHashRouter } from '@scalar/api-client'
import { ApiClientApp } from '@scalar/api-client/layouts/App'
import { createApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'

const app = createApp(ApiClientApp)

app.use(webHashRouter)
app.mount('#scalar-client')
// Initialize
await createApiClientApp(document.getElementById('scalar-client'), {
  spec: {
    url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  },
  proxyUrl: 'https://proxy.scalar.com',
})

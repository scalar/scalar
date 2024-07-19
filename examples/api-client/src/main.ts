import { router } from '@scalar/api-client'
import { ApiClientApp } from '@scalar/api-client/layouts/App'
import '@scalar/api-client/style.css'
import { createApp } from 'vue'

const app = createApp(ApiClientApp)

app.use(router)
app.mount('#scalar-client')

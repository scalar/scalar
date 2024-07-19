import App from '@/layouts/App/ApiClientApp.vue'
import { router } from '@/router'
import { createApp } from 'vue'

const app = createApp(App)

app.use(router)
app.mount('#scalar-client')

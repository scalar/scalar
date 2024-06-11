import { router } from '@/router'
import { createApp } from 'vue'

import App from './App.vue'

const app = createApp(App)

app.use(router)
app.mount('#app')

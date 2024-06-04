import { router } from '@/router'
import { createApp } from 'vue'

import App from './App.vue'
import './assets/reset.css'
import './assets/scrollbar.css'
import './assets/tailwind.css'
import './assets/variables.css'

const app = createApp(App)

app.use(router)
app.mount('#app')

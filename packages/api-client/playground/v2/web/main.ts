import '@/style.css'

import { createApiClientApp } from '@/v2/features/app'

const el = document.getElementById('scalar-client')

/** Initialize the API client application with the 'web' layout */
createApiClientApp(el, { layout: 'web' })

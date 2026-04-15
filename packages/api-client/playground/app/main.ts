import '@/style.css'

import { createApiClientApp } from '@/v2/features/app'

const el = document.getElementById('scalar-client')

/** This isn't in electron but basically fakes the desktop app in the web so its easier to work on */
createApiClientApp(el, { layout: 'desktop' })

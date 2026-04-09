import '@/style.css'

import { requestScriptsPlugin } from '@scalar/pre-post-request-scripts/plugins'

import { createApiClientApp } from '@/v2/features/app'

const el = document.getElementById('scalar-client')

/** Initialize the API client application with the 'web' layout */
void createApiClientApp(el, { layout: 'web', plugins: [requestScriptsPlugin()] })

import '@/style.css'

import { postResponseScriptsPlugin } from '@scalar/pre-post-request-scripts'

import { createApiClientApp } from '@/v2/features/app'

const el = document.getElementById('scalar-client')

/** Initialize the API client application with the 'web' layout */
createApiClientApp(el, { layout: 'web', plugins: [postResponseScriptsPlugin()] })

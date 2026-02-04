import { createApiClientWeb } from '@scalar/api-client/layouts/Web'
import '@scalar/api-client/style.css'
import './style.css'

import posthog from 'posthog-js'

posthog.init('phc_3elIjSOvGOo5aEwg6krzIY9IcQiRubsBtglOXsQ4Uu4', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2025-11-30',
})

void createApiClientWeb(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
})

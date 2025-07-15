import '../../src/style.css'
import { createApiClientWeb } from '../../src/layouts/Web'
// Import your spec.json file directly
import specContent from '../../../../spec.json'

createApiClientWeb(document.getElementById('scalar-client'), {
  proxyUrl: 'https://proxy.scalar.com',
  // Use the imported content directly
  content: specContent,
})

import type { RoutePayload } from '@scalar/api-client/modal'

import { useApiClient } from '../src/use-api-client'
import '../src/style.css'

const GALAXY_URL = 'https://registry.scalar.com/@scalar/apis/galaxy?format=json'

export const App = ({ initialRequest, url = GALAXY_URL }: { initialRequest: RoutePayload; url?: string }) => {
  const client = useApiClient({
    configuration: { url, proxyUrl: 'https://proxy.scalar.com' },
  })

  return <button onClick={() => client?.open(initialRequest)}>Click me to open the Api Client</button>
}

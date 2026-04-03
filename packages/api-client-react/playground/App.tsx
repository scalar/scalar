import type { RoutePayload } from '@scalar/api-client/v2/features/modal'

import { useApiClientModal } from '../src/useApiClientModal'
import '../src/style.css'

const GALAXY_URL = 'https://registry.scalar.com/@scalar/apis/galaxy?format=json'

export const App = ({ initialRequest }: { initialRequest?: RoutePayload }) => {
  const client = useApiClientModal({
    configuration: { url: GALAXY_URL },
    initialRequest,
  })

  return <button onClick={() => client?.open(initialRequest)}>Click me to open the Api Client</button>
}

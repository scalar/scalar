import type { RoutePayload } from '@scalar/api-client/v2/features/modal'

import { useApiClientModal } from '../src/ApiClientModalProvider'
import '../src/style.css'

export const App = ({ initialRequest }: { initialRequest?: RoutePayload }) => {
  const client = useApiClientModal()

  return <button onClick={() => client?.open(initialRequest)}>Click me to open the Api Client</button>
}

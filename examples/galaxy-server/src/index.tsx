import galaxy from '@scalar/galaxy/latest.yaml?raw'
import { createMockServer } from '@scalar/mock-server'

// Create the mocked routes
const app = await createMockServer({
  specification: galaxy,
})

export default app

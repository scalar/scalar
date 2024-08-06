import { createApiClientModal } from '@/layouts/Modal'

const { open } = await createApiClientModal(document.getElementById('app'), {
  spec: {
    content: `openapi: "3.0.1"
info:
  title: "Test OpenAPI definition"
  version: "1.0.0"
paths:
  /api/v1/updateEmployee:
    put:
      requestBody:
        content:
          application/json:
            schema:
              type: "array"
              items:
                $ref: "#/components/schemas/Employee"
components:
  schemas:
    Employee:
      type: "object"
      properties:
        id:
          type: "integer"
        manager:
          $ref: "#/components/schemas/Employee"
        team:
          type: "array"
          items:
            $ref: "#/components/schemas/Employee"`,
  },
  proxyUrl: 'https://proxy.scalar.com',
})

// Open the API client right-away
open()

document.getElementById('button')?.addEventListener('click', () => open())

// Or: Open a specific operation
// open({
//   method: 'GET',
//   path: '/me',
// })

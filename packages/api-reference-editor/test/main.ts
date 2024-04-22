import { mountApiReferenceEditable } from '@/api-reference-editor'

const { updateSpecValue } = mountApiReferenceEditable(
  '#scalar-api-reference-editor',
  { useExternalState: true },
  (v: string) => {
    updateSpecValue(v)
    console.log('input')
  },
)

setTimeout(
  () =>
    updateSpecValue(`openapi: 3.0.3
info:
  title: Swagger Petstore - OpenAPI 3.0
  version: 1.0.0
paths:
  /pet:
    put:
      tags:
        - pet
      summary: Update an existing pet
      description: Update an existing pet by Id
      operationId: updatePet
      parameters:
        - in: query
          name: coordinates
          content:
            application/json:
              schema:
                type: object
                required:
                  - lat
                  - long
                properties:
                  lat:
                    type: number
                  long:
                    type: number`),
  2000,
)

/**
 * A few OpenAPI documents to try in the playground: one that validates and two
 * that show the different kinds of error the validator reports.
 */
type Example = {
  name: string
  value: string
}

const valid = `openapi: 3.1.0
info:
  title: Example API
  version: 1.0.0
paths:
  /users/{id}:
    get:
      summary: Get a user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
`

// Missing the required top-level "info" object, which fails schema validation.
const missingInfo = `openapi: 3.1.0
paths: {}
`

// The path has no {id} segment, so the "id" path parameter fails the
// path-template semantic check (not expressible in the JSON schema).
const badPathParameter = `openapi: 3.1.0
info:
  title: Example API
  version: 1.0.0
paths:
  /users:
    get:
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
`

export const EXAMPLES: Example[] = [
  { name: 'Valid', value: valid },
  { name: 'Missing info', value: missingInfo },
  { name: 'Bad path parameter', value: badPathParameter },
]

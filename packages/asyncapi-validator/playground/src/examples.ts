/**
 * A few AsyncAPI documents to try in the playground: valid 3.x and 2.x
 * documents (the validator supports both), plus one that fails schema
 * validation.
 */
type Example = {
  name: string
  value: string
}

const valid = `asyncapi: 3.0.0
info:
  title: Account Service
  version: 1.0.0
channels:
  userSignedup:
    address: user/signedup
    messages:
      userSignedup:
        payload:
          type: object
          properties:
            displayName:
              type: string
            email:
              type: string
              format: email
operations:
  onUserSignedup:
    action: receive
    channel:
      $ref: '#/channels/userSignedup'
`

// AsyncAPI 2.x has a different channel shape, which the validator picks up from
// the "asyncapi" version field.
const validV2 = `asyncapi: 2.6.0
info:
  title: Account Service
  version: 1.0.0
channels:
  user/signedup:
    subscribe:
      message:
        payload:
          type: object
          properties:
            displayName:
              type: string
`

// Missing the required top-level "info" object, which fails schema validation.
const missingInfo = `asyncapi: 3.0.0
channels: {}
`

export const EXAMPLES: Example[] = [
  { name: 'Valid', value: valid },
  { name: 'AsyncAPI 2.6', value: validV2 },
  { name: 'Missing info', value: missingInfo },
]

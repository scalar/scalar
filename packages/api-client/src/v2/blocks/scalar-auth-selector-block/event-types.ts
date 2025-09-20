export type UpdateSecuritySchemeEvent =
  | {
      type: 'http'
      payload: Partial<{
        token: string
        username: string
        password: string
      }>
    }
  | {
      type: 'apiKey'
      payload: Partial<{
        name: string
        value: string
      }>
    }
  | {
      type: 'oauth2'
      flow: 'implicit' | 'password' | 'clientCredentials' | 'authorizationCode'
      payload: Partial<{
        authUrl: string
        tokenUrl: string
        token: string
        redirectUrl: string
        clientId: string
        clientSecret: string
        usePkce: 'no' | 'SHA-256' | 'plain'
        username: string
        password: string
      }>
    }

import galaxyAsyncApiDocument from '@scalar/galaxy/asyncapi/3.0.json'

/** Use only the deployed server so localhost's anonymous security cannot authorize public sockets. */
export const asyncApiDocument = {
  ...galaxyAsyncApiDocument,
  servers: { production: galaxyAsyncApiDocument.servers.production },
}

/** Point the served document at this deployment, including local development and PR previews. */
export const getAsyncApiDocument = (url: string): typeof asyncApiDocument => {
  const origin = new URL(url)
  const document = structuredClone(asyncApiDocument)
  document.servers.production.host = origin.host
  document.servers.production.protocol = origin.protocol === 'https:' ? 'wss' : 'ws'

  for (const flow of Object.values(document.components.securitySchemes.oauth2.flows)) {
    flow.authorizationUrl = new URL('/oauth/authorize', origin).href
    if ('tokenUrl' in flow) {
      flow.tokenUrl = new URL('/oauth/token', origin).href
      flow.refreshUrl = flow.tokenUrl
    }
  }

  return document
}

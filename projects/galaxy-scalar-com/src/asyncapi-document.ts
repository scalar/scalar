import galaxyAsyncApiDocument from '@scalar/galaxy/asyncapi/3.0.json'

/** Use only the deployed server so localhost's anonymous security cannot authorize public sockets. */
export const asyncApiDocument = {
  ...galaxyAsyncApiDocument,
  servers: { production: galaxyAsyncApiDocument.servers.production },
}

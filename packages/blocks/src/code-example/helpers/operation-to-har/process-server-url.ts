import { getResolvedUrl } from '@scalar/workspace-store/request-example'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

/** Resolves server variable defaults before joining the operation path. */
export const processServerUrl = (server: ServerObject | null, path: string): string =>
  server?.url ? getResolvedUrl({ server, path }) : path

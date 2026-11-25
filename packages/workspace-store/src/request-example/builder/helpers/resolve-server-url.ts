import { replacePathVariables } from '@scalar/helpers/regex/replace-variables'

import type { ServerObject } from '@/schemas/v3.2/strict/server'

import { getServerVariables } from './get-server-variables'

/** Substitutes OpenAPI server variable defaults in the selected server URL. */
export const resolveServerUrl = (server: ServerObject | null): string =>
  replacePathVariables(server?.url ?? '', getServerVariables(server))

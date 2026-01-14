import { replaceVariables } from '@scalar/helpers/regex/replace-variables'
import { mergeUrls } from '@scalar/helpers/url/merge-urls'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import { getEnvironmentVariables } from '@/v2/blocks/operation-block/helpers/get-environment-variables'
import { getServerUrl } from '@/v2/blocks/operation-block/helpers/get-server-url'

export const getResolvedUrl = (environment: XScalarEnvironment, server: ServerObject | null, path: string) => {
  const environmentVariables = getEnvironmentVariables(environment)
  const serverUrl = getServerUrl(server, environmentVariables)
  const pathWithVariables = replaceVariables(path, environmentVariables)
  return mergeUrls(serverUrl, pathWithVariables)
}

import { isHttpMethod } from '@scalar/helpers/http/is-http-method'

import type { ImportEventData } from '@/features/import-listener/types'

import { getUrlQueryParameter } from './get-url-query-parameter'

type ImportFromQueryOptions = {
  darkMode: boolean
}

const getImportOperationFromQuery = (): Pick<ImportEventData, 'operationPath' | 'operationMethod'> | undefined => {
  const operationPath = getUrlQueryParameter('operation_path')
  const operationMethodRaw = getUrlQueryParameter('operation_method')

  if (!operationPath?.length || !operationMethodRaw?.length) {
    return undefined
  }

  const operationMethod = operationMethodRaw.toLowerCase()

  if (!isHttpMethod(operationMethod)) {
    return undefined
  }

  return {
    operationPath,
    operationMethod,
  }
}

/**
 * Reads import-related URL query parameters (document URL, logos, operation target)
 * set when opening the client from API Reference or other integrations.
 */
export const getImportFromQuery = ({ darkMode }: ImportFromQueryOptions): ImportEventData | undefined => {
  const source = getUrlQueryParameter('url')

  if (!source?.length) {
    return undefined
  }

  const companyLogo = darkMode ? getUrlQueryParameter('dark_logo') : getUrlQueryParameter('light_logo')

  const operation = getImportOperationFromQuery()

  return {
    type: 'url',
    source,
    companyLogo,
    ...operation,
  }
}

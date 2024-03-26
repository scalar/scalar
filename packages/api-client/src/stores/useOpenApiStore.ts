import type { TransformedOperation } from '@scalar/oas-utils'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { reactive } from 'vue'

export type OpenApiState = {
  operation: TransformedOperation
  globalSecurity:
    | OpenAPIV3.SecurityRequirementObject[]
    | OpenAPIV3_1.SecurityRequirementObject[]
}

export const createEmptyOpenApiState = (): OpenApiState => ({
  // @ts-ignore
  operation: {},
  globalSecurity: [],
})

const openApi = reactive<OpenApiState>(createEmptyOpenApiState())

const setOperation = (newOperation: TransformedOperation | undefined) => {
  Object.assign(openApi, {
    ...openApi,
    operation: newOperation,
  })
}

const setGlobalSecurity = (
  newGlobalSecurity: OpenAPIV3_1.SecurityRequirementObject[] | undefined,
) => {
  Object.assign(openApi, {
    ...openApi,
    globalSecurity: newGlobalSecurity,
  })
}

export const useOpenApiStore = () => ({
  openApi,
  setOperation,
  setGlobalSecurity,
})

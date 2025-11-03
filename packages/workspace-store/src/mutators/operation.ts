import type { HttpMethod } from '@scalar/helpers/http/http-methods'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@/schemas'

export const updateOperationDescription = ({
  document,
  meta,
  payload: { description },
}: {
  document: WorkspaceDocument | null
  payload: { description: string }
  meta: {
    method: HttpMethod
    path: string
  }
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method as HttpMethod])

  if (!operation) {
    return
  }

  operation.description = description
}

export type Meta = {
  meta: {
    method: HttpMethod
    path: string
    exampleKey: string
  }
}

export const addOperationParameter = ({
  document,
  meta,
  payload,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  payload: {
    key: string
    value: string
    isEnabled: boolean
  }
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Initialize parameters array if it doesn't exist
  if (!operation.parameters) {
    operation.parameters = []
  }

  // Add the new parameter
  operation.parameters.push({
    name: payload.key,
    in: type,
    required: type === 'path' ? true : false,
    examples: {
      [meta.exampleKey]: {
        value: payload.value,
        'x-disabled': !payload.isEnabled,
      },
    },
  })
}

export const updateOperationParameter = ({
  document,
  meta,
  payload,
  index,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  index: number
  payload: Partial<{
    key: string
    value: string
    isEnabled: boolean
  }>
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Get all resolved parameters of the specified type
  // The passed index corresponds to this filtered list
  const resolvedParameters = operation.parameters?.map((it) => getResolvedRef(it)).filter((it) => it.in === type) ?? []
  const parameter = resolvedParameters[index]

  // Don't proceed if parameter doesn't exist
  if (!parameter) {
    return
  }

  parameter.name = payload.key ?? parameter.name ?? ''

  // TODO: handle content-type parameters
  if ('examples' in parameter) {
    if (!parameter.examples) {
      parameter.examples = {}
    }

    const example = getResolvedRef(parameter.examples[meta.exampleKey])

    if (!example) {
      return
    }

    example.value = payload.value ?? example?.value ?? ''
    example['x-disabled'] = payload.isEnabled === undefined ? example['x-disabled'] : !payload.isEnabled
  }
}

export const deleteOperationParameter = ({
  document,
  meta,
  index,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
  index: number
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Translate the index from the filtered list to the actual parameters array
  const resolvedParameters = operation.parameters?.map((it) => getResolvedRef(it)).filter((it) => it.in === type) ?? []
  const parameter = resolvedParameters[index]

  // Don't proceed if parameter doesn't exist
  if (!parameter) {
    return
  }

  const actualIndex = operation.parameters?.findIndex((it) => getResolvedRef(it) === parameter) as number

  // Remove the parameter from the operation
  operation.parameters?.splice(actualIndex, 1)
}

export const deleteAllOperationParameters = ({
  document,
  meta,
  type,
}: {
  document: WorkspaceDocument | null
  type: 'header' | 'path' | 'query' | 'cookie'
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  // Filter out parameters of the specified type
  operation.parameters = operation.parameters?.filter((it) => getResolvedRef(it).in !== type) ?? []
}

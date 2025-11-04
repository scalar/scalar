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

export const updateOperationMethod = ({
  document,
  meta,
  payload: { method },
}: {
  document: WorkspaceDocument | null
  payload: { method: HttpMethod }
  meta: {
    method: HttpMethod
    path: string
  }
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  if (!operation) {
    return
  }

  operation['x-scalar-method'] = method
}

export const updateOperationPath = ({
  document,
  meta,
  payload: { path },
}: {
  document: WorkspaceDocument | null
  payload: { path: string }
  meta: {
    method: HttpMethod
    path: string
  }
}) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  if (!operation) {
    return
  }

  operation['x-scalar-path'] = path

  // Extract the path variables from the path
  const pathVariables = Array.from(path.matchAll(/{([^\/}]+)}/g), (m) => m[1])

  // now we need to update the operation path variables
  const pathVariablesWithoutPathParameters = operation.parameters?.filter((it) => getResolvedRef(it).in !== 'path')

  operation.parameters = [
    ...(pathVariablesWithoutPathParameters ?? []),
    ...pathVariables.map((it) => ({
      name: it ?? '',
      in: 'path' as const,
      required: true,
    })),
  ]
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

export const updateOperationRequestBodyContentType = ({
  document,
  meta,
  payload,
}: {
  document: WorkspaceDocument | null
  payload: {
    contentType: string
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

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!['x-scalar-selected-content-type']) {
    requestBody!['x-scalar-selected-content-type'] = {}
  }

  requestBody!['x-scalar-selected-content-type'][meta.exampleKey] = payload.contentType
}

export const updateOperationRequestBodyExample = ({
  document,
  meta,
  payload,
}: {
  document: WorkspaceDocument | null
  payload: {
    value: string | File | undefined
    contentType: string
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

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!.content[payload.contentType]) {
    requestBody!.content[payload.contentType] = {
      examples: {},
    }
  }

  // Ensure examples object exists and get a resolved reference
  const mediaType = requestBody!.content[payload.contentType]!
  mediaType.examples ??= {}
  const examples = getResolvedRef(mediaType.examples)!

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example) {
    examples[meta.exampleKey] = {
      value: payload.value,
    }
    return
  }

  example.value = payload.value
}

export const addOperationRequestBodyFormRow = ({
  document,
  meta,
  payload,
  contentType,
}: {
  document: WorkspaceDocument | null
  payload: Partial<{ key: string; value?: string | File }>
  contentType: string
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!.content[contentType]) {
    requestBody!.content[contentType] = {
      examples: {},
    }
  }

  if (!requestBody!.content[contentType]!.examples) {
    requestBody!.content[contentType]!.examples = {}
  }

  const examples = getResolvedRef(requestBody!.content[contentType]!.examples)

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example || !Array.isArray(example.value)) {
    examples[meta.exampleKey] = {
      value: [
        {
          name: payload.key,
          value: payload.value,
        },
      ],
    }
    return
  }

  // Add the new row to the example
  example.value.push({
    name: payload.key ?? '',
    value: payload.value ?? '',
  })
}

export const updateOperationRequestBodyFormRow = ({
  document,
  meta,
  index,
  payload,
  contentType,
}: {
  document: WorkspaceDocument | null
  index: number
  payload: Partial<{ key: string; value: string | File | null }>
  contentType: string
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  let requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    operation.requestBody = {
      content: {},
    }
    requestBody = getResolvedRef(operation.requestBody)
  }

  if (!requestBody!.content[contentType]) {
    return
  }

  const examples = getResolvedRef(requestBody!.content[contentType]!.examples)

  if (!examples) {
    return
  }

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example || !Array.isArray(example.value)) {
    return
  }

  example.value[index] = {
    name: payload.key ?? example.value[index]?.name ?? '',
    value: payload.value === null ? undefined : (payload.value ?? example.value[index]?.value ?? ''),
  }
}

export const deleteOperationRequestBodyFormRow = ({
  document,
  meta,
  index,
  contentType,
}: {
  document: WorkspaceDocument | null
  index: number
  contentType: string
} & Meta) => {
  if (!document) {
    return
  }

  const operation = getResolvedRef(document.paths?.[meta.path]?.[meta.method])

  // Don't proceed if operation doesn't exist
  if (!operation) {
    return
  }

  const requestBody = getResolvedRef(operation.requestBody)

  if (!requestBody) {
    return
  }

  if (!requestBody.content[contentType]) {
    return
  }

  const examples = getResolvedRef(requestBody.content[contentType]!.examples)

  if (!examples) {
    return
  }

  const example = getResolvedRef(examples[meta.exampleKey])

  if (!example || !Array.isArray(example.value)) {
    return
  }

  console.log('deleteOperationRequestBodyFormRow', { index, contentType, meta })
  example.value.splice(index, 1)

  if (example.value.length === 0) {
    delete requestBody.content[contentType]!.examples![meta.exampleKey]
  }
}

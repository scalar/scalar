import type { WorkspaceStore } from '@/client'
import type { OperationEvents } from '@/events/definitions/operation'
import { getPathItemOperation } from '@/helpers/for-each-path-item-operation'
import { getExampleValue } from '@/helpers/get-example-value'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { snapshotSchema } from '@/helpers/snapshot-schema'
import { getSchemaExampleFromBody } from '@/request-example/builder/body/get-request-body-example'
import { getExample } from '@/request-example/builder/helpers/get-example'
import { isOpenApiDocument } from '@/schemas/type-guards'
import type { ExampleObject } from '@/schemas/v3.2/strict/openapi-document'

/** Restore a single body without reverting headers, authentication, or other examples. */
export const resetOperationRequestBody = async (
  store: WorkspaceStore | null,
  {
    documentName,
    meta,
    contentType,
    requestBodyCompositionSelection,
    openapiVersion,
  }: OperationEvents['operation:reset:requestBody'],
): Promise<void> => {
  const document = store?.workspace.documents[documentName]
  if (!store || !isOpenApiDocument(document) || contentType === 'none') {
    return
  }
  const operation = getResolvedRef(getPathItemOperation(document.paths?.[meta.path], meta.method))
  const body = getResolvedRef(operation?.requestBody)
  if (!operation || !body) {
    return
  }
  const editedValue = getExampleValue(getExample(body, meta.exampleKey, contentType))?.value
  const original = await store.getResolvedOriginalDocument(documentName)
  if (!isOpenApiDocument(original)) {
    return
  }
  const originalOperation = getResolvedRef(getPathItemOperation(original.paths?.[meta.path], meta.method))
  const originalBody = getResolvedRef(originalOperation?.requestBody)
  const originalExample = originalBody && getExample(originalBody, meta.exampleKey, contentType)
  const restored: ExampleObject =
    getExampleValue(originalExample) || originalExample?.externalValue
      ? snapshotSchema(originalExample!)
      : { value: getSchemaExampleFromBody(body, contentType, requestBodyCompositionSelection, openapiVersion) ?? '' }

  // Loading a baseline can resolve remote references. Do not discard typing that happened while
  // it loaded, or write into a document that has since been replaced or removed.
  if (
    store.workspace.documents[documentName] !== document ||
    getResolvedRef(operation.requestBody) !== body ||
    getExampleValue(getExample(body, meta.exampleKey, contentType))?.value !== editedValue
  ) {
    return
  }
  const media = body.content[contentType]
  const current = getResolvedRef(media?.examples?.[meta.exampleKey])
  const selectedExample = media?.examples?.[meta.exampleKey]
  const hasSharedReference =
    (operation.requestBody && '$ref' in operation.requestBody) || (selectedExample && '$ref' in selectedExample)
  // Keep ordinary examples in place: configured overrides use stable proxies whose nested
  // targets must be updated rather than replaced. Shared references are detached below.
  const example: ExampleObject = current && !hasSharedReference ? current : { ...current }
  delete example.value
  delete example.dataValue
  delete example.serializedValue
  delete example.externalValue
  for (const field of ['value', 'dataValue', 'serializedValue', 'externalValue'] as const) {
    if (field in restored) {
      Object.assign(example, { [field]: restored[field] })
    }
  }
  if (current && !hasSharedReference) {
    return
  }
  // Detach the selected body and example from shared references before writing. Resetting one
  // operation must not restore another operation that happens to reference the same component.
  operation.requestBody = {
    ...body,
    content: {
      ...body.content,
      [contentType]: { ...media, examples: { ...media?.examples, [meta.exampleKey]: example } },
    },
  }
}

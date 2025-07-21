import type { FuseData } from '@/features/Search/types'
import type { TraversedEntry } from '@/features/traverse-schema'

export function createSearchIndex(
  entries: TraversedEntry[],
  {
    hideModels = false,
  }: {
    hideModels?: boolean
  },
): FuseData[] {
  const index: FuseData[] = []

  // // Headings from the description
  // const headingsData: FuseData[] = []
  // const headings = getHeadingsFromMarkdown(newSpec?.info?.description ?? '')

  // if (headings.length) {
  //   headings.forEach((heading) => {
  //     headingsData.push({
  //       type: 'heading',
  //       title: heading.value,
  //       description: 'Introduction',
  //       // href: `#${getHeadingId(heading)}`,
  //       tag: heading.slug,
  //       body: '',
  //     })
  //   })

  //   index.concat(headingsData)
  // }

  // // Tags
  // if (newSpec?.tags?.length) {
  //   newSpec?.tags?.forEach((tag) => {
  //     const tagData: FuseData = {
  //       title: tag['x-displayName'] ?? tag.name,
  //       // href: `#${getTagId(tag)}`,
  //       description: tag.description,
  //       type: 'tag',
  //       tag: tag.name,
  //       body: '',
  //     }

  //     index.push(tagData)

  //     if (tag.operations) {
  //       tag.operations.forEach((operation) => {
  //         const parameterMap = createParameterMap(operation.information)
  //         const bodyData = extractRequestBody(operation.information) || parameterMap
  //         let body = null
  //         if (typeof bodyData !== 'boolean') {
  //           body = bodyData
  //         }

  //         const operationData: FuseData = {
  //           type: 'req',
  //           title: operation.name ?? operation.path,
  //           href: `#${operation.id}`,
  //           operationId: operation.information?.operationId,
  //           description: operation.description ?? '',
  //           httpVerb: operation.httpVerb,
  //           path: operation.path,
  //           tag: tag.name,
  //           operation,
  //         }

  //         if (body) {
  //           operationData.body = body
  //         }

  //         index.push(operationData)
  //       })
  //     }
  //   })
  // }

  // // Handle paths with no tags - super hacky but we'll fix it on new store
  // // @ts-expect-error not sure why spec doesn't have paths, but at this point I'm too afraid to ask
  // else if (newSpec?.paths) {
  //   const paths = (newSpec as OpenAPIV3_1.Document).paths

  //   Object.keys(paths ?? {}).forEach((path) => {
  //     Object.keys(paths?.[path] ?? {}).forEach((method) => {
  //       const operation = paths?.[path]?.[method]

  //       if (isHttpMethod(method) && operation) {
  //         const parameterMap = createParameterMap(operation)
  //         const bodyData = extractRequestBody(operation) || parameterMap
  //         let body = null
  //         if (typeof bodyData !== 'boolean') {
  //           body = bodyData
  //         }

  //         const operationData: FuseData = {
  //           type: 'req',
  //           title: operation.name ?? operation.path,
  //           href: `#${operation.id}`,
  //           operationId: operation.information?.operationId,
  //           description: operation.description ?? '',
  //           httpVerb: operation.httpVerb,
  //           path: operation.path,
  //           operation,
  //         }

  //         if (body) {
  //           operationData.body = body
  //         }

  //         index.push(operationData)
  //       }
  //     })
  //   })
  // }

  // // Webhooks
  // const webhooks = newSpec?.webhooks
  // const webhookData: FuseData[] = []

  // if (webhooks) {
  //   webhooks.forEach((webhook) => {
  //     webhookData.push({
  //       type: 'webhook',
  //       title: `${webhook.name}`,
  //       href: `#${webhook.id}`,
  //       description: 'Webhook',
  //       httpVerb: webhook.httpVerb,
  //       tag: webhook.name,
  //       body: '',
  //     })

  //     index.concat(webhookData)
  //   })
  // }

  // // Schemas
  // const schemas = hideModels ? {} : getModels(newSpec as OpenAPIV3_1.Document)
  // const modelData: FuseData[] = []

  // if (schemas) {
  //   Object.keys(schemas).forEach((k) => {
  //     modelData.push({
  //       type: 'model',
  //       title: `${(schemas[k] as any).title ?? k}`,
  //       href: `#${getModelId({ name: k })}`,
  //       description: 'Model',
  //       tag: k,
  //       body: '',
  //     })
  //   })

  //   index.concat(modelData)
  // }

  return index
}

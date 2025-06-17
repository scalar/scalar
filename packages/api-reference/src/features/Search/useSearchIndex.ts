import type { OpenAPIV3_1, Spec, TransformedOperation } from '@scalar/types/legacy'
import Fuse, { type FuseResult } from 'fuse.js'
import { type Ref, computed, ref, watch } from 'vue'

import { useNavState } from '@/hooks/useNavState'
import { type ParamMap, useOperation } from '@/hooks/useOperation'
import { getHeadingsFromMarkdown } from '@/libs/markdown'
import { extractRequestBody, getModels } from '@/libs/openapi'
import { useConfig } from '@/hooks/useConfig'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'

export type EntryType = 'req' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  title: string
  href: string
  type: EntryType
  operationId?: string
  description: string
  body?: string | string[] | ParamMap
  httpVerb?: string
  path?: string
  tag?: string
  operation?: TransformedOperation
}

/**
 * Creates the search index from an OpenAPI document.
 */
export function useSearchIndex({
  specification,
}: {
  specification: Ref<Spec>
}) {
  const { getHeadingId, getModelId, getTagId } = useNavState()
  const config = useConfig()

  const fuseDataArray = ref<FuseData[]>([])
  const searchResults = ref<FuseResult<FuseData>[]>([])
  const selectedSearchIndex = ref<number>()
  const searchText = ref<string>('')

  const fuse = new Fuse(fuseDataArray.value, {
    keys: ['title', 'description', 'body'],
  })

  const fuseSearch = (): void => {
    selectedSearchIndex.value = 0
    searchResults.value = fuse.search(searchText.value)
  }

  watch(searchText, (newValue) => {
    if (newValue.length) {
      fuseSearch()
    } else {
      searchResults.value = []
    }
  })

  function resetSearch(): void {
    searchText.value = ''
    selectedSearchIndex.value = undefined
    searchResults.value = []
  }

  const searchResultsWithPlaceholderResults = computed<FuseResult<FuseData>[]>((): FuseResult<FuseData>[] => {
    // Rendering a lot of items is slow, so we limit the results.
    const LIMIT = 25

    if (searchText.value.length === 0) {
      return fuseDataArray.value.slice(0, LIMIT).map((item) => {
        return {
          item: item,
        } as FuseResult<FuseData>
      })
    }

    return searchResults.value.slice(0, LIMIT)
  })

  const selectedSearchResult = computed<FuseResult<FuseData> | undefined>(() =>
    typeof selectedSearchIndex.value === 'number'
      ? searchResultsWithPlaceholderResults.value[selectedSearchIndex.value]
      : undefined,
  )

  watch(
    specification,
    (newSpec) => {
      fuseDataArray.value = []

      // Headings from the description
      const headingsData: FuseData[] = []
      const headings = getHeadingsFromMarkdown(newSpec?.info?.description ?? '')

      if (headings.length) {
        headings.forEach((heading) => {
          headingsData.push({
            type: 'heading',
            title: `Info > ${heading.value}`,
            description: '',
            href: `#${getHeadingId(heading)}`,
            tag: heading.slug,
            body: '',
          })
        })

        fuseDataArray.value = fuseDataArray.value.concat(headingsData)
      }

      // Tags
      if (newSpec?.tags?.length) {
        newSpec?.tags?.forEach((tag) => {
          const tagData: FuseData = {
            title: tag['x-displayName'] ?? tag.name,
            href: `#${getTagId(tag)}`,
            description: tag.description,
            type: 'tag',
            tag: tag.name,
            body: '',
          }

          fuseDataArray.value.push(tagData)

          if (tag.operations) {
            tag.operations.forEach((operation) => {
              const { parameterMap } = useOperation(operation)
              const bodyData = extractRequestBody(operation) || parameterMap.value
              let body = null
              if (typeof bodyData !== 'boolean') {
                body = bodyData
              }

              const operationData: FuseData = {
                type: 'req',
                title: operation.name ?? operation.path,
                href: `#${operation.id}`,
                operationId: operation.information?.operationId,
                description: operation.description ?? '',
                httpVerb: operation.httpVerb,
                path: operation.path,
                tag: tag.name,
                operation,
              }

              if (body) {
                operationData.body = body
              }

              fuseDataArray.value.push(operationData)
            })
          }
        })
      }
      // Handle paths with no tags - super hacky but we'll fix it on new store
      // @ts-expect-error not sure why spec doesn't have paths, but at this point I'm too afraid to ask
      else if (newSpec?.paths) {
        const paths = (newSpec as OpenAPIV3_1.Document).paths

        Object.keys(paths ?? {}).forEach((path) => {
          Object.keys(paths?.[path] ?? {}).forEach((method) => {
            const operation = paths?.[path]?.[method]

            if (isHttpMethod(method) && operation) {
              const { parameterMap } = useOperation({ ...operation, information: operation })
              const bodyData = extractRequestBody(operation) || parameterMap.value
              let body = null
              if (typeof bodyData !== 'boolean') {
                body = bodyData
              }

              const operationData: FuseData = {
                type: 'req',
                title: operation.name ?? operation.path,
                href: `#${operation.id}`,
                operationId: operation.information?.operationId,
                description: operation.description ?? '',
                httpVerb: operation.httpVerb,
                path: operation.path,
                operation,
              }

              if (body) {
                operationData.body = body
              }

              fuseDataArray.value.push(operationData)
            }
          })
        })
      }

      // Adding webhooks
      const webhooks = newSpec?.webhooks
      const webhookData: FuseData[] = []

      if (webhooks) {
        webhooks.forEach((webhook) => {
          webhookData.push({
            type: 'webhook',
            title: 'Webhook',
            href: `#${webhook.id}`,
            description: `${webhook.name}`,
            httpVerb: webhook.httpVerb,
            tag: webhook.name,
            body: '',
          })

          fuseDataArray.value = fuseDataArray.value.concat(webhookData)
        })
      }

      // Adding models as well
      const schemas = config.value.hideModels ? {} : getModels(newSpec)
      const modelData: FuseData[] = []

      if (schemas) {
        Object.keys(schemas).forEach((k) => {
          modelData.push({
            type: 'model',
            title: 'Model',
            href: `#${getModelId({ name: k })}`,
            description: (schemas[k] as any).title ?? k,
            tag: k,
            body: '',
          })
        })

        fuseDataArray.value = fuseDataArray.value.concat(modelData)
      }

      fuse.setCollection(fuseDataArray.value)
    },
    { immediate: true },
  )

  return {
    resetSearch,
    fuseSearch,
    selectedSearchIndex,
    selectedSearchResult,
    searchResultsWithPlaceholderResults,
    searchText,
  }
}

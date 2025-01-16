import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, TransformedOperation } from '@scalar/types/legacy'
import Fuse, { type FuseResult } from 'fuse.js'
import { type Ref, computed, ref, watch } from 'vue'

import { getHeadingsFromMarkdown, getModels } from '../../helpers'
import { extractRequestBody } from '../../helpers/specHelpers'
import {
  type ParamMap,
  useNavState,
  useOperation,
  useSidebar,
} from '../../hooks'

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
  const { getHeadingId, getWebhookId, getModelId, getOperationId, getTagId } =
    useNavState()

  const { hideModels } = useSidebar()

  const fuseDataArray = ref<FuseData[]>([])
  const searchResults = ref<FuseResult<FuseData>[]>([])
  const selectedSearchResult = ref<number>(0)
  const searchText = ref<string>('')

  const fuse = new Fuse(fuseDataArray.value, {
    keys: ['title', 'description', 'body'],
  })

  const fuseSearch = (): void => {
    selectedSearchResult.value = 0
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
    selectedSearchResult.value = 0
    searchResults.value = []
  }

  const searchResultsWithPlaceholderResults = computed<FuseResult<FuseData>[]>(
    (): FuseResult<FuseData>[] => {
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
    },
  )

  watch(
    specification.value,
    async () => {
      fuseDataArray.value = []

      // Likely an incomplete/invalid spec
      // TODO: Or just an OpenAPI document without tags and webhooks?
      if (
        !specification.value?.tags?.length &&
        !specification.value?.webhooks?.length
      ) {
        fuse.setCollection([])
        return
      }

      // Headings from the description
      const headingsData: FuseData[] = []
      const headings = getHeadingsFromMarkdown(
        specification.value?.info?.description ?? '',
      )

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
      specification.value?.tags?.forEach((tag) => {
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
              href: `#${getOperationId(operation, tag)}`,
              operationId: operation.operationId,
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

      // Adding webhooks
      const webhooks = specification.value?.webhooks
      const webhookData: FuseData[] = []

      if (webhooks) {
        Object.keys(webhooks).forEach((name) => {
          const httpVerbs = Object.keys(
            webhooks[name],
          ) as OpenAPIV3_1.HttpMethods[]

          httpVerbs.forEach((httpVerb) => {
            webhookData.push({
              type: 'webhook',
              title: `Webhook: ${webhooks[name][httpVerb]?.name}`,
              href: `#${getWebhookId({ name, method: httpVerb })}`,
              description: name,
              httpVerb,
              tag: name,
              body: '',
            })
          })

          fuseDataArray.value = fuseDataArray.value.concat(webhookData)
        })
      }

      // Adding models as well
      const schemas = hideModels.value ? {} : getModels(specification.value)
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
    selectedSearchResult,
    searchResultsWithPlaceholderResults,
    searchText,
  }
}

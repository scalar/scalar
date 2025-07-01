import { useNavState } from '@/hooks/useNavState'
import { getHeadingsFromMarkdown } from '@/libs/markdown'
import { type ParameterMap, createParameterMap, extractRequestBody, getModels } from '@/libs/openapi'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { OpenAPIV3_1, Spec, TransformedOperation } from '@scalar/types/legacy'
import Fuse, { type FuseResult } from 'fuse.js'
import { type Ref, computed, ref, watch } from 'vue'

const MAX_SEARCH_RESULTS = 25

export type EntryType = 'req' | 'webhook' | 'model' | 'heading' | 'tag'

export type FuseData = {
  title: string
  href: string
  type: EntryType
  operationId?: string
  description: string
  body?: string | string[] | ParameterMap
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
  hideModels = false,
}: {
  specification: Ref<Spec>
  hideModels?: boolean
}) {
  const { getHeadingId, getModelId, getTagId } = useNavState()

  const fuseDataArray = ref<FuseData[]>([])
  const searchResults = ref<FuseResult<FuseData>[]>([])
  const selectedSearchIndex = ref<number>()
  const searchText = ref<string>('')

  const fuse = new Fuse(fuseDataArray.value, {
    // Define searchable fields with weights to prioritize more important matches
    keys: [
      // Highest weight - titles are most descriptive
      { name: 'title', weight: 0.7 },
      // Medium weight - helpful but often verbose
      { name: 'description', weight: 0.3 },
      // Lowest weight - can be very long and noisy
      { name: 'body', weight: 0.2 },
      // High weight - unique identifiers for operations
      { name: 'operationId', weight: 0.6 },
      // Good weight - endpoint paths are searchable
      { name: 'path', weight: 0.5 },
      // Medium-high weight - helps with categorization
      { name: 'tag', weight: 0.4 },
      // Medium weight - useful for filtering by method
      { name: 'httpVerb', weight: 0.3 },
    ],

    // Threshold controls how strict the matching is (0.0 = perfect match, 1.0 = very loose)
    // 0.3 allows for some typos and partial matches while maintaining relevance
    threshold: 0.3,

    // Maximum distance between characters that can be matched
    // Higher values allow matches even when characters are far apart in long text
    distance: 100,

    // Include the match score in results for debugging and potential UI enhancements
    includeScore: true,

    // Include detailed match information showing which parts of the text matched
    includeMatches: true,

    // Minimum number of characters that must match to be considered a result
    // Prevents single-character matches that are usually noise
    minMatchCharLength: 2,

    // Don't require matches to be at the beginning of strings
    // Makes search more flexible and user-friendly
    ignoreLocation: true,

    // Enable advanced search syntax like 'exact' for exact matches or !exclude for exclusions
    useExtendedSearch: true,

    // Find all possible matches in each item, not just the first one
    // Ensures comprehensive search results
    findAllMatches: true,
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
    if (searchText.value.length === 0) {
      return fuseDataArray.value.slice(0, MAX_SEARCH_RESULTS).map((item) => {
        return {
          item: item,
        } as FuseResult<FuseData>
      })
    }

    return searchResults.value.slice(0, MAX_SEARCH_RESULTS)
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
            title: heading.value,
            description: 'Introduction',
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
              const parameterMap = createParameterMap(operation.information)
              const bodyData = extractRequestBody(operation.information) || parameterMap
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
              const parameterMap = createParameterMap(operation)
              const bodyData = extractRequestBody(operation) || parameterMap
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

      // Webhooks
      const webhooks = newSpec?.webhooks
      const webhookData: FuseData[] = []

      if (webhooks) {
        webhooks.forEach((webhook) => {
          webhookData.push({
            type: 'webhook',
            title: `${webhook.name}`,
            href: `#${webhook.id}`,
            description: 'Webhook',
            httpVerb: webhook.httpVerb,
            tag: webhook.name,
            body: '',
          })

          fuseDataArray.value = fuseDataArray.value.concat(webhookData)
        })
      }

      // Schemas
      const schemas = hideModels ? {} : getModels(newSpec as OpenAPIV3_1.Document)
      const modelData: FuseData[] = []

      if (schemas) {
        Object.keys(schemas).forEach((k) => {
          modelData.push({
            type: 'model',
            title: `${(schemas[k] as any).title ?? k}`,
            href: `#${getModelId({ name: k })}`,
            description: 'Model',
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

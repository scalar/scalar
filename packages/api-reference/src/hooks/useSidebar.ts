import { useApiClientStore } from '@scalar/api-client'
import { objectEntries } from '@vueuse/core'
import { type OpenAPIV3_1 } from 'openapi-types'
import { computed, reactive, ref, watch } from 'vue'

import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  hasModels,
  hasWebhooks,
  openClientFor,
} from '../helpers'
import type { Spec, Tag, TransformedOperation } from '../types'
import { useNavState } from './useNavState'

export type SidebarEntry = {
  id: string
  title: string
  children?: SidebarEntry[]
  select?: () => void
  httpVerb?: string
  show: boolean
  deprecated?: boolean
}

const {
  getHeadingId,
  getWebhookId,
  getModelId,
  getOperationId,
  getTagId,
  hash,
} = useNavState(false)

// Track the parsed spec
const parsedSpec = ref<Spec | undefined>(undefined)

// Track which sidebar items are collapsed
type CollapsedSidebarItems = Record<string, boolean>

const collapsedSidebarItems = reactive<CollapsedSidebarItems>({})

function toggleCollapsedSidebarItem(key: string) {
  collapsedSidebarItems[key] = !collapsedSidebarItems[key] ?? true
}

function setCollapsedSidebarItem(key: string, value: boolean) {
  collapsedSidebarItems[key] = value
}

// Track headings in the spec description
const headings = ref<any[]>([])

const updateHeadings = async (description: string) => {
  const newHeadings = await getHeadingsFromMarkdown(description)
  const lowestLevel = getLowestHeadingLevel(newHeadings)

  return newHeadings.filter((heading) => heading.depth === lowestLevel)
}

// Create the list of sidebar items from the given spec
const items = computed(() => {
  // Check whether the API client is visible
  const { state } = useApiClientStore()
  const titlesById: Record<string, string> = {}

  // Introduction
  const headingEntries: SidebarEntry[] = headings.value.map((heading) => {
    return {
      id: getHeadingId(heading),
      title: heading.value.toUpperCase(),
      show: !state.showApiClient,
    }
  })

  // Tags & Operations
  const firstTag = parsedSpec.value?.tags?.[0]

  // Check whether there is more than one default tag
  const moreThanOneDefaultTag = (tags?: Tag[]) =>
    tags?.length !== 1 ||
    tags[0].name !== 'default' ||
    tags[0].description !== ''

  const operationEntries: SidebarEntry[] | undefined =
    firstTag &&
    moreThanOneDefaultTag(parsedSpec.value?.tags) &&
    firstTag.operations?.length > 0
      ? parsedSpec.value?.tags?.map((tag: Tag) => {
          return {
            id: getTagId(tag),
            title: tag.name.toUpperCase(),
            show: true,
            children: tag.operations?.map((operation: TransformedOperation) => {
              const id = getOperationId(operation, tag)
              const title = operation.name ?? operation.path
              titlesById[id] = title

              return {
                id,
                title,
                httpVerb: operation.httpVerb,
                deprecated: operation.information?.deprecated ?? false,
                show: true,
                select: () => {
                  if (state.showApiClient) {
                    openClientFor(operation)
                  }
                },
              }
            }),
          }
        })
      : firstTag?.operations?.map((operation) => {
          const id = getOperationId(operation, firstTag)
          const title = operation.name ?? operation.path
          titlesById[id] = title

          return {
            id,
            title,
            httpVerb: operation.httpVerb,
            deprecated: operation.information?.deprecated ?? false,
            show: true,
            select: () => {
              if (state.showApiClient) {
                openClientFor(operation)
              }
            },
          }
        })

  // Webhooks
  const webhookEntries: SidebarEntry[] = hasWebhooks(parsedSpec.value)
    ? [
        {
          id: getWebhookId(),
          title: 'WEBHOOKS',
          show: !state.showApiClient,
          children: Object.keys(parsedSpec.value?.webhooks ?? {})
            .map((name) => {
              const id = getWebhookId(name)
              titlesById[id] = name

              return (
                Object.keys(
                  parsedSpec.value?.webhooks?.[name] ?? {},
                ) as OpenAPIV3_1.HttpMethods[]
              ).map((httpVerb) => {
                return {
                  id: getWebhookId(name, httpVerb),
                  title: parsedSpec.value?.webhooks?.[name][httpVerb]?.name,
                  httpVerb: httpVerb as string,
                  show: !state.showApiClient,
                }
              })
            })
            .flat() as SidebarEntry[],
        },
      ]
    : []

  // Models
  const modelEntries: SidebarEntry[] = hasModels(parsedSpec.value)
    ? [
        {
          id: getModelId(),
          title: 'MODELS',
          show: !state.showApiClient,
          children: Object.keys(
            parsedSpec.value?.components?.schemas ?? {},
          ).map((name) => {
            const id = getModelId(name)
            titlesById[id] = name

            return {
              id,
              title:
                (parsedSpec?.value?.components?.schemas?.[name] as any).title ??
                name,
              show: !state.showApiClient,
            }
          }),
        },
      ]
    : []

  return {
    entries: [
      ...headingEntries,
      ...(operationEntries ?? []),
      ...webhookEntries,
      ...modelEntries,
    ],
    titles: titlesById,
  }
})

const breadcrumb = computed(() => items.value?.titles?.[hash.value] ?? '')

export function useSidebar(options?: { parsedSpec: Spec }) {
  if (options?.parsedSpec) {
    parsedSpec.value = options.parsedSpec

    // Open the first tag section by default
    watch(
      parsedSpec,
      () => {
        const firstTag = parsedSpec.value?.tags?.[0]

        if (firstTag) {
          setCollapsedSidebarItem(getTagId(firstTag), true)
        }
      },
      { immediate: true, deep: true },
    )

    // Watch the spec description for headings
    watch(
      () => parsedSpec.value?.info?.description,
      async () => {
        const description = parsedSpec.value?.info?.description

        if (!description) {
          return []
        }

        return (headings.value = await updateHeadings(description))
      },
    )
  }

  return {
    breadcrumb,
    items,
    collapsedSidebarItems,
    toggleCollapsedSidebarItem,
    setCollapsedSidebarItem,
  }
}

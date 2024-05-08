import { useApiClientStore, useOpenApiStore } from '@scalar/api-client'
import { type TransformedOperation, ssrState } from '@scalar/oas-utils'
import type { OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, reactive, ref, watch } from 'vue'

import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  getModels,
  hasModels,
  hasWebhooks,
  openClientFor,
} from '../helpers'
import type { Spec, Tag } from '../types'
import { useNavState } from './useNavState'

export type SidebarEntry = {
  id: string
  title: string
  children?: SidebarEntry[]
  select?: () => void
  httpVerb?: string
  show: boolean
  deprecated?: boolean
  isGroup?: boolean
}

const {
  getHeadingId,
  getModelId,
  getOperationId,
  getSectionId,
  getTagId,
  getWebhookId,
  hash,
} = useNavState()

// Track the parsed spec
const parsedSpec = ref<Spec | undefined>(undefined)

function setParsedSpec(spec: Spec) {
  return (parsedSpec.value = spec)
}

const hideModels = ref(false)

// Track which sidebar items are collapsed
type CollapsedSidebarItems = Record<string, boolean>

const collapsedSidebarItems = reactive<CollapsedSidebarItems>(
  ssrState['useSidebarContent-collapsedSidebarItems'] ?? {},
)

function toggleCollapsedSidebarItem(key: string) {
  collapsedSidebarItems[key] = !collapsedSidebarItems[key]
}

function setCollapsedSidebarItem(key: string, value: boolean) {
  collapsedSidebarItems[key] = value
}

// Track headings in the spec description
const headings = ref<any[]>([])

const updateHeadings = async (description: string) => {
  const newHeadings = await getHeadingsFromMarkdown(description)
  const lowestLevel = getLowestHeadingLevel(newHeadings)

  return newHeadings.filter((heading) => {
    return (
      // highest level, eg. # Introduction
      heading.depth === lowestLevel ||
      // second highest level, eg. ## Authentication
      heading.depth === lowestLevel + 1
    )
  })
}

// Create the list of sidebar items from the given spec
const items = computed(() => {
  // Check whether the API client is visible
  const { state } = useApiClientStore()
  const titlesById: Record<string, string> = {}
  const {
    openApi: { globalSecurity },
  } = useOpenApiStore()

  // Headings from the OpenAPI description field
  const headingEntries: SidebarEntry[] = []
  let currentHeading: SidebarEntry | null = null

  headings.value.forEach((heading) => {
    // If the heading is the lowest level, create a new heading entry.
    if (heading.depth === getLowestHeadingLevel(headings.value)) {
      currentHeading = {
        id: getHeadingId(heading),
        title: heading.value.toUpperCase(),
        show: !state.showApiClient,
        children: [],
      }

      headingEntries.push(currentHeading)
    }
    // If the heading is the second lowest level, add it to the current heading entry.
    else if (currentHeading) {
      currentHeading.children?.push({
        id: getHeadingId(heading),
        title: heading.value,
        show: !state.showApiClient,
      })
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
    firstTag && moreThanOneDefaultTag(parsedSpec.value?.tags)
      ? parsedSpec.value?.tags
          // Filter out tags without operations
          ?.filter((tag: Tag) => tag.operations?.length > 0)
          .map((tag: Tag) => {
            return {
              id: getTagId(tag),
              title: tag.name.toUpperCase(),
              show: true,
              children: tag.operations?.map(
                (operation: TransformedOperation) => {
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
                        openClientFor(operation, globalSecurity)
                      }
                    },
                  }
                },
              ),
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
                openClientFor(operation, globalSecurity)
              }
            },
          }
        })

  // Models
  const modelEntries: SidebarEntry[] =
    hasModels(parsedSpec.value) && !hideModels.value
      ? [
          {
            id: getModelId(),
            title: 'MODELS',
            show: !state.showApiClient,
            children: Object.keys(getModels(parsedSpec.value) ?? {}).map(
              (name) => {
                const id = getModelId(name)
                titlesById[id] = name

                return {
                  id,
                  title:
                    (getModels(parsedSpec.value)?.[name] as any).title ?? name,
                  show: !state.showApiClient,
                }
              },
            ),
          },
        ]
      : []

  const groupOperations: SidebarEntry[] | undefined = parsedSpec.value?.[
    'x-tagGroups'
  ]
    ? parsedSpec.value?.['x-tagGroups']?.map((tagGroup) => {
        const children: SidebarEntry[] = []
        tagGroup.tags.map((tagName: string) => {
          if (tagName.toUpperCase() === 'MODELS' && modelEntries.length > 0) {
            children.push(modelEntries[0])
          } else {
            const tag = operationEntries?.find(
              (entry) => entry.title === tagName.toUpperCase(),
            )
            if (tag) {
              children.push(tag)
            }
          }
        })
        const sidebarTagGroup = {
          id: tagGroup.name,
          title: tagGroup.name.toUpperCase(),
          children,
          show: true,
          isGroup: true,
        }
        return sidebarTagGroup
      })
    : undefined

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

  return {
    entries: [
      ...headingEntries,
      ...(groupOperations ?? operationEntries ?? []),
      ...(groupOperations ? [] : webhookEntries),
      ...(groupOperations ? [] : modelEntries),
    ],
    titles: titlesById,
  }
})

// Controls whether or not the sidebar is open on MOBILE only
// Desktop uses the standard showSidebar prop which supercedes this one
const isSidebarOpen = ref(false)

const breadcrumb = computed(() => items.value?.titles?.[hash.value] ?? '')

export function useSidebar(options?: { parsedSpec: Spec }) {
  if (options?.parsedSpec) {
    parsedSpec.value = options.parsedSpec

    // Open the first tag section by default OR specific section from hash
    watch(
      () => parsedSpec.value?.tags?.length,
      () => {
        if (hash.value) {
          const hashSectionId = getSectionId(hash.value)
          if (hashSectionId) setCollapsedSidebarItem(hashSectionId, true)
        } else {
          const firstTag = parsedSpec.value?.tags?.[0]
          if (firstTag) setCollapsedSidebarItem(getTagId(firstTag), true)
        }
      },
    )

    // Watch the spec description for headings
    watch(
      () => parsedSpec.value?.info?.description,
      async () => {
        const description = parsedSpec.value?.info?.description

        if (!description) {
          return (headings.value = [])
        }

        return (headings.value = await updateHeadings(description))
      },
    )
  }

  return {
    breadcrumb,
    items,
    isSidebarOpen,
    collapsedSidebarItems,
    toggleCollapsedSidebarItem,
    setCollapsedSidebarItem,
    hideModels,
    setParsedSpec,
  }
}

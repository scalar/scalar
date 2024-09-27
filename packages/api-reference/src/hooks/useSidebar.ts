import { useApiClientStore, useOpenApiStore } from '#legacy'
import { ssrState } from '@scalar/oas-utils/helpers'
import type { OpenAPI, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Tag, TransformedOperation } from '@scalar/types/legacy'
import { computed, reactive, ref, watch } from 'vue'

// TODO: The result of `useSidebar` should be stored in a ref,
// otherwise it’s computed for every call of useSidebar()
import { lazyBus } from '../components/Content/Lazy/lazyBus'
import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  getModels,
  hasModels,
  hasWebhooks,
  openClientFor,
  scrollToId,
} from '../helpers'
import { useNavState } from './useNavState'

export type SidebarEntry = {
  id: string
  title: string
  displayTitle?: string
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
const openApiDocument = ref<OpenAPI.Document>({})

type OpenApiDocumentOption = {
  openApiDocument: OpenAPI.Document
}

/** Keep track of the given options */
const optionsRef = reactive<Partial<OpenApiDocumentOption & TagsSorterOption>>(
  {},
)

/** Helper to overwrite the current OpenAPI document */
function setOpenApiDocument(content: OpenAPI.Document) {
  // Sort tags alphabetically
  if (optionsRef.tagsSorter === 'alpha') {
    content.tags = content.tags?.sort((a: OpenAPI.Tag, b: OpenAPI.Tag) =>
      a['x-scalar-computed']?.name?.localeCompare(b['x-scalar-computed'].name),
    )
  }
  // Custom tags sorting
  else if (typeof optionsRef.tagsSorter === 'function') {
    content.tags = content.tags?.sort(optionsRef.tagsSorter)
  }

  return (openApiDocument.value = content)
}

const hideModels = ref(false)
const defaultOpenAllTags = ref(false)

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

function updateHeadings(description: string) {
  const newHeadings = getHeadingsFromMarkdown(description)
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
        title: heading.value,
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
  const firstTag = openApiDocument.value.tags?.[0]

  // Check whether there is more than one default tag
  const moreThanOneDefaultTag = (tags?: Tag[]) =>
    tags?.length !== 1 ||
    tags[0].name !== 'default' ||
    tags[0].description !== ''

  // TODO: tags.operations is empty
  const operationEntries: SidebarEntry[] | undefined =
    firstTag && moreThanOneDefaultTag(openApiDocument.value.tags)
      ? openApiDocument.value.tags
          ?.map((tag: Tag) => {
            const operations = getOperationsWithTag(openApiDocument.value, tag)

            if (!operations?.length) {
              return undefined
            }

            return {
              id: getTagId(tag),
              title: tag.name,
              displayTitle: tag['x-displayName'] ?? tag.name,
              show: true,
              children: operations?.map((operation: OpenAPI.Operation) => {
                const id = getOperationId(operation, tag)
                const title =
                  operation['x-scalar-computed'].name ?? operation.path
                titlesById[id] = title

                return {
                  id,
                  title,
                  httpVerb: operation['x-scalar-computed'].method,
                  deprecated: operation.deprecated ?? false,
                  show: true,
                  select: () => {
                    if (state.showApiClient) {
                      openClientFor(operation, globalSecurity)
                    }
                  },
                }
              }),
            }
          })
          // Filter out tags without operations
          .filter((entry: any) => entry)
      : getOperationsWithTag(
          openApiDocument.value ? openApiDocument.value : {},
          firstTag,
        ).map((operation) => {
          const id = getOperationId(operation, firstTag)
          const title = operation['x-scalar-computed'].name ?? operation.path
          titlesById[id] = title

          return {
            id,
            title,
            httpVerb: operation['x-scalar-computed'].method,
            deprecated: operation.deprecated ?? false,
            show: true,
            select: () => {
              if (state.showApiClient) {
                openClientFor(operation, globalSecurity)
              }
            },
          }
        })

  // Models
  let modelEntries: SidebarEntry[] =
    hasModels(openApiDocument.value) && !hideModels.value
      ? [
          {
            id: getModelId(),
            title: 'Models',
            show: !state.showApiClient,
            children: Object.keys(getModels(openApiDocument.value) ?? {}).map(
              (name) => {
                const id = getModelId(name)
                titlesById[id] = name

                return {
                  id,
                  title:
                    (getModels(openApiDocument.value)?.[name] as any).title ??
                    name,
                  show: !state.showApiClient,
                }
              },
            ),
          },
        ]
      : []

  // Webhooks
  let webhookEntries: SidebarEntry[] = hasWebhooks(openApiDocument.value)
    ? [
        {
          id: getWebhookId(),
          title: 'Webhooks',
          show: !state.showApiClient,
          children: Object.keys(openApiDocument.value.webhooks ?? {})
            .map((name) => {
              const id = getWebhookId(name)
              titlesById[id] = name

              return (
                Object.keys(
                  openApiDocument.value.webhooks?.[name] ?? {},
                ) as OpenAPIV3_1.HttpMethods[]
              ).map((httpVerb) => {
                return {
                  id: getWebhookId(name, httpVerb),
                  title: openApiDocument.value.webhooks?.[name][httpVerb]?.name,
                  httpVerb: httpVerb as string,
                  show: !state.showApiClient,
                }
              })
            })
            .flat() as SidebarEntry[],
        },
      ]
    : []

  const groupOperations: SidebarEntry[] | undefined = openApiDocument.value[
    'x-tagGroups'
  ]
    ? openApiDocument.value['x-tagGroups']?.map((tagGroup: any) => {
        const children: SidebarEntry[] = []
        tagGroup.tags?.map((tagName: string) => {
          if (tagName === 'models' && modelEntries.length > 0) {
            // Add default models entry to the group
            children.push(modelEntries[0])
            // Don’t show default models entry
            modelEntries = []
          } else if (tagName === 'webhooks' && webhookEntries.length > 0) {
            // Add default webhooks entry to the group
            children.push(webhookEntries[0])
            // Don’t show default webhooks entry
            webhookEntries = []
          } else {
            const tag = operationEntries?.find(
              (entry) => entry.title === tagName,
            )

            if (tag) {
              children.push(tag)
            }
          }
        })
        const sidebarTagGroup = {
          id: tagGroup.name,
          title: tagGroup.name,
          children,
          show: true,
          isGroup: true,
        }
        return sidebarTagGroup
      })
    : undefined

  const entries = [
    ...headingEntries,
    ...(groupOperations ?? operationEntries ?? []),
    ...webhookEntries,
    ...modelEntries,
  ]

  if (defaultOpenAllTags.value) {
    entries.forEach((entry) => {
      setCollapsedSidebarItem(entry.id, true)
      entry.show = true
    })
  }

  return {
    entries,
    titles: titlesById,
  }
})

/**
 * Controls whether or not the sidebar is open on mobile-only.
 * Desktop uses the standard showSidebar prop which supercedes this one.
 */
const isSidebarOpen = ref(false)

const breadcrumb = computed(() => items.value?.titles?.[hash.value] ?? '')

export type TagsSorterOption = {
  tagsSorter?: 'alpha' | ((a: Tag, b: Tag) => number)
}

/**
 * Scroll to operation
 *
 * Similar to scrollToId BUT in the case of a section not being open,
 * it uses the lazyBus to ensure the section is open before scrolling to it
 *
 */
export const scrollToOperation = (operationId: string) => {
  const sectionId = getSectionId(operationId)

  if (sectionId !== operationId) {
    // We use the lazyBus to check when the target has loaded then scroll to it
    if (!collapsedSidebarItems[sectionId]) {
      const unsubscribe = lazyBus.on((ev) => {
        if (ev.id === operationId) {
          scrollToId(operationId)
          unsubscribe()
        }
      })
      setCollapsedSidebarItem(sectionId, true)
    } else scrollToId(operationId)
  }
}

/**
 * Provides the sidebar state and methods to control it.
 */
export function useSidebar(options?: OpenApiDocumentOption & TagsSorterOption) {
  Object.assign(optionsRef, options)

  if (options?.openApiDocument) {
    setOpenApiDocument(options.openApiDocument)

    // Open the first tag section by default OR specific section from hash
    watch(
      () => openApiDocument.value.tags?.length,
      () => {
        if (hash.value) {
          const hashSectionId = getSectionId(hash.value)
          if (hashSectionId) setCollapsedSidebarItem(hashSectionId, true)
        } else {
          const firstTag = openApiDocument.value.tags?.[0]
          if (firstTag) setCollapsedSidebarItem(getTagId(firstTag), true)
        }
      },
    )

    // Watch the spec description for headings
    watch(
      () => openApiDocument.value.info?.description,
      () => {
        const description = openApiDocument.value.info?.description

        if (!description) {
          return (headings.value = [])
        }

        return (headings.value = updateHeadings(description))
      },
      {
        immediate: true,
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
    setOpenApiDocument,
    defaultOpenAllTags,
    scrollToOperation,
  }
}

/**
 * TODO: Move to @scalar/openapi-sdk
 */
function getOperationsWithTag(content: OpenAPI.Document, tag: OpenAPI.Tag) {
  if (!content || !tag) {
    return []
  }

  const operations: OpenAPI.Operation[] = []

  // Iterate through all paths and methods
  Object.entries(content.paths || {}).forEach(
    ([path, pathItem]: [string, OpenAPI.PathItem]) => {
      Object.entries(pathItem || {}).forEach(
        ([method, operation]: [string, OpenAPI.Operation]) => {
          // Check if the operation is a valid HTTP method
          if (
            [
              'get',
              'put',
              'post',
              'delete',
              'options',
              'head',
              'patch',
              'trace',
            ].includes(method) &&
            operation
          ) {
            // Check if the operation has the given tag
            if (operation.tags?.includes(tag.name)) {
              operations.push({
                ...operation,
                'x-scalar-computed': {
                  path,
                  method: method.toUpperCase(),
                  name:
                    operation.summary ||
                    operation.operationId ||
                    `${method.toUpperCase()} ${path}`,
                },
              })
            }
          }
        },
      )
    },
  )

  return operations
}

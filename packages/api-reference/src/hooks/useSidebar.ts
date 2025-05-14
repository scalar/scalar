import { isOperationDeprecated } from '@/libs/operation'
import { ssrState } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, Tag, TransformedOperation } from '@scalar/types/legacy'
import { computed, reactive, ref, watch } from 'vue'
import { lazyBus } from '../components/Content/Lazy/lazyBus'
import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  getModels,
  hasModels,
  hasWebhooks,
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

export const DEFAULT_INTRODUCTION_SLUG = 'introduction'

/**
 * This is a temp hack to get the navState outside of a setup function.
 * Sidebar will eventually be replaced by the client one so we can remove this whole hook then.
 */
const navState = ref<ReturnType<typeof useNavState> | null>(null)

// Track the parsed spec
const parsedSpec = ref<Spec | undefined>(undefined)

/** Keep track of the given options */
const optionsRef = reactive<Partial<ParsedSpecOption & SorterOption>>({})

/** Helper to overwrite the current OpenAPI document */
function setParsedSpec(spec: Spec) {
  // Sort tags alphabetically
  if (optionsRef.tagsSorter === 'alpha') {
    spec.tags = spec.tags?.sort((a, b) => a.name.localeCompare(b.name))
  }
  // Custom tags sorting
  else if (typeof optionsRef.tagsSorter === 'function') {
    spec.tags = spec.tags?.sort(optionsRef.tagsSorter)
  }

  // Sort function for operations by title
  const sortByTitle = (a: TransformedOperation, b: TransformedOperation) => {
    const titleA = a.name ?? a.path
    const titleB = b.name ?? b.path

    return titleA.localeCompare(titleB)
  }
  // Sort function for operations by method
  const sortByMethod = (a: TransformedOperation, b: TransformedOperation) => a.httpVerb.localeCompare(b.httpVerb)

  let operationSorterFunc: ((a: TransformedOperation, b: TransformedOperation) => number) | undefined

  // Sort operations alphabetically
  if (optionsRef.operationsSorter === 'alpha') {
    operationSorterFunc = sortByTitle
  }
  // Sort operations by method
  else if (optionsRef.operationsSorter === 'method') {
    operationSorterFunc = sortByMethod
  }
  // Custom operations sorting
  else if (typeof optionsRef.operationsSorter === 'function') {
    operationSorterFunc = optionsRef.operationsSorter
  }
  // Apply sorting to operations if a sorter function exists
  if (operationSorterFunc) {
    spec.tags?.forEach((tag) => {
      tag.operations = tag.operations?.sort(operationSorterFunc)
    })
  }

  return (parsedSpec.value = spec)
}

const hideModels = ref(false)
const defaultOpenAllTags = ref(false)

// Track which sidebar items are collapsed
type CollapsedSidebarItems = Record<string, boolean>

const collapsedSidebarItems = reactive<CollapsedSidebarItems>(ssrState['useSidebarContent-collapsedSidebarItems'] ?? {})

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
  if (!navState.value) {
    return { entries: [], titles: {} }
  }

  const { getHeadingId, getModelId, getOperationId, getTagId, getWebhookId } = navState.value

  // Check whether the API client is visible
  const titlesById: Record<string, string> = {}

  // Headings from the OpenAPI description field
  const headingEntries: SidebarEntry[] = []
  let currentHeading: SidebarEntry | null = null

  headings.value.forEach((heading) => {
    // If the heading is the lowest level, create a new heading entry.
    if (heading.depth === getLowestHeadingLevel(headings.value)) {
      currentHeading = {
        id: getHeadingId(heading),
        title: heading.value,
        show: true,
        children: [],
      }

      headingEntries.push(currentHeading)
    }
    // If the heading is the second lowest level, add it to the current heading entry.
    else if (currentHeading) {
      currentHeading.children?.push({
        id: getHeadingId(heading),
        title: heading.value,
        show: true,
      })
    }
  })

  // Tags & Operations
  const firstTag = parsedSpec.value?.tags?.[0]

  // Check whether there is more than one default tag
  const moreThanOneDefaultTag = (tags?: Tag[]) =>
    tags?.length !== 1 || tags[0].name !== 'default' || tags[0].description !== ''

  const operationEntries: SidebarEntry[] | undefined =
    firstTag && moreThanOneDefaultTag(parsedSpec.value?.tags)
      ? parsedSpec.value?.tags
          // Filter out tags without operations
          ?.filter((tag: Tag) => tag.operations?.length > 0)
          .map((tag: Tag) => {
            return {
              id: getTagId(tag),
              title: tag.name,
              displayTitle: tag['x-displayName'] ?? tag.name,
              show: true,
              children: tag.operations?.map((operation: TransformedOperation) => {
                const id = getOperationId(operation, tag)
                const title = operation.name ?? operation.path
                titlesById[id] = title

                return {
                  id,
                  title,
                  httpVerb: operation.httpVerb,
                  // TODO: Workaround until we’re using the store directly
                  deprecated: operation.information
                    ? isOperationDeprecated({
                        deprecated: operation.information?.deprecated,
                        'x-scalar-stability': operation.information?.['x-scalar-stability'],
                      })
                    : false,
                  show: true,
                  select: () => {},
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
            // TODO: Workaround until we’re using the store directly
            deprecated: operation.information
              ? isOperationDeprecated({
                  deprecated: operation.information?.deprecated,
                  'x-scalar-stability': operation.information?.['x-scalar-stability'],
                })
              : false,
            show: true,
            select: () => {},
          }
        })

  // Models
  let modelEntries: SidebarEntry[] =
    hasModels(parsedSpec.value) && !hideModels.value
      ? [
          {
            id: getModelId(),
            title: 'Models',
            show: true,
            children: Object.keys(getModels(parsedSpec.value) ?? {}).map((name) => {
              const id = getModelId({ name })
              titlesById[id] = name

              return {
                id,
                title: (getModels(parsedSpec.value)?.[name] as any).title ?? name,
                show: true,
              }
            }),
          },
        ]
      : []

  // Webhooks
  let webhookEntries: SidebarEntry[] = hasWebhooks(parsedSpec.value)
    ? [
        {
          id: getWebhookId(),
          title: 'Webhooks',
          show: true,
          children: Object.keys(parsedSpec.value?.webhooks ?? {}).flatMap((name) => {
            const id = getWebhookId({ name })
            titlesById[id] = name

            return (Object.keys(parsedSpec.value?.webhooks?.[name] ?? {}) as OpenAPIV3_1.HttpMethods[]).map(
              (httpVerb) => {
                return {
                  id: getWebhookId({ name, method: httpVerb }),
                  title: parsedSpec.value?.webhooks?.[name][httpVerb]?.name,
                  httpVerb: httpVerb as string,
                  show: true,
                }
              },
            )
          }) as SidebarEntry[],
        },
      ]
    : []

  const groupOperations: SidebarEntry[] | undefined = parsedSpec.value?.['x-tagGroups']
    ? parsedSpec.value?.['x-tagGroups']?.map((tagGroup) => {
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
            const tag = operationEntries?.find((entry) => entry.title === tagName)

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

const breadcrumb = computed(() => items.value?.titles?.[navState.value?.hash ?? ''] ?? '')

export type ParsedSpecOption = {
  parsedSpec: Spec
}

export type SorterOption = {
  tagsSorter?: 'alpha' | ((a: Tag, b: Tag) => number)
  operationsSorter?: 'alpha' | 'method' | ((a: TransformedOperation, b: TransformedOperation) => number)
}

/**
 * Scroll to operation
 *
 * Similar to scrollToId BUT in the case of a section not being open,
 * it uses the lazyBus to ensure the section is open before scrolling to it
 *
 */
export const scrollToOperation = (operationId: string, focus?: boolean) => {
  const sectionId = navState.value?.getSectionId(operationId)

  if (sectionId && sectionId !== operationId) {
    // We use the lazyBus to check when the target has loaded then scroll to it
    if (!collapsedSidebarItems[sectionId]) {
      const unsubscribe = lazyBus.on((ev) => {
        if (ev.id === operationId) {
          scrollToId(operationId, focus)
          unsubscribe()
        }
      })
      setCollapsedSidebarItem(sectionId, true)
    } else {
      scrollToId(operationId, focus)
    }
  }
}

/**
 * Provides the sidebar state and methods to control it.
 */
export function useSidebar(options?: ParsedSpecOption & SorterOption) {
  Object.assign(optionsRef, options)

  // Hack navState
  const _navState = useNavState()
  navState.value = _navState
  const { hash, getSectionId, getTagId } = _navState

  if (options?.parsedSpec) {
    setParsedSpec(options.parsedSpec)

    // Open the first tag section by default OR specific section from hash
    watch(
      () => parsedSpec.value?.tags?.length,
      () => {
        if (hash.value) {
          const hashSectionId = getSectionId(hash.value)
          if (hashSectionId) {
            setCollapsedSidebarItem(hashSectionId, true)
          }
        } else {
          const firstTag = parsedSpec.value?.tags?.[0]
          if (firstTag) {
            setCollapsedSidebarItem(getTagId(firstTag), true)
          }
        }
      },
    )

    // Watch the spec description for headings
    watch(
      () => parsedSpec.value?.info?.description,
      () => {
        const description = parsedSpec.value?.info?.description?.trim()

        if (!description) {
          return (headings.value = [])
        }

        const newHeadings = updateHeadings(description)

        // Add "Introduction" as the first heading
        if (description && !description.startsWith('#')) {
          const introductionHeading = {
            depth: newHeadings[0]?.depth ?? 1,
            value: 'Introduction',
            slug: DEFAULT_INTRODUCTION_SLUG,
          }

          newHeadings.unshift(introductionHeading)
        }

        return (headings.value = newHeadings)
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
    setParsedSpec,
    defaultOpenAllTags,
    scrollToOperation,
  }
}

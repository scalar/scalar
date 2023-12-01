import { ApiClient, useApiClientStore } from '@scalar/api-client'
import { computed, reactive, ref, watch } from 'vue'

import {
  getHeadingId,
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  getModelSectionId,
  getOperationSectionId,
  getTagSectionId,
  hasModels,
  openClientFor,
} from '../helpers'
import type { Spec, Tag, TransformedOperation } from '../types'

export type SidebarEntry = {
  id: string
  title: string
  type: 'Page' | 'Folder'
  children?: SidebarEntry[]
  select?: () => void
  httpVerb?: string
  show: boolean
  deprecated?: boolean
}

// Track the parsed spec
const parsedSpec = ref<Spec | undefined>(undefined)

// Track which sidebar items are visible
type SidebarIdVisibility = Record<string, boolean>

const sidebarIdVisibility = reactive<SidebarIdVisibility>({})

function setItemIdVisibility(id: string, visible: boolean) {
  sidebarIdVisibility[id] = visible
}

const isVisible = (id: string) => sidebarIdVisibility[id] ?? false

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
const items = computed((): SidebarEntry[] => {
  // Check whether the API client is visible
  const { state } = useApiClientStore()

  // Introduction
  const headingEntries: SidebarEntry[] = headings.value.map((heading) => {
    return {
      id: getHeadingId(heading),
      title: heading.value.toUpperCase(),
      type: 'Page',
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
            id: getTagSectionId(tag),
            title: tag.name.toUpperCase(),
            type: 'Folder',
            show: true,
            children: tag.operations?.map((operation: TransformedOperation) => {
              return {
                id: getOperationSectionId(operation, tag),
                title: operation.name ?? operation.path,
                type: 'Page',
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
          return {
            id: getOperationSectionId(operation, firstTag),
            title: operation.name ?? operation.path,
            type: 'Page',
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

  // Models
  const modelEntries: SidebarEntry[] = hasModels(parsedSpec.value)
    ? [
        {
          id: getModelSectionId(),
          title: 'MODELS',
          type: 'Folder',
          show: !state.showApiClient,
          children: Object.keys(
            parsedSpec.value?.components?.schemas ?? {},
          ).map((name) => {
            return {
              id: getModelSectionId(name),
              title: name,
              type: 'Page',
              show: !state.showApiClient,
            }
          }),
        },
      ]
    : []

  return [...headingEntries, ...(operationEntries ?? []), ...modelEntries]
})

// Track the active sidebar item
const activeItemId = computed(() => {
  const flattenedItems = items.value.reduce((acc, item) => {
    acc.push(item)

    if (item.children) {
      acc.push(...item.children)
    }

    return acc
  }, [] as SidebarEntry[])

  return flattenedItems.find((item) => isVisible(item.id))?.id ?? null
})

export function useNavigation(options?: { parsedSpec: Spec }) {
  if (options?.parsedSpec) {
    parsedSpec.value = options.parsedSpec

    // Open the first tag section by default
    watch(
      parsedSpec,
      () => {
        const firstTag = parsedSpec.value?.tags?.[0]

        if (firstTag) {
          setCollapsedSidebarItem(getTagSectionId(firstTag), true)
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

    // Watch the active item and update the URL
    watch(activeItemId, (id) => {
      if (id) {
        const newUrl = `${window.location.origin}${window.location.pathname}#${id}`
        window.history.replaceState({}, '', newUrl)
      }
    })
  }

  return {
    items,
    activeItemId,
    sidebarIdVisibility,
    setItemIdVisibility,
    collapsedSidebarItems,
    toggleCollapsedSidebarItem,
    setCollapsedSidebarItem,
  }
}

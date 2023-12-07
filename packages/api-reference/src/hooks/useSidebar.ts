import { useApiClientStore } from '@scalar/api-client'
import { computed, reactive, ref, watch } from 'vue'

import {
  getHeadingsFromMarkdown,
  getLowestHeadingLevel,
  hasModels,
  openClientFor,
} from '../helpers'
import type { Spec, Tag, TransformedOperation } from '../types'
import { useNavigate } from './useNavigate'

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

const { getHeadingId, getModelId, getOperationId, getTagId } = useNavigate()

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
            id: getTagId(tag),
            title: tag.name.toUpperCase(),
            type: 'Folder',
            show: true,
            children: tag.operations?.map((operation: TransformedOperation) => {
              return {
                id: getOperationId(operation, tag),
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
            id: getOperationId(operation, firstTag),
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
          id: getModelId(),
          title: 'MODELS',
          type: 'Folder',
          show: !state.showApiClient,
          children: Object.keys(
            parsedSpec.value?.components?.schemas ?? {},
          ).map((name) => {
            return {
              id: getModelId(name),
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
    items,
    collapsedSidebarItems,
    toggleCollapsedSidebarItem,
    setCollapsedSidebarItem,
  }
}

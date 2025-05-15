<script setup lang="ts">
import {
  ACTIVE_ENTITIES_SYMBOL,
  createActiveEntitiesStore,
  createWorkspaceStore,
  WORKSPACE_SYMBOL,
} from '@scalar/api-client/store'
import { dereference, upgrade } from '@scalar/openapi-parser'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec } from '@scalar/types'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed, provide, ref, toRaw, toRef, toValue, watch } from 'vue'

import { parse } from '@/helpers/parse'
import { createEmptySpecification } from '@/libs/openapi'
import type { ReferenceLayoutProps } from '@/types'

import { useDataSource } from './hooks/useDataSource'

const {
  originalDocument: providedOriginalDocument,
  dereferencedDocument: providedDereferencedDocument,
  configuration,
} = defineProps<
  Partial<
    Pick<ReferenceLayoutProps, 'originalDocument' | 'dereferencedDocument'> & {
      configuration: ApiReferenceConfiguration
    }
  >
>()

// Fetch

const { originalDocument: fetchedOriginalDocument } = useDataSource({
  configuration: toRef(() => configuration ?? {}),
  proxyUrl: toRef(() => configuration?.proxyUrl || ''),
})

const originalDocument = computed(() => {
  if (providedOriginalDocument) {
    return providedOriginalDocument
  }

  return toValue(fetchedOriginalDocument)
})

// Dereference

const dereferencedDocument = computed(() => {
  if (providedDereferencedDocument) {
    return providedDereferencedDocument
  }

  return manuallyDereferencedDocument.value
})

const manuallyDereferencedDocument = ref<OpenAPIV3_1.Document>({
  openapi: '3.1.0',
  info: {
    title: '',
    version: '',
  },
  paths: {},
})

// Dereference the original document.
watch(
  () => toValue(originalDocument),
  async (newVal) => {
    if (!newVal) {
      return
    }

    // TODO: Skip if one was provided already.

    const { specification: upgraded } = upgrade(toValue(newVal))
    const { schema } = await dereference(upgraded)

    manuallyDereferencedDocument.value = schema as OpenAPIV3_1.Document
  },
  {
    immediate: true,
  },
)

// API Client Store
const workspaceStore = createWorkspaceStore({
  useLocalStorage: false,
  ...(configuration ?? apiReferenceConfigurationSchema.parse({})),
})

watch(
  () => toValue(originalDocument),
  (spec) =>
    spec &&
    workspaceStore.importSpecFile(spec, 'default', {
      shouldLoad: false,
      documentUrl: configuration?.url,
      useCollectionSecurity: true,
      ...(configuration ?? apiReferenceConfigurationSchema.parse({})),
    }),
  { immediate: true },
)

provide(WORKSPACE_SYMBOL, workspaceStore)

// Active Entities Store

const activeEntitiesStore = createActiveEntitiesStore(workspaceStore)

provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

// Parse (Legacy)

const parsedDocument = ref<Spec>(createEmptySpecification())

watch(
  () => toValue(originalDocument),
  async (newVal) => {
    if (!newVal) {
      return
    }

    const result = await parse(toValue(originalDocument.value))

    parsedDocument.value = result
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <slot
    :originalDocument="originalDocument"
    :dereferencedDocument="dereferencedDocument"
    :parsedDocument="parsedDocument"
    :workspaceStore="workspaceStore"
    :activeEntitiesStore="activeEntitiesStore" />
</template>

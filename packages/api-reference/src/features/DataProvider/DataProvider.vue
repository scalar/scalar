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
import type { ReferenceLayoutProps } from '@/types'

import { useDataSource } from './hooks/useReactiveSpec'

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

const manuallyDereferencedDocument = ref<OpenAPIV3_1.Document | undefined>(
  undefined,
)

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

    console.log('schema', originalDocument.value)

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

const parsedDocument = ref<Spec | undefined>(undefined)

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
  <div style="color: white">
    <div>originalDocument: {{ !!originalDocument }}</div>
    <div>dereferencedDocument: {{ !!dereferencedDocument }}</div>
    <div>workspaceStore: {{ !!workspaceStore }}</div>
    <div>activeEntitiesStore: {{ !!activeEntitiesStore }}</div>
    <!-- <div>parsed: {{ parsedSpec }}</div> -->
    <div>parsedDocument: {{ !!parsedDocument }}</div>

    <div>
      {{ dereferencedDocument?.info?.title }} OpenAPI v{{
        dereferencedDocument?.openapi
      }}
    </div>
    <slot />
  </div>
</template>

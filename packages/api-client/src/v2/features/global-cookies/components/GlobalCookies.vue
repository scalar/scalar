<script setup lang="ts">
import { ScalarIconCookie } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { EnvVariable } from '@/store'
import CookiesSidebar from '@/v2/features/global-cookies/components/CookiesSidebar.vue'
import CookiesTable from '@/v2/features/global-cookies/components/CookiesTable.vue'

type Cookie = {
  name: string
  value: string
  domain: string
  isDisabled?: boolean
}

const { sidebarWidth } = defineProps<{
  /** Current selected document name or when null it means workspace level cookies */
  documentName: string | null
  /** List of all document names */
  documents: string[]
  /** List of all cookies for the current document or workspace */
  cookies: Cookie[]
  /** Sidebar width */
  sidebarWidth?: number

  /** TODO: remove when we migrate to the new store */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emits = defineEmits<{
  (e: 'navigation:update:selection', value: string | null): void
  (e: 'navigation:update:sidebarWidth', value: number): void
  (e: 'cookie:add', payload: Partial<Cookie>): void
  (e: 'cookie:update', index: number, payload: Partial<Cookie>): void
  (e: 'cookie:delete', index: number): void
}>()
</script>

<template>
  <ViewLayout>
    <CookiesSidebar
      :documentName="documentName"
      :documents="documents"
      title="Global Cookies"
      :width="sidebarWidth"
      @update:selection="(value) => emits('navigation:update:selection', value)"
      @update:width="
        (value) => emits('navigation:update:sidebarWidth', value)
      " />
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <div
          class="mx-auto flex max-h-full w-full max-w-[720px] !flex-col gap-8 overflow-auto px-5 py-15">
          <div class="flex flex-col gap-2">
            <h2 class="flex items-center gap-2 text-xl font-bold">
              <ScalarIconCookie />
              <template v-if="!documentName"> Global cookies </template>
              <template v-else>{{ documentName }} cookies</template>
            </h2>
            <p class="text-c-2 mb-4 text-sm">
              Manage your global cookies here.
            </p>
          </div>
          <CookiesTable
            :data="cookies"
            :envVariables="envVariables"
            :environment="environment"
            @addRow="(payload) => emits('cookie:add', payload)"
            @deleteRow="(index) => emits('cookie:delete', index)"
            @updateRow="
              (index, payload) => emits('cookie:update', index, payload)
            " />
        </div>
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>

<style scoped>
:deep(.cm-editor) {
  padding: 0;
}
:deep(.cm-content) {
  align-items: center;
  background-color: transparent;
  display: flex;
  font-family: var(--scalar-font);
  font-size: var(--scalar-small);
  padding: 5px 8px;
  width: 100%;
}
:deep(.cm-content):has(.cm-pill) {
  padding: 5px 8px;
}
:deep(.cm-content .cm-pill:not(:last-of-type)) {
  margin-right: 0.5px;
}
:deep(.cm-content .cm-pill:not(:first-of-type)) {
  margin-left: 0.5px;
}
:deep(.cm-line) {
  overflow: hidden;
  padding: 0;
  text-overflow: ellipsis;
}
</style>

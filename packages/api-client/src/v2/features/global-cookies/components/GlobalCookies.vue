<script setup lang="ts">
import { ScalarIconCookie } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import type { EnvVariable } from '@/store'
import CookiesTable from '@/v2/features/global-cookies/components/CookiesTable.vue'

type Cookie = {
  name: string
  value: string
  domain: string
  isDisabled?: boolean
}

defineProps<{
  cookies: Cookie[]

  /** TODO: remove when we migrate to the new store */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emits = defineEmits<{
  (e: 'addCookie', payload: Partial<Cookie>): void
  (e: 'updateCookie', index: number, payload: Partial<Cookie>): void
  (e: 'deleteCookie', index: number): void
}>()
</script>

<template>
  <ViewLayout class="bg-b-1 h-full w-full overflow-auto">
    <div
      class="mr-auto ml-auto flex w-full max-w-[720px] !flex-col gap-8 px-5 py-5">
      <div class="flex flex-col gap-2">
        <h2 class="mt-10 flex items-center gap-2 text-xl font-bold">
          <ScalarIconCookie />Global cookies
        </h2>
        <p class="text-c-2 mb-4 text-sm">Manage your global cookies here.</p>
      </div>

      <CookiesTable
        :data="cookies"
        :envVariables="envVariables"
        :environment="environment"
        @addRow="(payload) => emits('addCookie', payload)"
        @deleteRow="(index) => emits('deleteCookie', index)"
        @updateRow="
          (index, payload) => emits('updateCookie', index, payload)
        " />
    </div>
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

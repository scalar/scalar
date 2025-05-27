<script setup lang="ts">
import type { Collection, Operation } from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Computer from '@/assets/computer.ascii?raw'
import EmptyState from '@/components/EmptyState.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { useLayout } from '@/hooks'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'

const { numWorkspaceRequests, collection, operation, workspace } = defineProps<{
  collection: Collection
  operation: Operation
  workspace: Workspace
  numWorkspaceRequests: number
}>()

const { events, requestMutators } = useWorkspace()
const route = useRoute()
const router = useRouter()
const { layout } = useLayout()

const addRequest = () => {
  // If the request has tags, add the first tag to the new request
  const requestData = operation.tags?.length
    ? { tags: operation.tags[0] ? [operation.tags[0]] : [] }
    : {}

  const newRequest = requestMutators.add(requestData, collection.uid)

  if (newRequest) {
    router.push({
      name: 'request',
      params: {
        workspace: workspace.uid,
        request: newRequest.uid,
      },
    })

    nextTick(() => {
      events.hotKeys.emit({
        focusAddressBar: new KeyboardEvent('keydown', { key: 'l' }),
      })
    })
  }
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'request') {
    addRequest()
  }
}

const packageVersion = PACKAGE_VERSION

onMounted(() => events.hotKeys.on(handleHotKey))
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <div class="flex-center relative flex flex-1 flex-col gap-6 p-2 capitalize">
    <div
      class="flex h-[calc(100%_-_50px)] flex-col items-center justify-center"
      :class="{
        'hidden opacity-0': numWorkspaceRequests <= 1 && layout !== 'modal',
      }">
      <div
        v-if="layout !== 'modal'"
        class="scalar-version-number">
        Scalar App V{{ packageVersion }} Beta
        <div class="mt-2">
          <a
            href="https://github.com/scalar/scalar/issues/2669"
            target="_blank">
            Roadmap
          </a>
        </div>
      </div>
      <a
        class="gitbook-show scalar-version-number"
        href="https://www.scalar.com"
        target="_blank">
        Powered By Scalar.com
      </a>
      <ScalarAsciiArt
        :art="Computer"
        class="text-c-3" />
    </div>
    <div
      v-if="layout !== 'modal'"
      class="hidden h-[calc(100%_-_50px)] items-center justify-center pb-5"
      :class="{
        '!flex opacity-100': numWorkspaceRequests == 1,
      }">
      <EmptyState />
    </div>
    <div
      class="text-c-3 right-4 mt-auto flex w-full flex-col items-end gap-2 text-sm">
      <button
        v-if="layout !== 'modal'"
        class="flex items-center gap-1.5"
        type="button"
        @click="events.commandPalette.emit()">
        Get Started
        <ScalarHotkey hotkey="k" />
      </button>
      <button
        v-if="layout === 'desktop'"
        class="flex items-center gap-1.5"
        type="button"
        @click="addRequest()">
        New Request
        <ScalarHotkey hotkey="N" />
      </button>
      <button
        class="flex items-center gap-1.5"
        type="button"
        @click="events.executeRequest.emit()">
        Send Request
        <ScalarHotkey hotkey="↵" />
      </button>
    </div>
  </div>
</template>
<style scoped>
.scalar-version-number {
  transform: skew(0deg, 13deg);
  width: 76px;
  height: 76px;
  position: absolute;
  margin-left: -36px;
  font-size: 8px;
  font-family: var(--scalar-font-code);
  line-height: 11px;
  margin-top: -113px;
  border-radius: 9px 9px 16px 12px;
  box-shadow: inset 2px 0px 0 2px var(--scalar-background-2);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-transform: initial;
  text-decoration-color: var(--scalar-color-3);
}
.scalar-version-number a {
  font-weight: bold;
  font-weight: bold;
  background: var(--scalar-background-2);
  padding: 2px 4px;
  border-radius: 3px;
  text-decoration: none;
  border: 0.5px solid var(--scalar-border-color);
}

.gitbook-show {
  display: none;
}
</style>

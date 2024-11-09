<script setup lang="ts">
import Computer from '@/assets/computer.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { useLayout } from '@/hooks'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const { isReadOnly, activeWorkspace, events } = useWorkspace()
const route = useRoute()
const { layout } = useLayout()

const openCommandPaletteRequest = () => {
  events.commandPalette.emit({ commandName: 'Create Request' })
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'request') {
    openCommandPaletteRequest()
  }
}

const packageVersion = PACKAGE_VERSION

onMounted(() => events.hotKeys.on(handleHotKey))
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
</script>
<template>
  <div class="relative col-1 flex-center gap-6 p-2 capitalize">
    <div
      class="flex h-[calc(100%_-_50px)] flex-col items-center justify-center">
      <div
        v-if="!activeWorkspace.isReadOnly"
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
      <ScalarAsciiArt
        :art="Computer"
        class="text-c-3" />
    </div>
    <div
      class="text-c-3 right-4 mt-auto flex w-full flex-col items-end gap-2 text-sm">
      <button
        class="flex items-center gap-1.5"
        type="button"
        @click="events.executeRequest.emit()">
        Send Request
        <ScalarHotkey hotkey="↵" />
      </button>
      <button
        v-if="!isReadOnly && layout === 'desktop'"
        class="flex items-center gap-1.5"
        type="button"
        @click="openCommandPaletteRequest">
        New Request
        <ScalarHotkey hotkey="N" />
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
  background: linear-gradient(var(--scalar-background-2), transparent);
  border-radius: 9px 9px 16px 12px;
  box-shadow: inset 2px 0px 0 2px var(--scalar-background-3);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.scalar-version-number a {
  font-weight: bold;
  font-weight: bold;
  background: var(--scalar-background-3);
  padding: 2px 4px;
  border-radius: 3px;
  text-decoration: none;
  border: 0.5px solid var(--scalar-border-color);
}
</style>

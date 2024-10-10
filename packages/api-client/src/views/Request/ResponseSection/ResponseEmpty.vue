<script setup lang="ts">
import Computer from '@/assets/computer.ascii?raw'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { onBeforeUnmount, onMounted } from 'vue'

const { isReadOnly, activeWorkspace, events } = useWorkspace()

const openCommandPaletteRequest = () => {
  events.commandPalette.emit({ commandName: 'Create Request' })
}

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.openCommandPaletteRequest) openCommandPaletteRequest()
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
        Scalar V{{ packageVersion }} <b>Beta</b> Release
        <div class="mt-1">
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
        v-if="!isReadOnly"
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
  transform: skew(0deg, 16deg);
  width: 66px;
  height: 66px;
  position: absolute;
  margin-left: -33px;
  font-size: 8px;
  font-family: var(--scalar-font-code);
  line-height: 11px;
  margin-top: -110px;
}
.scalar-version-number b {
  font-weight: bold;
}
</style>

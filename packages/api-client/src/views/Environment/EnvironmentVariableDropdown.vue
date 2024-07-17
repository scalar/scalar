<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import Fuse from 'fuse.js'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  query: string
  // withServers?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', variable: string): void
}>()

const { activeParsedEnvironments } = useWorkspace()
const router = useRouter()

const fuse = new Fuse(activeParsedEnvironments.value, {
  keys: ['key', 'value'],
})

const filteredVariables = computed(() => {
  const searchQuery = props.query

  if (!searchQuery) {
    /** return the last 4 environment variables on first display */
    return activeParsedEnvironments.value.slice(-4)
  }

  /** filter environment variables by name */
  const result = fuse.search(searchQuery)
  if (result.length > 0) {
    return result.map((res) => res.item)
  }

  return []
})

const selectVariable = (variableKey: string) => {
  emit('select', variableKey)
}
</script>
<template>
  <dialog
    id="env-dialog"
    class="z-10 w-60 rounded border bg-b-1 p-1"
    :open="true"
    tabindex="0">
    <ul v-if="filteredVariables.length">
      <template
        v-for="(item, index) in filteredVariables"
        :key="index">
        <li
          class="font-code text-3xs hover:bg-b-2 flex cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
          @click="selectVariable(item.key)">
          <!-- @click.stop="selectVariable(variable)" -->
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <!-- :class="`bg-${environments[item._scalarEnvId as string].color}`" -->
            <span class="h-2.5 w-2.5 min-w-2.5 rounded-full"></span>
            {{ item.key }}
          </div>
          <span class="w-20 overflow-hidden text-ellipsis text-right">
            {{ item.value }}
          </span>
        </li>
      </template>
    </ul>
    <ScalarButton
      v-else
      class="font-code text-3xs hover:bg-b-2 flex h-7 w-full justify-start gap-2 px-2 transition-colors duration-150"
      variant="secondary"
      @click="router.push('/environment')">
      <ScalarIcon
        class="w-2"
        icon="Add"
        size="xs" />
      Add variable
    </ScalarButton>
  </dialog>
</template>

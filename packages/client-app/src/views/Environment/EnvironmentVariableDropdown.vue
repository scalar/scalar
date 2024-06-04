<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import Fuse from 'fuse.js'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  query: string
}>()
const emit = defineEmits<{
  (e: 'select', variable: string): void
}>()

const { environments } = useWorkspace()
const router = useRouter()
const dialogVisible = ref(false)

const fuse = new Fuse(Object.values(environments), {
  /** search by both name and value */
  keys: ['name', 'value'],
})

const filteredVariables = computed(() => {
  /** extract the query between {{ and }} */
  const match = props.query.match(/{{\s*(.*?)\s*(}}|$)/)
  const searchQuery = match ? match[1].trim() : ''

  if (!searchQuery) {
    /** return the last 4 environment variables on first display */
    return Object.values(environments).slice(-4)
  }

  /** filter environment variables by name */
  const result = fuse.search(searchQuery)
  if (result.length > 0) {
    return result.map((res) => res.item)
  }

  return []
})

const selectVariable = (variable: { name: string }) => {
  emit('select', variable.name)
  dialogVisible.value = false
}

watch(
  () => props.query,
  (newQuery) => {
    dialogVisible.value = newQuery.includes('{{')
  },
)
</script>
<template>
  <dialog
    id="env-dialog"
    class="absolute left-2 top-7 z-10 w-60 rounded border bg-white p-1"
    :open="dialogVisible"
    tabindex="0">
    <ul v-if="filteredVariables.length">
      <li
        v-for="variable in filteredVariables"
        :key="variable.uid"
        class="font-code text-3xs hover:bg-b-2 flex cursor-pointer items-center justify-between gap-1.5 rounded p-1.5 transition-colors duration-150"
        @click.stop="selectVariable(variable)">
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span
            class="h-2.5 w-2.5 min-w-2.5 rounded-full"
            :class="`bg-${variable.color}`"></span>
          {{ variable.name }}
        </div>
        <span class="w-20 overflow-hidden text-ellipsis text-right">
          {{ variable.raw }}</span
        >
      </li>
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

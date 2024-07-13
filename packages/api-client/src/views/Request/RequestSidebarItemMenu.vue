<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'

const props = defineProps<{
  item: Request | RequestExample
}>()
const { createExampleFromRequest, requestMutators } = useWorkspace()

const addExample = () => {
  if (!('summary' in props.item)) return

  const example = createExampleFromRequest(props.item)

  requestMutators.edit(props.item.uid, 'childUids', [
    ...props.item.childUids,
    example.uid,
  ])

  // TOOD route to example?
}

const handleItemRename = () => {
  console.log('rename')
}

const handleItemDuplicate = () => {
  console.log('duplicate')
}

const handleItemDelete = () => {
  console.log('delete')
}

const isRequest = computed(() => 'summary' in props.item)
</script>

<template>
  <ScalarDropdown teleport="#scalar-client">
    <ScalarButton
      class="z-10 hover:bg-b-3 transition-none p-1 group-hover:flex ui-open:flex absolute left-0 hidden -translate-x-full -ml-1"
      size="sm"
      variant="ghost"
      @click.stop>
      <ScalarIcon
        icon="Ellipses"
        size="sm" />
    </ScalarButton>
    <template #items>
      <ScalarDropdownItem
        v-if="isRequest"
        class="flex !gap-2"
        @click="addExample">
        <ScalarIcon
          class="inline-flex !stroke-[1.5]"
          icon="Add"
          size="sm" />
        <span>Add Example</span>
      </ScalarDropdownItem>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="inline-flex !stroke-[1.5]"
          icon="Edit"
          size="sm" />
        <span>Rename</span>
      </ScalarDropdownItem>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="inline-flex !stroke-[1.5]"
          icon="Duplicate"
          size="sm" />
        <span>Duplicate</span>
      </ScalarDropdownItem>
      <ScalarDropdownDivider />
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="inline-flex !stroke-[1.5]"
          icon="Trash"
          size="sm" />
        <span>Delete</span>
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>

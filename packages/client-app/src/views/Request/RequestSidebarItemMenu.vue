<script setup lang="ts">
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import {
  type RequestExample,
  type RequestRef,
  createRequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'

const props = defineProps<{
  item: RequestRef | RequestExample
}>()
const { requestMutators } = useWorkspace()

const addExample = () => {
  if (!('summary' in props.item)) return

  const example = createRequestExample(props.item)

  requestMutators.edit(props.item.uid, 'examples', {
    ...props.item.examples,
    [example.uid]: example,
  })
  requestMutators.edit(props.item.uid, 'children', [
    ...props.item.children,
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
  <ScalarDropdown
    class="group-dropdown left-10 top-20"
    placement="left"
    resize>
    <ScalarButton
      class="z-10 hover:bg-b-3 transition-none p-1 group-hover:flex group-has-[.group-dropdown]:flex absolute left-0 hidden -translate-x-full -ml-1"
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
          class="text-c-2 inline-flex p-[1px]"
          icon="Add"
          size="xs" />
        <span>Add Example</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="1"
          @hotkeyPressed="addExample" />
      </ScalarDropdownItem>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="text-c-2 inline-flex p-[1px]"
          icon="Edit"
          size="xs" />
        <span>Rename</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="2"
          @hotkeyPressed="handleItemRename" />
      </ScalarDropdownItem>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="text-c-2 inline-flex p-[1px]"
          icon="Duplicate"
          size="xs" />
        <span>Duplicate</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="3"
          @hotkeyPressed="handleItemDuplicate" />
      </ScalarDropdownItem>
      <ScalarDropdownDivider />
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="text-c-2 inline-flex p-[1px]"
          icon="Trash"
          size="xs" />
        <span>Delete</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="4"
          @hotkeyPressed="handleItemDelete" />
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>

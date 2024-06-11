<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'

withDefaults(
  defineProps<{
    defaultOpen?: boolean
    itemCount?: number
  }>(),
  {
    defaultOpen: true,
    itemCount: 0,
  },
)
</script>
<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="focus-within:bg-b-2 focus-within:text-c-1 text-c-2 rounded request-item ui-not-open:bg-transparent ui-open:pb-1 ui-open:mb-3 ui-not-open:mb-0 ui-not-open:pb-0"
    :defaultOpen="defaultOpen">
    <DisclosureButton
      class="hover:text-c-1 group flex w-full items-center gap-1.5 overflow-hidden py-1.5 text-sm font-medium px-1.5">
      <ScalarIcon
        class="text-c-3 group-hover:text-c-1 ui-open:rotate-90 ui-not-open:rotate-0"
        icon="ChevronRight"
        size="sm" />
      <div class="flex flex-1 items-center gap-1.5">
        <slot
          name="title"
          :open="open" />
        <span
          v-if="!open && itemCount"
          class="bg-b-2 text-c-2 text-3xs inline-flex h-4 w-4 items-center justify-center rounded-full font-semibold">
          {{ itemCount }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <div
          v-if="$slots.actions"
          class="ui-not-open:invisible -my-1 flex items-center gap-2">
          <slot
            name="actions"
            :open="open" />
        </div>
      </div>
    </DisclosureButton>
    <DisclosurePanel class="rounded-b">
      <slot :open="open" />
    </DisclosurePanel>
  </Disclosure>
</template>

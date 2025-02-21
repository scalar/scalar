<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'

const {
  defaultOpen = true,
  itemCount = 0,
  layout = 'client',
} = defineProps<{
  defaultOpen?: boolean
  itemCount?: number
  layout?: 'client' | 'reference'
}>()
</script>
<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="focus-within:text-c-1 text-c-2 request-item border-b"
    :class="{ 'first:border-t': layout === 'client' }"
    :defaultOpen="defaultOpen"
    :static="layout === 'reference'">
    <div class="bg-b-2 flex items-center">
      <DisclosureButton
        :class="[
          'group hover:text-c-1 flex flex-1 items-center gap-2.5 overflow-hidden py-1.5 text-sm font-medium max-h-8 px-1 md:px-1.5 xl:pl-2 xl:pr-0.5 outline-none',
          { '!pl-3': layout === 'reference' },
        ]"
        :disabled="layout === 'reference'">
        <ScalarIcon
          v-if="layout !== 'reference'"
          :class="[
            'text-c-3 group-hover:text-c-1 group-focus-visible:outline ui-open:rotate-90 ui-not-open:rotate-0 rounded-px outline-offset-2',
          ]"
          icon="ChevronRight"
          size="md" />
        <div class="flex flex-1 items-center gap-1.5 text-c-1">
          <slot
            name="title"
            :open="open" />
          <span
            v-if="!open && itemCount"
            class="bg-b-2 text-c-2 text-3xs inline-flex h-4 w-4 items-center justify-center rounded-full font-semibold border">
            {{ itemCount }}
          </span>
        </div>
      </DisclosureButton>
      <div
        v-if="$slots.actions"
        class="ui-not-open:invisible flex items-center gap-2 pr-1.5">
        <slot
          name="actions"
          :open="open" />
      </div>
    </div>

    <DisclosurePanel
      v-bind="$attrs"
      class="h-full max-h-fit rounded-b diclosure-panel">
      <slot :open="open" />
    </DisclosurePanel>
  </Disclosure>
</template>

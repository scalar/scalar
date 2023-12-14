<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'

import CardFormButton from './CardFormButton.vue'

defineProps<{
  scopes: { [scope: string]: string }
}>()
</script>
<template>
  <Listbox>
    <ListboxButton :as="CardFormButton">Scopes</ListboxButton>
    <ListboxOptions class="dropdown">
      <ListboxOption
        v-for="[key, description] in Object.entries(scopes)"
        :key="key"
        :value="key">
        {{ key }}
        {{ description }}
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>
<style scoped></style>

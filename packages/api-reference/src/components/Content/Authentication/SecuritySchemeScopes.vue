<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { onMounted, ref } from 'vue'

import { ResetStyles } from '../../../../../swagger-editor/dist'
import CardFormButton from './CardFormButton.vue'

defineProps<{
  scopes: { [scope: string]: string }
}>()

const trigger = ref()
const dropdown = ref()

onMounted(() => console.log(trigger.value))

const { floatingStyles } = useFloating(trigger, dropdown, {
  placement: 'bottom-end',
  whileElementsMounted: autoUpdate,
  middleware: [offset(5), flip(), shift()],
})
</script>
<template>
  <Listbox multiple>
    <div
      ref="trigger"
      class="wrapper">
      <ListboxButton :as="CardFormButton"> Scopes </ListboxButton>
    </div>
    <Teleport to="#app">
      <ResetStyles v-slot="{ styles: resetStyles }">
        <div
          ref="dropdown"
          class="floating"
          :class="resetStyles"
          :style="floatingStyles">
          <ListboxOptions
            as="dl"
            class="dropdown">
            <ListboxOption
              v-for="[key, description] in Object.entries(scopes)"
              :key="key"
              as="div"
              class="dropdown-item"
              :value="key">
              <dt>{{ key }}</dt>
              <dd>{{ description }}</dd>
            </ListboxOption>
          </ListboxOptions>
        </div>
      </ResetStyles>
    </Teleport>
  </Listbox>
</template>
<style scoped>
:where(.wrapper) {
  display: grid;
  border-color: inherit;
}
.floating {
  position: relative;
  z-index: 100;
}
.dropdown {
  background: var(--theme-background-1, var(--default-theme-background-1));
  filter: brightness(
    var(--theme-lifted-brightness, var(--default-theme-lifted-brightness))
  );
  border-radius: var(--theme-radius, var(--default-theme-radius));
  box-shadow: var(--theme-shadow-2, var(--default-theme-shadow-2));
  width: 160px;
  padding: 3px;
  font-style: normal;

  display: flex;
  flex-direction: column;
}
</style>

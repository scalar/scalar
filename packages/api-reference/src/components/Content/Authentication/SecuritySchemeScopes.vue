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
              v-slot="{ selected }"
              as="div"
              class="dropdown-item"
              :value="key">
              <input
                :checked="selected"
                class="dropdown-item-check"
                tabindex="-1"
                type="checkbox" />
              <dt class="dropdown-item-title">{{ key }}</dt>
              <dd class="dropdown-item-description">{{ description }}</dd>
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
  padding: 4px;
  font-style: normal;

  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dropdown-item {
  display: grid;
  grid-template-areas:
    'check title'
    'check description';
  grid-template-columns: auto 1fr;

  padding: 6px 10px 8px 6px;

  row-gap: 2px;
  column-gap: 8px;

  border-radius: var(--theme-radius, var(--default-theme-radius));

  font-size: var(--theme-mini, var(--default-theme-mini));

  cursor: pointer;
}
.dropdown-item[data-headlessui-state='active'],
.dropdown-item[data-headlessui-state='active selected'] {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.dropdown-item-title {
  grid-area: title;

  color: var(--theme-color-1, var(--default-theme-color-1));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
}
.dropdown-item-description {
  grid-area: description;

  color: var(--theme-color-2, var(--default-theme-color-2));
  line-height: initial;
}
.dropdown-item-check {
  all: unset;

  position: relative;
  grid-area: check;

  width: 20px;
  height: 20px;

  color: var(--theme-color-2, var(--default-theme-color-2));
  background: var(--theme-background-1, var(--default-theme-background-1));
  border: 1px solid var(--theme-border-color, var(--default-theme-border-color));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.dropdown-item-check:checked:after {
  content: '';
  position: absolute;
  border-bottom: 1.5px solid currentColor;
  border-right: 1.5px solid currentColor;
  width: 6px;
  height: 12px;
  top: calc(50% - 1.5px);
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
}
.dropdown-item-check:checked {
  background: var(--theme-color-accent, var(--default-theme-color-accent));
  color: var(--theme-background-1, var(--default-theme-background-1));
  border: 1px solid currentColor;
}
</style>

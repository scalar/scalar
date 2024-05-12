<script setup lang="ts">
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { ResetStyles } from '@scalar/themes'
import { computed, ref } from 'vue'

import { Badge } from '../../../Badge'
import CardFormButton from './CardFormButton.vue'

const props = defineProps<{
  scopes: { [scope: string]: string }
  selected: string[]
}>()

const emit = defineEmits<{
  (e: 'update:selected', v: string[]): void
}>()

const trigger = ref()
const dropdown = ref()

const { floatingStyles } = useFloating(trigger, dropdown, {
  placement: 'bottom-end',
  whileElementsMounted: autoUpdate,
  middleware: [offset(5), flip(), shift()],
})

const model = computed({
  get: () => props.selected,
  set: (v) => emit('update:selected', v),
})
</script>
<template>
  <Listbox
    v-slot="{ open }"
    v-model="model"
    multiple>
    <div
      ref="trigger"
      class="wrapper"
      :class="{ 'wrapper-open': open }">
      <ListboxButton :as="CardFormButton">
        <div class="scopes-label">
          Scopes
          {{ model.length }}<em>/</em>{{ Object.entries(scopes).length }}
          <ScalarIcon
            :icon="open ? 'ChevronUp' : 'ChevronDown'"
            size="sm" />
        </div>
      </ListboxButton>
    </div>
    <Teleport to="body">
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
              v-slot="{ selected: s }"
              as="div"
              class="dropdown-item"
              :value="key">
              <input
                :checked="s"
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
.scopes-label {
  display: inline-flex;
  align-items: center;
  height: 1em;
  line-height: 1;
  gap: 4px;
}
.scopes-label-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.scopes-label-badge em {
  transform: rotate(10deg) translate(0, -0.9px);
}
.floating {
  position: relative;
  z-index: 1010;
}
.dropdown {
  background: var(--scalar-background-1);
  filter: brightness(var(--scalar-lifted-brightness));
  border-radius: var(--scalar-radius);
  box-shadow: var(--scalar-shadow-2);
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

  border-radius: var(--scalar-radius);

  font-size: var(--scalar-mini);

  cursor: pointer;
}
.dropdown-item[data-headlessui-state='active'],
.dropdown-item[data-headlessui-state='active selected'] {
  background: var(--scalar-background-2);
}
.dropdown-item-title {
  grid-area: title;

  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
}
.dropdown-item-description {
  grid-area: description;

  color: var(--scalar-color-2);
  line-height: initial;
}
.dropdown-item-check {
  all: unset;

  position: relative;
  grid-area: check;

  width: 20px;
  height: 20px;

  color: var(--scalar-color-2);
  background: var(--scalar-background-1);
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
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
  background: var(--scalar-color-accent);
  color: var(--scalar-background-1);
  border: 1px solid currentColor;
}
</style>

<script lang="ts" setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    defaultOpen?: boolean
  }>(),
  {
    defaultOpen: true,
  },
)

const collapseButton = ref<typeof DisclosureButton | null>(null)
const disclosureButton = ref<typeof Disclosure | null>(null)

const openCopy = ref(props.defaultOpen)

watch(
  () => props.defaultOpen,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue !== openCopy.value) {
      collapseButton.value?.el.click()
    }
  },
)
</script>

<template>
  <Disclosure
    ref="disclosureButton"
    v-slot="{ open }"
    :defaultOpen="defaultOpen">
    <div
      class="scalar-api-client__item"
      :class="{ 'scalar-api-client__item--open': open }">
      <DisclosureButton
        ref="collapseButton"
        class="scalar-api-client__toggle"
        @click="openCopy = !openCopy">
        <svg
          class="scalar-api-client__toggle__icon"
          height="10"
          viewBox="0 0 5 10"
          width="5"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 10l5-5-5-5z"
            fill="currentColor"
            fill-rule="nonzero" />
        </svg>
        <span class="scalar-api-client__item__title">
          {{ title }}
        </span>
        <div
          v-if="$slots.options && open"
          class="scalar-api-client__item__options">
          <slot name="options" />
        </div>
      </DisclosureButton>
      <DisclosurePanel>
        <div class="scalar-api-client__item__content">
          <slot />
        </div>
      </DisclosurePanel>
    </div>
  </Disclosure>
</template>

<style>
.scalar-api-client__item {
  border-radius: var(--scalar-radius);
  margin-bottom: 6px;
  position: relative;
}

.scalar-api-client__item button {
  background-color: transparent;
  text-align: left;
}
.scalar-api-client__item:hover {
  cursor: pointer;
}
.scalar-api-client__toggle:after {
  content: '';
  position: absolute;
  bottom: -6.5px;
  width: 100%;
  height: 6px;
  left: 0;
}
.scalar-api-client__item--open .scalar-api-client__toggle:after {
  display: none;
}
.scalar-api-client__item:hover,
.scalar-api-client__item--open {
  background: var(--scalar-background-2);
}

.scalar-api-client__item--open .scalar-api-client__item__content {
  display: flex;
}

.scalar-api-client__item--open:hover {
  cursor: default;
}

.scalar-api-client__item--open .scalar-api-client__toggle__icon {
  transform: rotate(90deg);
}
.scalar-api-client__toggle {
  padding: 6px;
  min-height: 37px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
  appearance: none;
  outline: 0;
  border: none;
  font-family: var(--scalar-font);
  cursor: pointer;
}

.scalar-api-client__item .scalar-api-client__item__title {
  color: var(--scalar-color-1);
  font-size: var(--scalar-small);
  font-weight: var(--scalar-semibold);
  font-family: var(--scalar-font);
  user-select: none;
  flex: 1;
  position: relative;
  z-index: 1;
}
.scalar-api-client__item .scalar-api-client__toggle__icon {
  width: 10px;
  margin-right: 6px;
  color: var(--scalar-color-3);
  z-index: 1;
  position: relative;
}
.scalar-api-client__toggle:hover .scalar-api-client__toggle__icon {
  color: var(--scalar-color-1);
}

.scalar-api-client__item__options {
  position: relative;
  z-index: 1;
}

.scalar-api-client__item__options span {
  background: transparent;
  padding: 2px 0;
  border-radius: 3px;
  font-size: var(--scalar-small);
  pointer-events: none;
  color: var(--scalar-color-2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.scalar-api-client__item__options:hover span {
  color: var(--scalar-color-1);
  border-color: currentColor;
}
.scalar-api-client__item__options span svg {
  width: 15px;
  height: 15px;
  margin-left: 3px;
}

.scalar-api-client__item__options select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}
.scalar-api-client__item__content .scalar-api-client__codemirror__wrapper {
  padding-top: 0;
}
</style>

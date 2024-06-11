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
      <div class="scalar-api-client-item-topbar">
        <DisclosureButton
          ref="collapseButton"
          class="scalar-api-client__toggle"
          @click="openCopy = !openCopy">
          <div class="scalar-api-client__toggle-container">
            <svg
              class="scalar-api-client__toggle__icon"
              fill="none"
              viewBox="0 0 12 12"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M2.2 4.1 6 7.9l3.8-3.8"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"></path>
            </svg>
            <span class="scalar-api-client__item__title">
              {{ title }}
            </span>
          </div>
        </DisclosureButton>
      </div>
      <div
        v-if="$slots.options && open"
        class="scalar-api-client__item__options">
        <slot name="options" />
      </div>
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
  position: relative;
  margin-bottom: 6px;
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
.scalar-api-client__toggle-container {
  display: flex;
  align-items: center;
  width: 100%;
}
.scalar-api-client__item--open .scalar-api-client__toggle:after {
  display: none;
}

.scalar-api-client__item--open .scalar-api-client__item__content {
  display: flex;
}

.scalar-api-client__item--open:hover {
  cursor: default;
}
.scalar-api-client__toggle {
  padding: 0 9px;
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  appearance: none;
  outline: 0;
  border: none;
  font-family: var(--scalar-font);
  cursor: pointer;
}
.scalar-api-client__item .scalar-api-client__item__title {
  color: var(--scalar-color-2);
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  font-family: var(--scalar-font);
  user-select: none;
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 6px 0;
}
.scalar-api-client__item:hover .scalar-api-client__item__title,
.scalar-api-client__item--open .scalar-api-client__item__title {
  color: var(--scalar-color-1);
}
.scalar-api-client__item .scalar-api-client__toggle__icon {
  width: 20px;
  padding: 3px;
  color: var(--scalar-color-3);
  z-index: 1;
  position: relative;
  transform: rotate(-90deg);
  margin: 5px 0 5px -4.5px;
}
.scalar-api-client__item--open .scalar-api-client__toggle__icon {
  transform: rotate(0deg);
}
.scalar-api-client__toggle:hover .scalar-api-client__toggle__icon {
  color: var(--scalar-color-1);
}

.scalar-api-client__item__options {
  position: relative;
  z-index: 1;
  margin: 0 0 0 24px;
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-2);
  padding: 6px 9px;
  border: 0.5px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius) var(--scalar-radius) 0 0;
}
.scalar-api-client__item__options
  .security-scheme-selector
  .security-scheme-label {
  color: var(--scalar-color-2);
}
.scalar-api-client__item__options + div .scalar-api-client__item__content {
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  border-top: none;
}
.scalar-api-client__item__options:has(
    + div .scalar-api-client__item__content:empty
  ) {
  border-radius: var(--scalar-radius);
}
.scalar-api-client__item__options span {
  background: transparent;
  padding: 2px 0;
  border-radius: 3px;
  font-size: var(--scalar-small);
  pointer-events: none;
  color: var(--scalar-color-3);
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
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
.scalar-api-client-item-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.scalar-api-client__main__left
  .scalar-api-client__item--open
  .scalar-api-client-item-topbar {
}
</style>

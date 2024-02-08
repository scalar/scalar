<script setup lang="ts">
import { type ThemeId, availableThemes } from '@scalar/themes'
import { computed } from 'vue'

type ApiClientConfig = {
  proxyUrl?: string
  readOnly?: boolean
  theme?: ThemeId
}

const props = defineProps<{
  modelValue: ApiClientConfig
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: ApiClientConfig): void
}>()

/** Computed config proxy for v-model
 * @see https://skirtles-code.github.io/vue-examples/patterns/computed-v-model.html#advanced-usage-proxying-objects */
const config = computed(
  () =>
    new Proxy(props.modelValue, {
      set(obj, key, value) {
        emit('update:modelValue', { ...obj, [key]: value })
        return true
      },
    }),
)

const enableProxy = computed<boolean>({
  get: () => !!config.value.proxyUrl,
  set: (enable) =>
    (config.value.proxyUrl = enable ? 'http://localhost:5051' : undefined),
})
</script>
<template>
  <div>
    <input
      v-model="config.readOnly"
      type="checkbox" />
    readOnly
  </div>
  <div>
    <input
      v-model="enableProxy"
      type="checkbox" />
    enableProxy
  </div>
  <div>
    Theme:
    <select v-model="config.theme">
      <option
        v-for="theme in availableThemes"
        :key="theme"
        :value="theme">
        {{ theme }}
      </option>
    </select>
  </div>
</template>

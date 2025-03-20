<script setup lang="ts">
const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const examples = [
  {
    title: 'Check the status code',
    script: `pm.test("Status code is 200", () => {
  pm.response.to.have.status(200)
})`,
  },
  {
    title: 'Check response time',
    script: `pm.test("Response time is acceptable", () => {
  pm.expect(pm.response.responseTime).to.be.below(200)
})`,
  },
  {
    title: 'Check JSON response',
    script: `pm.test("Response is valid JSON", () => {
  const responseData = pm.response.json()
  pm.expect(responseData).to.be.an('object')
})`,
  },
  {
    title: 'Check response headers',
    script: `pm.test("Content-Type header is present", () => {
  pm.response.to.have.header('Content-Type')
})`,
  },
  {
    title: 'Validate JSON schema',
    script: `pm.test("Response matches schema", () => {
  const schema = {
    required: ['id', 'name'],
    properties: {
      id: { type: 'number' },
      name: { type: 'string' }
    }
  }
  pm.response.to.have.jsonSchema(schema)
})`,
  },
  {
    title: 'Check response body',
    script: `pm.test("Response body contains string", () => {
  pm.expect(pm.response.text()).to.include('success')
})`,
  },
  {
    title: 'Successful POST request',
    script: `pm.test("Successful POST request", () => {
  pm.expect(pm.response.code).to.be.oneOf([201, 202])
})`,
  },
]

const addExample = (example: string) => {
  let addition = example
  // Look at current value. If it's not empty, add a new line.
  if (props.modelValue.trim() !== '') {
    addition = `\n\n${addition}`
  }

  emit('update:modelValue', props.modelValue.trim() + addition)
}
</script>

<template>
  <ul class="flex flex-wrap gap-1">
    <li
      v-for="example in examples"
      :key="example.title"
      class="bg-b-2 text-c-2 hover:bg-b-3 inline-flex flex-col rounded-full px-3 py-1 text-xs font-medium">
      <button
        type="button"
        class="w-full"
        @click="addExample(example.script)">
        {{ example.title }}
      </button>
    </li>
  </ul>
</template>

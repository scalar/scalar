<script setup lang="ts">
defineProps<{
  timings: Record<string, number>
}>()
</script>

<template>
  <h2 class="my-4 font-bold">Timings</h2>
  <table class="min-w-full border text-sm">
    <thead>
      <tr>
        <th class="border px-2 py-1 text-left">Operation</th>
        <th class="border px-2 py-1 text-center">Duration</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(duration, name) in timings"
        :key="name">
        <td class="border px-2 py-1">{{ name }}</td>
        <td class="border px-2 py-1 text-center">{{ duration }}ms</td>
      </tr>
    </tbody>
    <tr class="font-bold">
      <td class="border px-2 py-1">Total</td>
      <td class="border px-2 py-1 text-center">
        {{
          Object.values(timings).reduce((sum, duration) => sum + duration, 0)
        }}ms
      </td>
    </tr>
  </table>
</template>

<script setup lang="ts"></script>

<template>
  <div>
    <h1>This is just a dummy page</h1>

    <button
      type="button"
      @click="$emit('newTab', 'stuff')">
      New Tab
    </button>
  </div>
</template>

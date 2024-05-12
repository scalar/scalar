<template>
  <form class="card-form">
    <slot />
  </form>
</template>
<style scoped>
.card-form {
  color: var(--scalar-color-1);
  width: 100%;
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
}
</style>

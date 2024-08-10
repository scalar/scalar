<template>
  <form class="card-form">
    <slot />
  </form>
</template>
<style scoped>
.card-form {
  color: var(--scalar-color-1);
  width: 100%;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  background-color: var(--scalar-background-2);
}
.card-form:focus-within {
  background-color: var(--scalar-background-1);
}
</style>

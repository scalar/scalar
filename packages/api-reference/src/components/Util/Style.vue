<!--
  Style tag injection utility

  We have to use this to inject stylesheets dynamically into the
  page right now because we can't inject into <head> in SSR

  Warn: this does NOT work on SSR, we shouldn't use this component
-->
<template>
  <component :is="'style'"><slot /></component>
</template>

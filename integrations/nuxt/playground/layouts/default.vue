<template>
  <div>
    <header>
      <p>This is an example header</p>
      <nav>
        <NuxtLink to="/scalar-a">Config A</NuxtLink>
        <NuxtLink to="/scalar-b">Config B</NuxtLink>
      </nav>
    </header>
    <NuxtPage />
  </div>
</template>

<style>
header {
  width: 100%;
  height: 50px;
  color: white;
  background-color: black;
  font-family: sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  border: hotpink 1px solid;
  p {
    margin: 0;
  }
}
</style>

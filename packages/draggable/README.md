# Scalar Draggable component

[![Version](https://img.shields.io/npm/v/%40scalar/draggable)](https://www.npmjs.com/package/@scalar/draggable)
[![Downloads](https://img.shields.io/npm/dm/%40scalar/draggable)](https://www.npmjs.com/package/@scalar/draggable)
[![License](https://img.shields.io/npm/l/%40scalar%2Fdraggable)](https://www.npmjs.com/package/@scalar/draggable)
[![Discord](https://img.shields.io/discord/1135330207960678410?style=flat&color=5865F2)](https://discord.gg/scalar)

## Installation

```bash
npm install @scalar/draggable
```

## Usage

A complete example can be found the [playground](https://github.com/scalar/scalar/tree/main/packages/draggable/playground), but basically you need a data structure like:

```ts
const sidebar = ref({
  // Master list of all items
  items: {
    '1': {
      id: '1',
      name: 'Rangers',
      children: ['2', '4', '5', '6', '7'],
    },
    '2': {
      id: '2',
      name: 'Stars',
      children: ['3'],
    },
    '3': { id: '3', name: 'Bruins', children: [] },
    '4': { id: '4', name: 'Canucks', children: [] },
    '5': { id: '5', name: 'Panthers', children: [] },
    '6': { id: '6', name: 'Avalanche', children: [] },
    '7': { id: '7', name: 'Hurricanes', children: [] },
    '8': { id: '8', name: 'Jets', children: [] },
    '9': { id: '9', name: 'Oilers', children: [] },
    '10': { id: '10', name: 'Predators', children: [] },
    '11': { id: '11', name: 'Maple Leafs', children: [] },
    '12': { id: '12', name: 'Kings', children: [] },
  } satisfies Items,
  // Root level children (the top level of the sidebar)
  children: ['1', '8', '9', '10', '11', '12'],
})
```

Then you will need a recursive component that wraps Draggable like:

```vue
<template>
  <Draggable
    :id="id"
    :ceiling="0.8"
    :floor="0.2"
    :height="30"
    :parentIds="[...parentIds, id]">
    <div
      class="sidebar-item"
      :class="{ 'sidebar-folder': items[id].children.length }">
      {{ items[id].name }}
      <SidebarItem
        v-for="childId in items[id].children"
        :id="childId"
        :key="childId"
        :items="items"
        :parentIds="[...parentIds, id]" />
    </div>
  </Draggable>
</template>
```

Then manage the data manipluation on drop using the emitted events!

### Example

You can find an example in this repo under the [playground](https://github.com/scalar/scalar/tree/main/packages/draggable/playground)

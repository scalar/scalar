// TODO: import { getLocation, createStore, createOperationBlock } from '@scalar/api-reference/blocks'
import {
  createOperationBlock,
  createStore,
  getLocation,
} from '../../../src/blocks'
// TODO: import '@scalar/blocks/style.css'
import '../../../src/blocks/assets/style.css'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

// TODO: Support for multiple API definitions
// const store = createStore([
//     {
//         name: 'scalar-galaxy',
//         url: 'http://jsdevli.rcom/',
//     }
// ])

const operationBlock = createOperationBlock({
  // If passed, the block will mount to the element during initialization.
  // element: '#scalar-api-reference',
  store,
  location: getLocation('GET', '/planets/{planetId}'),
})

// Mount it after initialization with just a selector string …
operationBlock.mount('#scalar-api-reference')
// or a DOM element:
// operationBlock.mount(document.getElementById('scalar-api-reference'))

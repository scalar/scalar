// import { getLocation, createStore, createOperationBlock } from '@scalar/api-reference/blocks'
import { toRaw } from 'vue'

import {
  createOperationBlock,
  createStore,
  getLocation,
} from '../../../src/blocks'

const { store } = createStore({
  url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
})

// TODO: Support for multiple API definitions
// const store = createStore([
//     {
//         name: 'scalar-galaxy',
//         url: 'http://jsdevli.rcom/',
//         location: getLocation('GET', '/planets/1')
//     }
// ])

const operationBlock = createOperationBlock({
  element: '#scalar-api-reference',
  store,
  location: getLocation('GET', '/planets/1'),
})

// operationBlock.mount('#scalar-api-reference')

// // OperationBlock.vue
// // Doesn’t have markup

// defineProps<{
//     store: StoreContext
//     location: string,
// }>()

// // * create examples for

// <Section>
//     <OperationDetails>
//     <CodeExamples>
//     <ExampleResponses>
// </Section>

// // OperationDetails.vue

// defineProps<{
//     operation: OperationEntity
// }>()

// <h1>{{ operation.summary }}</h1>

// // Code examples

// defineProps({
//     store: StoreContext
//     location: string,
// })

// // CodeExamplesServerSelect

// defineProps({
//     activeServer,
//     servers,
// })

// defineEmits({
//     updateSelectedServer: uid => void,
// })

// // Example responses

// TODO: import { getLocation, createStore, createOperationBlock } from '@scalar/api-reference/blocks'
import {
  createOperationBlock,
  createStore,
  getLocation,
} from '../../../src/blocks'
// TODO: import '@scalar/blocks/style.css'
import '../../../src/blocks/assets/style.css'

const { store } = createStore({
  // url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  url: 'https://petstore.swagger.io/v2/swagger.json',
  theme: 'purple',
  // content: JSON.stringify({
  //   openapi: '3.0.0',
  //   info: {
  //     title: 'Test API',
  //     version: '1.0.0',
  //   },
  //   paths: {
  //     '/test': {
  //       get: {
  //         summary: 'Test summary',
  //         description: 'Test description',
  //         responses: {
  //           '200': {
  //             description: 'OK',
  //           },
  //         },
  //       },
  //     },
  //   },
  // }),
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
  // location: getLocation('GET', '/planets/{planetId}'),
  // location: getLocation('POST', '/planets'),
  // location: getLocation('POST', '/user/signup'),
  // location: getLocation('POST', '/pet/{petId}/uploadImage'),
  // location: getLocation('GET', '/pet/findByStatus'),
  location: getLocation('DELETE', '/pet/{petId}'),
})

// Mount it after initialization with just a selector string …
operationBlock.mount('#scalar-api-reference')
// or a DOM element:
// operationBlock.mount(document.getElementById('scalar-api-reference'))

import {
  createCodeExamplesBlock,
  createExampleResponsesBlock,
  createOperationBlock,
  createSchemaBlock,
  createStore,
  getPointer,
} from '../../../src/blocks'
import '../../../src/blocks/assets/style.css'

document.addEventListener('DOMContentLoaded', () => {
  // Get all script tags with data-scalar attributes
  const scriptTags = document.querySelectorAll('script[data-scalar-collection]')

  scriptTags.forEach((script) => {
    const collectionName = script.getAttribute('data-scalar-collection')
    const url = script.getAttribute('data-scalar-url')

    if (collectionName && url) {
      // Create store for each collection
      const { store, addCollection } = createStore({
        theme: 'purple',
      })

      addCollection({
        name: collectionName,
        url: url,
      })

      // Get all divs with data-scalar-operation attributes
      const blocks = document.querySelectorAll(
        `div[data-scalar-collection="${collectionName}"]`,
      )

      blocks.forEach((div) => {
        const locationValue = div.getAttribute('data-scalar-pointer')

        const type = div.getAttribute('data-scalar-block')

        const [method, path] = locationValue?.split(' ') ?? []

        const location = getPointer(['paths', path, method])

        if (locationValue && type === 'operation') {
          // Create operation block for each operation
          const operationBlock = createOperationBlock({
            store,
            location,
            collection: collectionName,
          })

          // Mount the operation block to the div
          operationBlock.mount(div)
        } else if (type === 'code-examples') {
          const codeExampleBlock = createCodeExamplesBlock({
            store,
            location,
            collection: collectionName,
          })

          // Mount the code example block to the div
          codeExampleBlock.mount(div)
        } else if (type === 'example-responses') {
          const exampleResponsesBlock = createExampleResponsesBlock({
            store,
            location,
            collection: collectionName,
          })

          // Mount the code example block to the div
          exampleResponsesBlock.mount(div)
        } else if (type === 'schema') {
          const schemaBlock = createSchemaBlock({
            store,
            location: locationValue,
            collection: collectionName,
          })

          schemaBlock.mount(div)
        } else {
          console.error(`Unknown block type: data-scalar-block="${type}"`)
        }
      })
    }
  })
})

// TODO: import { getPointer, createStore, createOperationBlock } from '@scalar/api-reference/blocks'
// import {
//   createOperationBlock,
//   createStore,
//   getPointer,
// } from '../../../src/blocks'
// TODO: import '@scalar/blocks/style.css'
// import '../../../src/blocks/assets/style.css'

/*
const { store, add, addCollection } = createStore({
  // url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
  // url: 'https://petstore.swagger.io/v2/swagger.json',
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

addCollection({
  name: 'scalar-galaxy',
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
  // location: getPointer('GET', '/planets/{planetId}'),
  location: getPointer('POST', '/planets'),
  collection: 'scalar-galaxy',
  // location: getPointer('POST', '/user/signup'),
  // location: getPointer('POST', '/pet/{petId}/uploadImage'),
  // location: getPointer('GET', '/pet/findByStatus'),
  // location: getPointer('DELETE', '/pet/{petId}'),
})

// Mount it after initialization with just a selector string …
operationBlock.mount('#scalar-api-reference')
// or a DOM element:
// operationBlock.mount(document.getElementById('scalar-api-reference'))
*/

import {
  createCodeExamplesBlock,
  createOperationBlock,
  createSchemaBlock,
  createStore,
  getLocation,
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
      const operationDivs = document.querySelectorAll(
        `div[data-scalar-collection="${collectionName}"]`,
      )

      operationDivs.forEach((div) => {
        const locationValue = div.getAttribute('data-scalar-location')

        const block = div.getAttribute('data-scalar-block')

        const location = getLocation([
          'paths',
          ...(locationValue?.split(' ').reverse() ?? []),
        ])

        if (locationValue && block === 'operation') {
          // Create operation block for each operation
          const operationBlock = createOperationBlock({
            store,
            location,
            collection: collectionName,
          })

          // Mount the operation block to the div
          operationBlock.mount(div)
        } else if (block === 'code-examples') {
          const codeExampleBlock = createCodeExamplesBlock({
            store,
            location,
            collection: collectionName,
          })

          // Mount the code example block to the div
          codeExampleBlock.mount(div)
        } else if (block === 'schema') {
          const schemaBlock = createSchemaBlock({
            store,
            location: locationValue,
            collection: collectionName,
          })

          schemaBlock.mount(div)
        } else {
          console.error(`Unknown block type: data-scalar-block="${block}"`)
        }
      })
    }
  })
})

// TODO: import { getLocation, createStore, createOperationBlock } from '@scalar/api-reference/blocks'
// import {
//   createOperationBlock,
//   createStore,
//   getLocation,
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
  // location: getLocation('GET', '/planets/{planetId}'),
  location: getLocation('POST', '/planets'),
  collection: 'scalar-galaxy',
  // location: getLocation('POST', '/user/signup'),
  // location: getLocation('POST', '/pet/{petId}/uploadImage'),
  // location: getLocation('GET', '/pet/findByStatus'),
  // location: getLocation('DELETE', '/pet/{petId}'),
})

// Mount it after initialization with just a selector string …
operationBlock.mount('#scalar-api-reference')
// or a DOM element:
// operationBlock.mount(document.getElementById('scalar-api-reference'))
*/

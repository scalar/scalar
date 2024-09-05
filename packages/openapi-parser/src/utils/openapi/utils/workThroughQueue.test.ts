// TODO: Rewrite test for new helper method
// import { describe, expect, it } from 'vitest'

// import { dereference } from './dereference'
// import { load } from './load'
// import { upgrade } from './upgrade'
// import { validate } from './validate'
// import { workThroughQueue } from './workThroughQueue'

// describe('workThroughQueue', () => {
//   it('loads a specification', async () => {
//     const result = workThroughQueue({
//       specification: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       tasks: [
//         {
//           action: load,
//         },
//       ],
//     })

//     expect(await result).toStrictEqual({
//       errors: [],
//       filesystem: [
//         {
//           dir: './',
//           filename: null,
//           isEntrypoint: true,
//           references: [],
//           specification: {
//             info: {
//               title: 'Hello World',
//               version: '1.0.0',
//             },
//             openapi: '3.1.0',
//             paths: {},
//           },
//         },
//       ],
//     })
//   })

//   it('validates a specification', async () => {
//     const result = workThroughQueue({
//       specification: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       tasks: [
//         {
//           action: load,
//         },
//         {
//           action: validate,
//         },
//       ],
//     })

//     expect(await result).toStrictEqual({
//       errors: [],
//       valid: true,
//       version: '3.1',
//       filesystem: [
//         {
//           dir: './',
//           filename: null,
//           isEntrypoint: true,
//           references: [],
//           specification: {
//             info: {
//               title: 'Hello World',
//               version: '1.0.0',
//             },
//             openapi: '3.1.0',
//             paths: {},
//           },
//         },
//       ],
//       specification: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       schema: {
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         openapi: '3.1.0',
//         paths: {},
//       },
//     })
//   })

//   it('dereferences a specification', async () => {
//     const result = workThroughQueue({
//       specification: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       tasks: [
//         {
//           action: load,
//         },
//         {
//           action: dereference,
//         },
//       ],
//     })

//     expect(await result).toStrictEqual({
//       errors: [],
//       specificationType: 'openapi',
//       specificationVersion: '3.1.0',
//       version: '3.1',
//       filesystem: [
//         {
//           dir: './',
//           filename: null,
//           isEntrypoint: true,
//           references: [],
//           specification: {
//             info: {
//               title: 'Hello World',
//               version: '1.0.0',
//             },
//             openapi: '3.1.0',
//             paths: {},
//           },
//         },
//       ],
//       specification: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       schema: {
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         openapi: '3.1.0',
//         paths: {},
//       },
//     })
//   })

//   it('upgrades a specification', async () => {
//     const result = workThroughQueue({
//       specification: {
//         openapi: '3.0.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       tasks: [
//         {
//           action: load,
//         },
//         {
//           action: upgrade,
//         },
//       ],
//     })

//     expect(await result).toStrictEqual({
//       errors: [],
//       version: '3.1',
//       specification: {
//         openapi: '3.1.0',
//         info: {
//           title: 'Hello World',
//           version: '1.0.0',
//         },
//         paths: {},
//       },
//       filesystem: [
//         {
//           dir: './',
//           filename: null,
//           isEntrypoint: true,
//           references: [],
//           specification: {
//             info: {
//               title: 'Hello World',
//               version: '1.0.0',
//             },
//             openapi: '3.1.0',
//             paths: {},
//           },
//         },
//       ],
//     })
//   })
// })

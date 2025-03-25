import { describe } from 'vitest'

// import { OperationObjectSchema } from './operation-object'

describe('operation-object', () => {
  // TODO: Add 'Considerations for File Uploads': https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#considerations-for-file-uploads
  // TODO: Add this: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-url-encoded-form-with-json-values
  // TODO: Add this: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-url-encoded-form-with-binary-values
  // TODO: Add this: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-basic-multipart-form
  // TODO: Add this: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-multipart-form-with-encoding-objects
  // TODO: Add this: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#example-multipart-form-with-multiple-files
  // TODO: Causes strange error
  describe.todo('OperationObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#operation-object-example
    // it('Operation Object Example', () => {
    //   const result = OperationObjectSchema.parse({
    //     tags: ['pet'],
    //     summary: 'Updates a pet in the store with form data',
    //     operationId: 'updatePetWithForm',
    //     parameters: [
    //       {
    //         name: 'petId',
    //         in: 'path',
    //         description: 'ID of pet that needs to be updated',
    //         required: true,
    //         schema: {
    //           type: 'string',
    //         },
    //       },
    //     ],
    //     requestBody: {
    //       content: {
    //         'application/x-www-form-urlencoded': {
    //           schema: {
    //             type: 'object',
    //             properties: {
    //               name: {
    //                 description: 'Updated name of the pet',
    //                 type: 'string',
    //               },
    //               status: {
    //                 description: 'Updated status of the pet',
    //                 type: 'string',
    //               },
    //             },
    //             required: ['status'],
    //           },
    //         },
    //       },
    //     },
    //     responses: {
    //       200: {
    //         description: 'Pet updated.',
    //         content: {
    //           'application/json': {},
    //           'application/xml': {},
    //         },
    //       },
    //       405: {
    //         description: 'Method Not Allowed',
    //         content: {
    //           'application/json': {},
    //           'application/xml': {},
    //         },
    //       },
    //     },
    //     security: [
    //       {
    //         petstore_auth: ['write:pets', 'read:pets'],
    //       },
    //     ],
    //   })
    //   expect(result).toEqual({
    //     tags: ['pet'],
    //     summary: 'Updates a pet in the store with form data',
    //     operationId: 'updatePetWithForm',
    //     parameters: [
    //       {
    //         name: 'petId',
    //         in: 'path',
    //         description: 'ID of pet that needs to be updated',
    //         required: true,
    //         schema: {
    //           type: 'string',
    //         },
    //       },
    //     ],
    //     requestBody: {
    //       content: {
    //         'application/x-www-form-urlencoded': {
    //           schema: {
    //             type: 'object',
    //             properties: {
    //               name: {
    //                 description: 'Updated name of the pet',
    //                 type: 'string',
    //               },
    //               status: {
    //                 description: 'Updated status of the pet',
    //                 type: 'string',
    //               },
    //             },
    //             required: ['status'],
    //           },
    //         },
    //       },
    //     },
    //     responses: {
    //       200: {
    //         description: 'Pet updated.',
    //         content: {
    //           'application/json': {},
    //           'application/xml': {},
    //         },
    //       },
    //       405: {
    //         description: 'Method Not Allowed',
    //         content: {
    //           'application/json': {},
    //           'application/xml': {},
    //         },
    //       },
    //     },
    //     security: [
    //       {
    //         petstore_auth: ['write:pets', 'read:pets'],
    //       },
    //     ],
    //   })
    // })
  })
})

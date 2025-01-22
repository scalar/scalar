import SwaggerParser from '@apidevtools/swagger-parser'

import type { AnyObject } from '../../../src/index.ts'

export async function resolveOld(specification: AnyObject) {
  return await new Promise((resolve, reject) => {
    SwaggerParser.dereference(specification as never, (error, result) => {
      if (error) {
        reject(error)
      }

      if (result === undefined) {
        reject('Couldn’t parse the Swagger file.')

        return
      }

      resolve(result)
    })
  }).catch((error) => {
    console.error('[@apidevtools/swagger-parser]', error.message)
  })
}

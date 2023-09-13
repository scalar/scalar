import { globSync } from 'glob'
import { describe, expect, it } from 'vitest'

import { getFile } from '../../tests/utils'
import { parseSwaggerFile } from './parseSwaggerFile'

globSync('./tests/fixtures/examples/Zoom API.yaml').forEach((file) => {
  it.skip(`parses: ${file}`, () => {
    return new Promise((resolve) => {
      return parseSwaggerFile(getFile(file)).then((result) => {
        expect(result.info.title).toBeDefined()

        Object.keys(result.paths).forEach((path) => {
          const endpoint = result.paths[path]
          const methods = Object.keys(endpoint)

          methods.forEach((method) => {
            const data = endpoint[method]
            console.log(
              'PATH:',
              path,
              method,
              data.responses['200']?.content['application/json']?.schema,
              data.responses['200']?.content['application/json']?.example,
            )
          })
        })

        resolve(null)
      })
    })
  })
})

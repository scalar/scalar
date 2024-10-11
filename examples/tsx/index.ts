import { toJson } from '@scalar/openapi-parser'
import { readFiles } from '@scalar/openapi-parser/plugins/read-files'

console.log(
  toJson({
    foo: 'bar',
  }),
  readFiles,
)

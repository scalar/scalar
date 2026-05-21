import { object, optional, record, string } from '@scalar/validation'

import { openApiServerVariableObject } from './server-variable'

export const openApiServerObject = object(
  {
    url: string({
      typeComment:
        'REQUIRED. A URL to the target host. This URL supports Server Variables and MAY be relative, to indicate that the host location is relative to the location where the document containing the Server Object is being served. Variable substitutions will be made when a variable is named in {braces}.',
    }),
    description: optional(
      string({
        typeComment:
          'An optional string describing the host designated by the URL. CommonMark syntax MAY be used for rich text representation.',
      }),
    ),
    variables: optional(
      record(string(), openApiServerVariableObject, {
        typeComment: `A map between a variable name and its value. The value is used for substitution in the server's URL template.`,
      }),
    ),
  },
  { typeName: 'ServerObject' },
)

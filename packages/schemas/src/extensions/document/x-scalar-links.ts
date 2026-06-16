import { array, object, optional, string } from '@scalar/validation'

import { typeCommentWithExample } from '../type-comment'

const XScalarLinkItem = object(
  {
    name: string({ typeComment: 'The label to display for the link.' }),
    url: string({ typeComment: 'The URL the link points to.' }),
  },
  {
    typeName: 'XScalarLinkItem',
    typeComment: 'A named link to display alongside the API info',
  },
)

export const XScalarLinks = object(
  {
    'x-scalar-links': optional(
      array(XScalarLinkItem, {
        typeComment: 'Additional named links to display alongside the API info (e.g. privacy policy, imprint)',
      }),
    ),
  },
  {
    typeName: 'XScalarLinks',
    typeComment: typeCommentWithExample(
      'Additional named links to display alongside the API info, for example a privacy policy or an imprint. This is handy for the legal texts that some countries require on public websites.',
      {
        language: 'yaml',
        body: `x-scalar-links:
  - name: Privacy Policy
    url: https://example.com/privacy
  - name: Imprint
    url: https://example.com/imprint`,
      },
    ),
  },
)

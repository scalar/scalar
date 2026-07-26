import { array, intersection, object, optional, string } from '@scalar/validation'

import {
  XScalarIsDirty,
  XScalarNavigation,
  XScalarOriginalDocumentHash,
  XScalarOriginalSourceUrl,
  XScalarRegistryMeta,
  XScalarWatchMode,
} from '@/extensions/document'

import { arazzoComponentsObject } from './components'
import { arazzoInfoObject } from './info'
import { arazzoSourceDescriptionObject } from './source-description'
import { arazzoWorkflowObject } from './workflow'

const arazzoExtensions = intersection(
  [
    XScalarNavigation,
    XScalarOriginalSourceUrl,
    XScalarOriginalDocumentHash,
    XScalarIsDirty,
    XScalarWatchMode,
    XScalarRegistryMeta,
  ],
  {
    typeName: 'ArazzoExtensions',
    typeComment: 'Arazzo document-level Scalar extensions shared with workspace tooling.',
  },
)

const arazzoDocumentCore = object(
  {
    arazzo: string({
      typeComment: 'REQUIRED. The version number of the Arazzo Specification that this Arazzo Description uses.',
    }),
    '$self': optional(
      string({
        typeComment:
          'A URI-reference for the Arazzo Description, also serving as its base URI for resolving relative references.',
      }),
    ),
    info: arazzoInfoObject,
    sourceDescriptions: array(arazzoSourceDescriptionObject, {
      typeComment: 'REQUIRED. A list of source descriptions this Arazzo Description applies to.',
    }),
    workflows: array(arazzoWorkflowObject, {
      typeComment: 'REQUIRED. A list of workflows describing the call sequences.',
    }),
    components: optional(arazzoComponentsObject),
  },
  {
    typeName: 'ArazzoDocumentCore',
    typeComment: 'Root Arazzo 1.1.0 document.',
  },
)

/**
 * Root Arazzo 1.1.0 document (the Arazzo Specification Object).
 *
 * @see https://spec.openapis.org/arazzo/latest.html#arazzo-specification-object
 */
export const arazzoObjectSchema = intersection([arazzoDocumentCore, arazzoExtensions], {
  typeName: 'ArazzoObject',
  typeComment: 'Root Arazzo 1.1.0 document including Scalar workspace extensions (ArazzoExtensions).',
})

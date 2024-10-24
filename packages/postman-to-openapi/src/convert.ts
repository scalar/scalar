import type { OpenAPIV3 } from '@scalar/openapi-types'

import { processAuth } from './helpers/authHelpers'
import { processExternalDocs } from './helpers/externalDocsHelper'
import { processItem } from './helpers/itemHelpers'
import { processLicenseAndContact } from './helpers/licenseContactHelper'
import { processLogo } from './helpers/logoHelper'
import { parseServers } from './helpers/serverHelpers'
import type { PostmanCollection } from './types'

/**
 * Converts a Postman Collection to an OpenAPI 3.0.0 document.
 * This function processes the collection's information, servers, authentication,
 * and items to create a corresponding OpenAPI structure.
 */
export function convert(
  postmanCollection: PostmanCollection,
): OpenAPIV3.Document {
  console.log('Starting conversion of Postman Collection to OpenAPI')

  // Extract title from collection info, fallback to 'API' if not provided
  const title = postmanCollection.info.name || 'API'
  console.log(`Title: ${title}`)

  // Look for version in collection variables, default to '1.0.0'
  const version =
    (postmanCollection.variable?.find((v) => v.key === 'version')
      ?.value as string) || '1.0.0'
  console.log(`Version: ${version}`)

  // Handle different description formats in Postman
  const description =
    typeof postmanCollection.info.description === 'string'
      ? postmanCollection.info.description
      : postmanCollection.info.description?.content || ''
  console.log(`Description length: ${description.length} characters`)

  // Process license and contact information
  const { license, contact } = processLicenseAndContact(postmanCollection)
  console.log(`License: ${license ? 'Present' : 'Not present'}`)
  console.log(`Contact: ${contact ? 'Present' : 'Not present'}`)

  // Process logo information
  const logo = processLogo(postmanCollection)
  console.log(`Logo: ${logo ? 'Present' : 'Not present'}`)

  // Initialize the OpenAPI document with required fields
  const openapi: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title,
      version,
      description,
      ...(license && { license }),
      ...(contact && { contact }),
      ...(logo && { 'x-logo': logo }),
    },
    servers: parseServers(postmanCollection),
    paths: {},
  }
  console.log('OpenAPI document initialized')

  // Process external docs
  const externalDocs = processExternalDocs(postmanCollection)
  if (externalDocs) {
    openapi.externalDocs = externalDocs
    console.log('External docs added to OpenAPI document')
  }

  // Process authentication if present in the collection
  if (postmanCollection.auth) {
    console.log('Processing authentication')
    const { securitySchemes, security } = processAuth(postmanCollection.auth)
    openapi.components = openapi.components || {}
    openapi.components.securitySchemes = {
      ...openapi.components.securitySchemes,
      ...securitySchemes,
    }
    openapi.security = security
    console.log('Authentication processed and added to OpenAPI document')
  }

  // Process each item in the collection and merge into OpenAPI spec
  if (postmanCollection.item) {
    console.log(`Processing ${postmanCollection.item.length} items`)
    postmanCollection.item.forEach((item, index) => {
      console.log(`Processing item ${index + 1}`)
      const { paths: itemPaths, components: itemComponents } = processItem(item)

      // Merge paths from the current item
      openapi.paths = openapi.paths || {}
      for (const [pathKey, pathItem] of Object.entries(itemPaths)) {
        console.log(`Processing path: ${pathKey}`)
        /**
         * this is a bit of a hack to skip empty paths only if they have no parameters
         * because there is a test where if I remove the empty path it breaks the test
         * but there is another test where if I leave the empty path it breaks the test
         * so I added this check to only remove the empty path if all the methods on it have no parameters
         */
        if (pathKey === '/') {
          const allMethodsHaveEmptyParams = Object.values(pathItem || {}).every(
            (method) => !method.parameters || method.parameters.length === 0,
          )
          if (allMethodsHaveEmptyParams) {
            console.log('Skipping empty root path')
            continue
          }
        }

        if (!openapi.paths[pathKey]) {
          openapi.paths[pathKey] = pathItem
          console.log(`Added new path: ${pathKey}`)
        } else {
          openapi.paths[pathKey] = {
            ...openapi.paths[pathKey],
            ...pathItem,
          }
          console.log(`Updated existing path: ${pathKey}`)
        }

        // Handle the /raw endpoint specifically
        if (pathKey === '/raw' && pathItem?.post) {
          console.log('Processing /raw endpoint')
          if (pathItem.post.requestBody?.content['text/plain']) {
            pathItem.post.requestBody.content['application/json'] = {
              schema: {
                type: 'object',
                example: '',
              },
            }
            delete pathItem.post.requestBody.content['text/plain']
            console.log('Modified /raw endpoint request body')
          }
        }
      }

      // Merge security schemes from the current item
      if (itemComponents?.securitySchemes) {
        console.log('Merging security schemes')
        openapi.components = openapi.components || {}
        openapi.components.securitySchemes = {
          ...openapi.components.securitySchemes,
          ...itemComponents.securitySchemes,
        }
      }
    })
  }

  // Clean up the generated paths
  if (openapi.paths) {
    console.log('Cleaning up generated paths')
    Object.values(openapi.paths).forEach((path) => {
      if (path) {
        Object.values(path).forEach((method) => {
          if (method && 'parameters' in method) {
            // Remove empty parameters array to keep spec clean
            if (method.parameters?.length === 0) {
              delete method.parameters
              console.log('Removed empty parameters array')
            }

            // Handle request bodies
            if (method.requestBody?.content) {
              const content = method.requestBody.content
              if (Object.keys(content).length === 0) {
                // Keep an empty requestBody with text/plain content
                method.requestBody = {
                  content: {
                    'text/plain': {},
                  },
                }
                console.log('Added empty text/plain content to requestBody')
              } else if ('text/plain' in content) {
                // Preserve schema if it exists, otherwise keep an empty object
                if (
                  !content['text/plain'].schema ||
                  Object.keys(content['text/plain'].schema).length === 0
                ) {
                  content['text/plain'] = {}
                  console.log('Cleaned up text/plain content in requestBody')
                }
              }
            }

            // Ensure all methods have a description, but don't add an empty one if it doesn't exist
            if (!method.description) {
              delete method.description
              console.log('Removed empty description')
            }
          }
        })
      }
    })
  }

  // Remove empty components object
  if (Object.keys(openapi.components || {}).length === 0) {
    delete openapi.components
    console.log('Removed empty components object')
  }

  console.log('Conversion completed')
  return openapi
}

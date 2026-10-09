import type { Plugin } from '@scalar/types/snippetz'

import { collectHeaders, joinUrlAndQuery, normalizeMethod, normalizeUrl } from '@/libs/http'
import { multipartFileBoundary, prepareRequest } from '@/libs/prepare-request'

/**
 * Escapes a string so it can be safely embedded inside an Objective-C `@"..."`
 * string literal.
 */
const objcStringLiteral = (value: string): string => {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

  return `@"${escaped}"`
}

/**
 * Renders a JavaScript value as an Objective-C object literal (NSDictionary,
 * NSArray, NSNumber, ...). When `indentation` is set, nested key/value pairs are
 * aligned under the opening brace for readability.
 */
const literalRepresentation = (value: unknown, indentation?: number): string => {
  const join = indentation === undefined ? ', ' : `,\n   ${' '.repeat(indentation)}`

  switch (Object.prototype.toString.call(value)) {
    case '[object Number]':
      return `@${value}`
    case '[object Array]': {
      const values = (value as unknown[]).map((item) => literalRepresentation(item))
      return `@[ ${values.join(join)} ]`
    }
    case '[object Object]': {
      const entries = Object.entries(value as Record<string, unknown>).map(
        ([key, item]) => `@"${key}": ${literalRepresentation(item)}`,
      )
      return `@{ ${entries.join(join)} }`
    }
    case '[object Boolean]':
      return value ? '@YES' : '@NO'
    default:
      // Map JSON null/undefined to NSNull so NSJSONSerialization emits a real
      // JSON `null` instead of an empty string.
      if (value === null || value === undefined) {
        return '[NSNull null]'
      }
      return objcStringLiteral(value.toString())
  }
}

/**
 * Declares and initializes an Objective-C object literal, for example
 * `NSDictionary *headers = @{ @"a": @"b" };`
 */
const nsDeclaration = (nsClass: string, name: string, value: unknown): string => {
  const opening = `${nsClass} *${name} = `
  return `${opening}${literalRepresentation(value, opening.length)};`
}

/**
 * objc/nsurlsession
 */
export const objcNsurlsession: Plugin = {
  target: 'objc',
  client: 'nsurlsession',
  title: 'NSURLSession',
  generate(request, configuration) {
    if (!request) {
      return ''
    }

    const method = normalizeMethod(request.method)
    const url = normalizeUrl(joinUrlAndQuery(request.url ?? '', request.queryString))
    const multipart =
      request.postData?.mimeType === 'multipart/form-data' && request.postData.params
        ? prepareRequest(request)
        : undefined
    const headers = multipart?.headers ?? collectHeaders(request.headers, request.cookies)

    const boundary = multipartFileBoundary(multipart)
    const literal = (value: string): string =>
      boundary
        ? `[${objcStringLiteral(value)} stringByReplacingOccurrencesOfString:${objcStringLiteral(boundary)} withString:boundary]`
        : objcStringLiteral(value)
    const lines: string[] = ['#import <Foundation/Foundation.h>']
    if (boundary) {
      lines.push('', 'NSString *boundary = [[NSUUID UUID] UUIDString];')
    }

    // Headers (cookies are folded into a single Cookie header by collectHeaders)
    const hasHeaders = headers.length > 0
    if (hasHeaders) {
      const headersObject = Object.fromEntries(headers.map((header) => [header.name, header.value]))
      lines.push('', nsDeclaration('NSDictionary', 'headers', headersObject))
    }

    // Body
    let hasBody = false
    if (request.postData) {
      const { mimeType, text, params } = request.postData

      if (mimeType === 'application/json' && text !== undefined) {
        try {
          const parsed = JSON.parse(text)
          lines.push('', nsDeclaration('NSDictionary', 'parameters', parsed))
          lines.push('', 'NSData *postData = [NSJSONSerialization dataWithJSONObject:parameters options:0 error:nil];')
          hasBody = true
        } catch {
          // Fall back to the raw text when the payload is not valid JSON.
          lines.push('', `NSData *postData = [${objcStringLiteral(text)} dataUsingEncoding:NSUTF8StringEncoding];`)
          hasBody = true
        }
      } else if (mimeType === 'application/x-www-form-urlencoded' && params?.length) {
        hasBody = true
        const [head, ...tail] = params
        lines.push(
          '',
          `NSMutableData *postData = [[NSMutableData alloc] initWithData:[${objcStringLiteral(
            `${encodeURIComponent(head!.name)}=${encodeURIComponent(head!.value ?? '')}`,
          )} dataUsingEncoding:NSUTF8StringEncoding]];`,
        )
        tail.forEach((param) => {
          lines.push(
            `[postData appendData:[${objcStringLiteral(
              `&${encodeURIComponent(param.name)}=${encodeURIComponent(param.value ?? '')}`,
            )} dataUsingEncoding:NSUTF8StringEncoding]];`,
          )
        })
      } else if (mimeType === 'multipart/form-data' && params?.length) {
        hasBody = true
        lines.push('', 'NSMutableData *postData = [NSMutableData data];')
        for (const segment of multipart?.body ?? []) {
          if ('file' in segment) {
            lines.push(`[postData appendData:[NSData dataWithContentsOfFile:${objcStringLiteral(segment.file)}]];`)
          } else {
            lines.push(`[postData appendData:[${literal(segment.text)} dataUsingEncoding:NSUTF8StringEncoding]];`)
          }
        }
      } else if (mimeType === 'application/octet-stream') {
        hasBody = true
        lines.push('', `NSData *postData = [${objcStringLiteral(text ?? '')} dataUsingEncoding:NSUTF8StringEncoding];`)
      } else if (text !== undefined) {
        hasBody = true
        lines.push('', `NSData *postData = [${objcStringLiteral(text)} dataUsingEncoding:NSUTF8StringEncoding];`)
      }
    }

    // Request
    lines.push(
      '',
      `NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:${objcStringLiteral(url)}]`,
      '                                                      cachePolicy:NSURLRequestUseProtocolCachePolicy',
      '                                                  timeoutInterval:10.0];',
      `[request setHTTPMethod:@"${method}"];`,
    )

    if (hasHeaders) {
      lines.push('[request setAllHTTPHeaderFields:headers];')
      if (boundary) {
        lines.push(
          '[request setValue:[@"multipart/form-data; boundary=" stringByAppendingString:boundary] forHTTPHeaderField:@"Content-Type"];',
        )
      }
    }

    if (hasBody) {
      lines.push('[request setHTTPBody:postData];')
    }

    // Basic auth
    if (configuration?.auth?.username && configuration?.auth?.password) {
      const credentials = objcStringLiteral(`${configuration.auth.username}:${configuration.auth.password}`)
      lines.push(
        `NSData *authData = [${credentials} dataUsingEncoding:NSUTF8StringEncoding];`,
        'NSString *authValue = [NSString stringWithFormat:@"Basic %@", [authData base64EncodedStringWithOptions:0]];',
        '[request setValue:authValue forHTTPHeaderField:@"Authorization"];',
      )
    }

    // Session
    lines.push(
      '',
      'NSURLSession *session = [NSURLSession sharedSession];',
      'NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request',
      'completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {',
      '  if (error) {',
      '    NSLog(@"%@", error);',
      '  } else {',
      '    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;',
      '    NSLog(@"%@", httpResponse);',
      '  }',
      '}];',
      '[dataTask resume];',
    )

    return lines.join('\n')
  },
}

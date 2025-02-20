// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Objective-C using NSURLSession.
 *
 * @author
 * @thibaultCha
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js'
import { nsDeclaration } from '../helpers.js'

export const nsurlsession = {
  info: {
    key: 'nsurlsession',
    title: 'NSURLSession',
    link: 'https://developer.apple.com/library/mac/documentation/Foundation/Reference/NSURLSession_class/index.html',
    description: "Foundation's NSURLSession request",
  },
  convert: ({ allHeaders, postData, method, fullUrl }, options) => {
    let _a
    const opts = {
      indent: '    ',
      pretty: true,
      timeout: 10,
      ...options,
    }
    const { push, join, blank } = new CodeBuilder({ indent: opts.indent })
    // Markers for headers to be created as literal objects and later be set on the NSURLRequest if exist
    const req = {
      hasHeaders: false,
      hasBody: false,
    }
    // We just want to make sure people understand that is the only dependency
    push('#import <Foundation/Foundation.h>')
    if (Object.keys(allHeaders).length) {
      req.hasHeaders = true
      blank()
      push(nsDeclaration('NSDictionary', 'headers', allHeaders, opts.pretty))
    }
    if (postData && (postData.text || postData.jsonObj || postData.params)) {
      req.hasBody = true
      switch (postData.mimeType) {
        case 'application/x-www-form-urlencoded':
          if (
            (_a = postData.params) === null || _a === void 0
              ? void 0
              : _a.length
          ) {
            // By appending parameters one by one in the resulting snippet,
            // we make it easier for the user to edit it according to his or her needs after pasting.
            // The user can just add/remove lines adding/removing body parameters.
            blank()
            const [head, ...tail] = postData.params
            push(
              `NSMutableData *postData = [[NSMutableData alloc] initWithData:[@"${head.name}=${head.value}" dataUsingEncoding:NSUTF8StringEncoding]];`,
            )
            tail.forEach(({ name, value }) => {
              push(
                `[postData appendData:[@"&${name}=${value}" dataUsingEncoding:NSUTF8StringEncoding]];`,
              )
            })
          } else {
            req.hasBody = false
          }
          break
        case 'application/json':
          if (postData.jsonObj) {
            push(
              nsDeclaration(
                'NSDictionary',
                'parameters',
                postData.jsonObj,
                opts.pretty,
              ),
            )
            blank()
            push(
              'NSData *postData = [NSJSONSerialization dataWithJSONObject:parameters options:0 error:nil];',
            )
          }
          break
        case 'multipart/form-data':
          // By appending multipart parameters one by one in the resulting snippet,
          // we make it easier for the user to edit it according to his or her needs after pasting.
          // The user can just edit the parameters NSDictionary or put this part of a snippet in a multipart builder method.
          push(
            nsDeclaration(
              'NSArray',
              'parameters',
              postData.params || [],
              opts.pretty,
            ),
          )
          push(`NSString *boundary = @"${postData.boundary}";`)
          blank()
          push('NSError *error;')
          push('NSMutableString *body = [NSMutableString string];')
          push('for (NSDictionary *param in parameters) {')
          push('[body appendFormat:@"--%@\\r\\n", boundary];', 1)
          push('if (param[@"fileName"]) {', 1)
          push(
            '[body appendFormat:@"Content-Disposition:form-data; name=\\"%@\\"; filename=\\"%@\\"\\r\\n", param[@"name"], param[@"fileName"]];',
            2,
          )
          push(
            '[body appendFormat:@"Content-Type: %@\\r\\n\\r\\n", param[@"contentType"]];',
            2,
          )
          push(
            '[body appendFormat:@"%@", [NSString stringWithContentsOfFile:param[@"fileName"] encoding:NSUTF8StringEncoding error:&error]];',
            2,
          )
          push('if (error) {', 2)
          push('NSLog(@"%@", error);', 3)
          push('}', 2)
          push('} else {', 1)
          push(
            '[body appendFormat:@"Content-Disposition:form-data; name=\\"%@\\"\\r\\n\\r\\n", param[@"name"]];',
            2,
          )
          push('[body appendFormat:@"%@", param[@"value"]];', 2)
          push('}', 1)
          push('}')
          push('[body appendFormat:@"\\r\\n--%@--\\r\\n", boundary];')
          push(
            'NSData *postData = [body dataUsingEncoding:NSUTF8StringEncoding];',
          )
          break
        default:
          blank()
          push(
            `NSData *postData = [[NSData alloc] initWithData:[@"${postData.text}" dataUsingEncoding:NSUTF8StringEncoding]];`,
          )
      }
    }
    blank()
    push(
      `NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"${fullUrl}"]`,
    )
    // NSURLRequestUseProtocolCachePolicy is the default policy, let's just always set it to avoid confusion.
    push(
      '                                                       cachePolicy:NSURLRequestUseProtocolCachePolicy',
    )
    push(
      `                                                   timeoutInterval:${opts.timeout.toFixed(1)}];`,
    )
    push(`[request setHTTPMethod:@"${method}"];`)
    if (req.hasHeaders) {
      push('[request setAllHTTPHeaderFields:headers];')
    }
    if (req.hasBody) {
      push('[request setHTTPBody:postData];')
    }
    blank()
    // Retrieving the shared session will be less verbose than creating a new one.
    push('NSURLSession *session = [NSURLSession sharedSession];')
    push(
      'NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request',
    )
    push(
      '                                            completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {',
    )
    push('                                            if (error) {', 1)
    push('                                            NSLog(@"%@", error);', 2)
    push('                                            } else {', 1)
    // Casting the NSURLResponse to NSHTTPURLResponse so the user can see the status     .
    push(
      '                                            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;',
      2,
    )
    push(
      '                                            NSLog(@"%@", httpResponse);',
      2,
    )
    push('                                            }', 1)
    push('                                            }];')
    push('[dataTask resume];')
    return join()
  },
}

import { describe, expect, it } from 'vitest'

import { objcNsurlsession } from './nsurlsession'

describe('objcNsurlsession', () => {
  it('returns an empty string for undefined request', () => {
    const result = objcNsurlsession.generate()

    expect(result).toBe('')
  })

  it('returns a basic request', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
    })

    expect(result).toContain('#import <Foundation/Foundation.h>')
    expect(result).toContain(
      'NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"https://example.com"]',
    )
    expect(result).toContain('[request setHTTPMethod:@"GET"];')
    expect(result).toContain('NSURLSession *session = [NSURLSession sharedSession];')
    expect(result).toContain('[dataTask resume];')
  })

  it('returns a POST request', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toContain('[request setHTTPMethod:@"POST"];')
  })

  it('has headers', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
    })

    expect(result).toContain('NSDictionary *headers = @{ @"Content-Type": @"application/json" };')
    expect(result).toContain('[request setAllHTTPHeaderFields:headers];')
  })

  it('does not add empty headers', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).not.toContain('NSDictionary *headers')
    expect(result).not.toContain('[request setAllHTTPHeaderFields:headers];')
  })

  it('has JSON body', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toContain('NSDictionary *parameters = @{ @"hello": @"world" };')
    expect(result).toContain(
      'NSData *postData = [NSJSONSerialization dataWithJSONObject:parameters options:0 error:nil];',
    )
    expect(result).toContain('[request setHTTPBody:postData];')
  })

  it('falls back to raw text when JSON payload is invalid', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"hello":',
      },
    })

    expect(result).toContain('NSData *postData = [@"{\\"hello\\":" dataUsingEncoding:NSUTF8StringEncoding];')
    expect(result).not.toContain('NSJSONSerialization')
  })

  it('has query string', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toContain('[NSURL URLWithString:@"https://example.com?foo=bar&bar=foo"]')
  })

  it('has cookies', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toContain('@"Cookie": @"foo=bar; bar=foo"')
  })

  it('does not add empty cookies', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).not.toContain('Cookie')
  })

  it('adds basic auth credentials', () => {
    const result = objcNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toContain('NSData *authData = [@"user:pass" dataUsingEncoding:NSUTF8StringEncoding];')
    expect(result).toContain('[request setValue:authValue forHTTPHeaderField:@"Authorization"];')
  })

  it('omits auth when not provided', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
    })

    expect(result).not.toContain('authValue')
    expect(result).not.toContain('Authorization')
  })

  it('omits auth when username is missing', () => {
    const result = objcNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: '',
          password: 'pass',
        },
      },
    )

    expect(result).not.toContain('authValue')
  })

  it('omits auth when password is missing', () => {
    const result = objcNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: '',
        },
      },
    )

    expect(result).not.toContain('authValue')
  })

  it('handles special characters in auth credentials', () => {
    const result = objcNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user@example.com',
          password: 'pass:word!',
        },
      },
    )

    expect(result).toContain(
      'NSData *authData = [@"user@example.com:pass:word!" dataUsingEncoding:NSUTF8StringEncoding];',
    )
  })

  it('handles undefined auth object', () => {
    const result = objcNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).not.toContain('Authorization')
  })

  it('handles multipart form data with files', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
          },
          {
            name: 'field',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toContain('NSString *boundary = @"---011000010111000001101001";')
    expect(result).toContain('@"name": @"file"')
    expect(result).toContain('@"fileName": @"test.txt"')
    expect(result).toContain('@"value": @"value"')
    expect(result).toContain('NSData *postData = [body dataUsingEncoding:NSUTF8StringEncoding];')
  })

  it('handles multipart form data content types on string parts', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'user',
            value: '{"name":"scalar"}',
            contentType: 'application/json;charset=utf-8',
          },
        ],
      },
    })

    expect(result).toContain('@"contentType": @"application/json;charset=utf-8"')
  })

  it('handles multipart form data content types on files', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
            contentType: 'text/plain',
          },
        ],
      },
    })

    expect(result).toContain('@"contentType": @"text/plain"')
  })

  it('handles multipart form data with empty file names', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: '',
          },
        ],
      },
    })

    expect(result).toContain('@"fileName": @""')
  })

  it('falls back to text body for multipart without params', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        text: 'fallback payload',
      },
    })

    expect(result).toContain('NSData *postData = [@"fallback payload" dataUsingEncoding:NSUTF8StringEncoding];')
    expect(result).not.toContain('NSString *boundary')
  })

  it('handles url-encoded form data with special characters', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'special chars!@#',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toContain(
      'NSMutableData *postData = [[NSMutableData alloc] initWithData:[@"special%20chars!%40%23=value" dataUsingEncoding:NSUTF8StringEncoding]];',
    )
  })

  it('appends multiple url-encoded form parameters', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'foo', value: 'bar' },
          { name: 'baz', value: 'qux' },
        ],
      },
    })

    expect(result).toContain(
      'NSMutableData *postData = [[NSMutableData alloc] initWithData:[@"foo=bar" dataUsingEncoding:NSUTF8StringEncoding]];',
    )
    expect(result).toContain('[postData appendData:[@"&baz=qux" dataUsingEncoding:NSUTF8StringEncoding]];')
  })

  it('handles binary data', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toContain('NSData *postData = [@"binary content" dataUsingEncoding:NSUTF8StringEncoding];')
  })

  it('handles compressed response headers', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toContain('@"Accept-Encoding": @"gzip, deflate"')
  })

  it('handles special characters in URL', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toContain('path%20with%20spaces')
  })

  it('handles special characters in query parameters', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello%20world%20%26%20more',
        },
        {
          name: 'special',
          value: '!%40%23%24%25%5E%26*()',
        },
      ],
    })

    expect(result).toContain(
      '[NSURL URLWithString:@"https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()"]',
    )
  })

  it('handles empty URL', () => {
    const result = objcNsurlsession.generate({
      url: '',
    })

    expect(result).toContain('[NSURL URLWithString:@""]')
  })

  it('handles extremely long URLs', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toContain(`[NSURL URLWithString:@"https://example.com/${'a'.repeat(2000)}"]`)
  })

  it('keeps the last value for multiple headers with the same name', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toContain('@"X-Custom": @"value2"')
    expect(result).not.toContain('value1')
  })

  it('handles headers with empty values', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toContain('@"X-Empty": @""')
  })

  it('handles JSON body with nested structures', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          nested: {
            array: [1, 2, 3],
            object: { foo: 'bar' },
          },
          simple: 'value',
        }),
      },
    })

    expect(result).toContain('@"array": @[ @1,')
    expect(result).toContain('@"object": @{ @"foo": @"bar" }')
    expect(result).toContain('@"simple": @"value"')
  })

  it('escapes double quotes in JSON string values', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          key: '"quotes" and \\backslashes\\',
        }),
      },
    })

    expect(result).toContain('@"key": @"\\"quotes\\" and \\\\backslashes\\\\"')
  })

  it('renders null JSON values as NSNull', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({ value: null }),
      },
    })

    expect(result).toContain('@"value": [NSNull null]')
  })

  it('handles cookies with special characters', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toContain('@"Cookie": @"special%3Bcookie=value%20with%20spaces"')
  })

  it('handles URLs with dollar sign characters', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toContain('[NSURL URLWithString:@"https://example.com/path$with$dollars"]')
  })

  it('appends query string to URLs that already include query parameters', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com/api?foo=bar',
      queryString: [{ name: 'baz', value: 'qux' }],
    })

    expect(result).toContain('[NSURL URLWithString:@"https://example.com/api?foo=bar&baz=qux"]')
  })

  it('supports raw text bodies for unknown body types', () => {
    const result = objcNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'text/plain',
        text: 'hello',
      },
    })

    expect(result).toContain('NSData *postData = [@"hello" dataUsingEncoding:NSUTF8StringEncoding];')
  })

  it('combines auth, headers, cookies and body', () => {
    const result = objcNsurlsession.generate(
      {
        url: 'https://example.com',
        method: 'POST',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        cookies: [{ name: 'session', value: 'abc123' }],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify({ hello: 'world' }),
        },
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toContain('@"Content-Type": @"application/json"')
    expect(result).toContain('@"Cookie": @"session=abc123"')
    expect(result).toContain('NSData *authData = [@"user:pass" dataUsingEncoding:NSUTF8StringEncoding];')
    expect(result).toContain('NSDictionary *parameters = @{ @"hello": @"world" };')
  })
})

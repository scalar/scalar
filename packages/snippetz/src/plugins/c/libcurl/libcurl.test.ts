import { describe, expect, it } from 'vitest'

import { cLibcurl } from './libcurl'

describe('cLibcurl', () => {
  it('returns a basic request', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('returns a POST request', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "POST");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('has headers', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

struct curl_slist *headers = NULL;
headers = curl_slist_append(headers, "Content-Type: application/json");
curl_easy_setopt(hnd, CURLOPT_HTTPHEADER, headers);

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles multipart form data with files', () => {
    const result = cLibcurl.generate({
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

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "POST");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

curl_mime *mime = curl_mime_init(hnd);

{
  curl_mimepart *part = curl_mime_addpart(mime);
  curl_mime_name(part, "file");
  curl_mime_filedata(part, "test.txt");
}

{
  curl_mimepart *part = curl_mime_addpart(mime);
  curl_mime_name(part, "field");
  curl_mime_data(part, "value", CURL_ZERO_TERMINATED);
}

curl_easy_setopt(hnd, CURLOPT_MIMEPOST, mime);

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles url-encoded form data with special characters', () => {
    const result = cLibcurl.generate({
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

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "POST");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

curl_easy_setopt(hnd, CURLOPT_POSTFIELDS, "special+chars%21%40%23=value");

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles binary data', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "POST");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

curl_easy_setopt(hnd, CURLOPT_POSTFIELDS, "binary content");

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles special characters in URL', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com/path%20with%20spaces/[brackets]");

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles multiple headers with same name', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

struct curl_slist *headers = NULL;
headers = curl_slist_append(headers, "X-Custom: value2");
curl_easy_setopt(hnd, CURLOPT_HTTPHEADER, headers);

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles headers with empty values', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com");

struct curl_slist *headers = NULL;
headers = curl_slist_append(headers, "X-Empty;");
curl_easy_setopt(hnd, CURLOPT_HTTPHEADER, headers);

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })

  it('handles query string parameters', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      `CURL *hnd = curl_easy_init();

curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "GET");
curl_easy_setopt(hnd, CURLOPT_URL, "https://example.com/api?param1=value1&param2=special%20value&param3=123");

CURLcode ret = curl_easy_perform(hnd);`,
    )
  })
})

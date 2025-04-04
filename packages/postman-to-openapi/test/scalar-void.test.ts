import { describe, expect, it } from 'vitest'
import { convert } from '../src/convert'
import scalarVoidCollection from './scalar-void.json'

describe('convert', () => {
  it('converts the Scalar Void Postman collection to an OpenAPI document', () => {
    const result = convert(scalarVoidCollection)

    expect(result).toMatchObject({
      'openapi': '3.1.0',
      'info': {
        'title': 'Scalar Void',
        'version': '1.0.0',
      },
      'servers': [
        {
          'url': 'https://void.scalar.com',
        },
      ],
      'paths': {
        '/': {
          'get': {
            'summary': 'Basic GET Request',
            'x-post-response': `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Body matches string", function () {
    pm.expect(pm.response.text()).to.include("GET");
});

pm.test("Your test name", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.method).to.eql("GET");
});

pm.test("Body is correct", function () {
    pm.response.to.have.body("foobar");
});

pm.test("Content-Type is present", function () {
    pm.response.to.have.header("Content-Type");
});

pm.test("Response time is less than 200ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});

pm.test("Successful POST request", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202]);
});

pm.test("Status code name has string", function () {
    pm.response.to.have.status("OK");
});`,
          },
        },
        '/404': {
          'get': {
            'summary': '404 Error',
          },
        },
        '/download.zip': {
          'get': {
            'summary': 'Download a ZIP',
          },
        },
      },
    })

    // console.log(JSON.stringify(result, null, 2))
  })
})

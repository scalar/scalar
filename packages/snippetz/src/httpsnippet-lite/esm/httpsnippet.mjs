import { Blob, FormData } from 'formdata-node';
import { formDataIterator, isBlob } from "./helpers/form-data.mjs";
import { getHeaderName } from "./helpers/headers.mjs";
import { reducer } from "./helpers/reducer.mjs";
import { ExtendedURL, toSearchParams } from "./helpers/url.mjs";
import { targets } from "./targets/targets.mjs";
export { CodeBuilder } from "./helpers/code-builder.mjs";
export { availableTargets, extname } from "./helpers/utils.mjs";
export { isClient, isTarget } from "./targets/targets.mjs";
export { addTarget, addTargetClient, isValidTargetId } from "./targets/targets.mjs";
function basename(value) {
    const parts = value.split('/');
    return parts[parts.length - 1];
}
const isHarEntry = (value) => typeof value === 'object' &&
    'log' in value &&
    typeof value.log === 'object' &&
    'entries' in value.log &&
    Array.isArray(value.log.entries);
export class HTTPSnippet {
    constructor(input) {
        let entries = [];
        // is it har?
        if (isHarEntry(input)) {
            entries = input.log.entries;
        }
        else {
            entries = [
                {
                    request: input,
                },
            ];
        }
        this.requests = Promise.all(entries.map(({ request }) => {
            var _a;
            // add optional properties to make validation successful
            const req = {
                bodySize: 0,
                headersSize: 0,
                headers: [],
                cookies: [],
                httpVersion: 'HTTP/1.1',
                queryString: [],
                postData: {
                    mimeType: ((_a = request.postData) === null || _a === void 0 ? void 0 : _a.mimeType) || 'application/octet-stream',
                },
                ...request,
            };
            return this.prepare(req);
        }));
    }
    async prepare(harRequest) {
        var _a, _b, _c, _d;
        const request = {
            ...harRequest,
            fullUrl: '',
            queryObj: {},
            headersObj: {},
            cookiesObj: {},
            allHeaders: {},
        };
        // construct query objects
        if (request.queryString && request.queryString.length) {
            request.queryObj = request.queryString.reduce(reducer, {});
        }
        // construct headers objects
        if (request.headers && request.headers.length) {
            const http2VersionRegex = /^HTTP\/2/;
            request.headersObj = request.headers.reduce((accumulator, { name, value }) => {
                const headerName = http2VersionRegex.exec(request.httpVersion)
                    ? name.toLocaleLowerCase()
                    : name;
                return {
                    ...accumulator,
                    [headerName]: value,
                };
            }, {});
        }
        // construct headers objects
        if (request.cookies && request.cookies.length) {
            request.cookiesObj = request.cookies.reduceRight((accumulator, { name, value }) => ({
                ...accumulator,
                [name]: value,
            }), {});
        }
        // construct Cookie header
        const cookies = (_a = request.cookies) === null || _a === void 0 ? void 0 : _a.map(({ name, value }) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
        if (cookies === null || cookies === void 0 ? void 0 : cookies.length) {
            request.allHeaders.cookie = cookies.join('; ');
        }
        switch ((_b = request.postData) === null || _b === void 0 ? void 0 : _b.mimeType) {
            case 'multipart/mixed':
            case 'multipart/related':
            case 'multipart/form-data':
            case 'multipart/alternative':
                // reset values
                request.postData.text = '';
                request.postData.mimeType = 'multipart/form-data';
                if ((_c = request.postData) === null || _c === void 0 ? void 0 : _c.params) {
                    const form = new FormData();
                    // TODO: THIS ABSOLUTELY MUST BE REMOVED.
                    // IT BREAKS SOME USE-CASES FOR MULTIPART FORMS THAT DEPEND ON BEING ABLE TO SET THE BOUNDARY.
                    // easter egg
                    const boundary = '---011000010111000001101001'; // this is binary for "api". yep.
                    (_d = request.postData) === null || _d === void 0 ? void 0 : _d.params.forEach(param => {
                        const name = param.name;
                        const value = param.value || '';
                        const filename = param.fileName;
                        if (isBlob(value)) {
                            form.append(name, value, filename);
                        }
                        else {
                            form.append(name, new Blob([value], { type: param.contentType }), filename ? basename(filename) : filename);
                        }
                    });
                    const { postData } = request;
                    for await (const data of formDataIterator(form, boundary)) {
                        postData.text += data;
                    }
                    request.postData.boundary = boundary;
                    // Since headers are case-sensitive we need to see if there's an existing `Content-Type` header that we can override.
                    const contentTypeHeader = getHeaderName(request.headersObj, 'content-type') || 'content-type';
                    request.headersObj[contentTypeHeader] = `multipart/form-data; boundary=${boundary}`;
                }
                break;
            case 'application/x-www-form-urlencoded':
                if (!request.postData.params) {
                    request.postData.text = '';
                }
                else {
                    request.postData.paramsObj = request.postData.params.reduce(reducer, {});
                    // always overwrite
                    request.postData.text = toSearchParams(request.postData.paramsObj).toString();
                }
                break;
            case 'text/json':
            case 'text/x-json':
            case 'application/json':
            case 'application/x-json':
                request.postData.mimeType = 'application/json';
                if (request.postData.text) {
                    try {
                        request.postData.jsonObj = JSON.parse(request.postData.text);
                    }
                    catch (e) {
                        // force back to `text/plain` if headers have proper content-type value, then this should also work
                        request.postData.mimeType = 'text/plain';
                    }
                }
                break;
        }
        // create allHeaders object
        const allHeaders = {
            ...request.allHeaders,
            ...request.headersObj,
        };
        const url = new URL(request.url);
        const query = Object.fromEntries(url.searchParams);
        // query string key/value pairs in with literal querystrings contained within the url
        request.queryObj = {
            ...request.queryObj,
            ...query,
        }; //?
        const search = toSearchParams(request.queryObj);
        const fullUrl = new URL(request.url);
        fullUrl.search = search.toString();
        url.search = '';
        return {
            ...request,
            allHeaders,
            fullUrl: fullUrl.toString(),
            url: url.toString(),
            uriObj: new ExtendedURL(fullUrl.toString()),
        };
    }
    async convert(targetId, clientId, options) {
        if (!options && clientId) {
            options = clientId;
        }
        const target = targets[targetId];
        if (!target) {
            return null;
        }
        const { convert } = target.clientsById[clientId || target.info.default];
        const results = (await this.requests).map(request => convert(request, options));
        return results.length === 1 ? results[0] : results;
    }
}

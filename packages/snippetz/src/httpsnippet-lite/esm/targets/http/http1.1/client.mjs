/**
 * @description
 * HTTP code snippet generator to generate raw HTTP/1.1 request strings,
 * in accordance to the RFC 7230 (and RFC 7231) specifications.
 *
 * @author
 * @irvinlim
 *
 * For any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from "../../../helpers/code-builder.mjs";
const CRLF = '\r\n';
/**
 * Request follows the request message format in accordance to RFC 7230, Section 3.
 * Each section is prepended with the RFC and section number.
 * See more at https://tools.ietf.org/html/rfc7230#section-3.
 */
export const http11 = {
    info: {
        key: 'http1.1',
        title: 'HTTP/1.1',
        link: 'https://tools.ietf.org/html/rfc7230',
        description: 'HTTP/1.1 request string in accordance with RFC 7230',
    },
    convert: ({ method, fullUrl, uriObj, httpVersion, allHeaders, postData }, options) => {
        const opts = {
            absoluteURI: false,
            autoContentLength: true,
            autoHost: true,
            ...options,
        };
        // RFC 7230 Section 3. Message Format
        // All lines have no indentation, and should be terminated with CRLF.
        const { blank, push, join } = new CodeBuilder({ indent: '', join: CRLF });
        // RFC 7230 Section 5.3. Request Target
        // Determines if the Request-Line should use 'absolute-form' or 'origin-form'.
        // Basically it means whether the "http://domain.com" will prepend the full url.
        const requestUrl = opts.absoluteURI ? fullUrl : uriObj.path;
        // RFC 7230 Section 3.1.1. Request-Line
        push(`${method} ${requestUrl} ${httpVersion}`);
        const headerKeys = Object.keys(allHeaders);
        // RFC 7231 Section 5. Header Fields
        headerKeys.forEach(key => {
            // Capitalize header keys, even though it's not required by the spec.
            const keyCapitalized = key.toLowerCase().replace(/(^|-)(\w)/g, input => input.toUpperCase());
            push(`${keyCapitalized}: ${allHeaders[key]}`);
        });
        // RFC 7230 Section 5.4. Host
        // Automatically set Host header if option is on and on header already exists.
        if (opts.autoHost && !headerKeys.includes('host')) {
            push(`Host: ${uriObj.host}`);
        }
        // RFC 7230 Section 3.3.3. Message Body Length
        // Automatically set Content-Length header if option is on, postData is present and no header already exists.
        if (opts.autoContentLength && (postData === null || postData === void 0 ? void 0 : postData.text) && !headerKeys.includes('content-length')) {
            push(`Content-Length: ${postData.text.length}`);
        }
        // Add extra line after header section.
        blank();
        // Separate header section and message body section.
        const headerSection = join();
        // RFC 7230 Section 3.3. Message Body
        const messageBody = (postData === null || postData === void 0 ? void 0 : postData.text) || '';
        // RFC 7230 Section 3. Message Format
        // Extra CRLF separating the headers from the body.
        return `${headerSection}${CRLF}${messageBody}`;
    },
};

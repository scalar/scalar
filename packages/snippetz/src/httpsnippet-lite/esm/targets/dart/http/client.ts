// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * @description
 * HTTP code snippet generator for Dart using Http.
 *
 * @author
 * @Hamidrzash
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */
import { CodeBuilder } from '../../../helpers/code-builder.js';
import { escapeForDoubleQuotes } from '../../../helpers/escape.js';
export const http = {
    info: {
        key: 'http',
        title: 'Http',
        link: 'https://pub.dev/packages/http/',
        description: 'A composable, Future-based library for making HTTP requests.',
    },
    convert: ({ postData, fullUrl, method, allHeaders }, options) => {
        const opts = {
            indent: '  ',
            ...options,
        };
        const { blank, join, push } = new CodeBuilder({ indent: opts.indent });
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
        const methodsWithBody = ['POST', 'PUT', 'DELETE', 'PATCH'];

        push("import 'package:http/http.dart' as http;");
        blank();
        push("void main() async {");

        if (postData?.text) {
            push(`final body = ${JSON.stringify(postData.text)};`,1);
            blank();
        }

        push('final headers = <String,String>{',1);
        Object.keys(allHeaders).forEach((key) => {
            push(`"${key}": "${escapeForDoubleQuotes(allHeaders[key])}",`, 2);
        });
        push('};',1);
        blank();

        if (methodsWithBody.includes(method.toUpperCase())) {
            if (postData?.text) {
                push(`final response = await http.${method.toLowerCase()}(Uri.parse("${fullUrl}"), headers: headers, body: body);`,1);
            } else {
                push(`final response = await http.${method.toLowerCase()}(Uri.parse("${fullUrl}"), headers: headers);`,1);
            }
        push('print(response.body);',1);
        } else if (methods.includes(method.toUpperCase())) {
            push(`final response = await http.${method.toLowerCase()}(Uri.parse("${fullUrl}"), headers: headers);`,1);
            push('print(response.body);',1);
        } else {
            push(`throw UnsupportedError("Unsupported HTTP method: ${method.toUpperCase()}");`,1);
        }
        push("}");


        return join();
    },
};

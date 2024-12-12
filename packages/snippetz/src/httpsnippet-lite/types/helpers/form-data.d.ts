/**
 * @license https://raw.githubusercontent.com/node-fetch/node-fetch/master/LICENSE.md
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 - 2020 Node Fetch Team
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Extracted from https://github.com/node-fetch/node-fetch/blob/64c5c296a0250b852010746c76144cb9e14698d9/src/utils/form-data.js
 */
import type { FormData } from 'formdata-node'

export declare const isBlob: (object: any) => boolean
export declare const formDataIterator: (
  form: FormData,
  boundary: string,
) => AsyncGenerator<string, void, unknown>

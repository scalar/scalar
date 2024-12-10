import { axios } from "./axios/client.mjs";
import { fetch } from "./fetch/client.mjs";
import { native } from "./native/client.mjs";
import { request } from "./request/client.mjs";
import { unirest } from "./unirest/client.mjs";
export const node = {
    info: {
        key: 'node',
        title: 'Node.js',
        extname: '.js',
        default: 'native',
    },
    clientsById: {
        native,
        request,
        unirest,
        axios,
        fetch,
    },
};

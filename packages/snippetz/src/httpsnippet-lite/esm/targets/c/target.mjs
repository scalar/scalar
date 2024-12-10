import { libcurl } from "./libcurl/client.mjs";
export const c = {
    info: {
        key: 'c',
        title: 'C',
        extname: '.c',
        default: 'libcurl',
    },
    clientsById: {
        libcurl,
    },
};

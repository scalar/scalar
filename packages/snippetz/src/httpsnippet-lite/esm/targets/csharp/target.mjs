import { httpclient } from "./httpclient/client.mjs";
import { restsharp } from "./restsharp/client.mjs";
export const csharp = {
    info: {
        key: 'csharp',
        title: 'C#',
        extname: '.cs',
        default: 'restsharp',
    },
    clientsById: {
        httpclient,
        restsharp,
    },
};

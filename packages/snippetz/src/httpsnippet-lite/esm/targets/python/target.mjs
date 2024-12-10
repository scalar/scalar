import { python3 } from "./python3/client.mjs";
import { requests } from "./requests/client.mjs";
export const python = {
    info: {
        key: 'python',
        title: 'Python',
        extname: '.py',
        default: 'python3',
    },
    clientsById: {
        python3,
        requests,
    },
};

import { native } from "./native/client.mjs";
export const ruby = {
    info: {
        key: 'ruby',
        title: 'Ruby',
        extname: '.rb',
        default: 'native',
    },
    clientsById: {
        native,
    },
};

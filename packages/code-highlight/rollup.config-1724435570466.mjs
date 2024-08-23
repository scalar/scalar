import { findEntryPoints, createRollupConfig } from '@scalar/build-tooling';

const options = {
    input: await findEntryPoints({ allowCss: true }),
    ...createRollupConfig({
        typescript: true,
        copy: [{ src: './src/css', dest: 'dist' }],
    }),
};

export { options as default };

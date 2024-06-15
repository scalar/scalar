import { createRollupConfig, findEntryPoints } from '@scalar/build-tooling';

var rollup_config = createRollupConfig({
    typescript: true,
    options: {
        input: await findEntryPoints({ allowCss: false }),
    },
});

export { rollup_config as default };

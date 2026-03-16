import { bench, describe } from "vite-plus/test";

import specification from "./examples/petstore.json";
import { resolveNew } from "./utils/resolveNew";
import { resolveOld } from "./utils/resolveOld";

describe("petstore", () => {
  bench("@apidevtools/swagger-parser", async () => {
    // Action!
    await resolveOld(specification);
  });

  bench("@scalar/openapi-parser", () => {
    // Action!
    resolveNew(specification);
  });
});

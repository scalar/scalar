import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import missingPathItemRef from "./missingPathItemRef.yaml?raw";

describe.todo("missingPathItemRef", () => {
  it("returns an error", async () => {
    const result = await validate(missingPathItemRef);

    // TODO: Swagger Editor
    //
    // * Resolver error at paths./test.$ref
    // Could not resolve reference: undefined undefined
    expect(result.errors?.[0]?.message).toBe("something something test");
    expect(result.errors?.length).toBe(1);
    expect(result.valid).toBe(false);
  });
});

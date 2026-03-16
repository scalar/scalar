import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import deprecated3 from "./deprecated3.yaml?raw";

describe.todo("deprecated3", () => {
  it("returns an error", async () => {
    const result = await validate(deprecated3);

    expect(result.errors?.[0]?.message).toBe("something something deprecated");
    expect(result.errors?.length).toBe(1);
    expect(result.valid).toBe(false);
  });
});

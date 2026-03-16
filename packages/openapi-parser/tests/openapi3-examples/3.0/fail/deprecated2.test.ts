import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import deprecated2 from "./deprecated2.yaml?raw";

describe.todo("deprecated2", () => {
  it("returns an error", async () => {
    const result = await validate(deprecated2);

    expect(result.errors?.[0]?.message).toBe("something something deprecated");
    expect(result.errors?.length).toBe(1);
    expect(result.valid).toBe(false);
  });
});

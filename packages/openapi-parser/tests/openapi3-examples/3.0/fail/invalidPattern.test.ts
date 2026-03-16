import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import invalidPattern from "./invalidPattern.yaml?raw";

describe("invalidPattern", () => {
  it("returns an error", async () => {
    const result = await validate(invalidPattern);

    expect(result.errors?.[0]?.message).toBe(
      'format must match format "regex"',
    );
    expect(result.errors?.length).toBe(1);
    expect(result.valid).toBe(false);
  });
});

import { describe, expect, it } from "vite-plus/test";

import { validate } from "../../../../src/index";
import schemaProperties from "./schemaProperties.yaml?raw";

describe("schemaProperties", () => {
  it("returns an error", async () => {
    const { valid, errors, schema } = await validate(schemaProperties);

    expect(schema?.components?.schemas?.SomeObject).not.toBe(undefined);

    expect(errors).not.toBe(undefined);
    expect(errors).not.toStrictEqual([]);
    expect(errors[0]?.message).toBe(
      "Can't resolve external reference: ../resources/myobject.yml",
    );
    expect(errors.length).toBe(1);
    expect(valid).toBe(false);
  });
});

import { describe, expect, it } from "vite-plus/test";

import { parseJsonOrYaml } from "@/helpers/parse";
import baseDefinition from "@/spec-extentions/x-scalar-environments.yaml?raw";

import { xScalarEnvironmentsSchema } from "./x-scalar-environments";

describe("x-scalar-environments", () => {
  it("Handles spec definition", () => {
    const parsed = parseJsonOrYaml(baseDefinition);

    expect(
      xScalarEnvironmentsSchema.parse(parsed["x-scalar-environments"]),
    ).toEqual(parsed["x-scalar-environments"]);
  });
});

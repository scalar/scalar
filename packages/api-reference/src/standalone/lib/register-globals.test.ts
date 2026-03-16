import { describe, expect, it } from "vite-plus/test";

import { createApiReference } from "./html-api";
import { registerGlobals } from "./register-globals";

describe("registerGlobals", () => {
  it("registers the createApiReference method on the global window", () => {
    expect(window.Scalar).toBeUndefined();
    registerGlobals();

    expect(window.Scalar).toBeDefined();
    expect(window.Scalar.createApiReference).toStrictEqual(createApiReference);
    expect(window.Scalar.createApiReference("#something", {})).toBeDefined();
  });
});

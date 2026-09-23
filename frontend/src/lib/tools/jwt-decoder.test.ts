import { describe, expect, it } from "vitest";
import { decodeJwt } from "./jwt-decoder";

// header: {"alg":"HS256","typ":"JWT"} payload: {"sub":"123","name":"Tom"}
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiVG9tIn0.sig-part";

describe("decodeJwt", () => {
  it("decodes header and payload", () => {
    const decoded = decodeJwt(TOKEN);
    expect(decoded.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(decoded.payload).toEqual({ sub: "123", name: "Tom" });
    expect(decoded.signature).toBeTypeOf("string");
  });

  it("supports unsigned 2-part tokens", () => {
    const decoded = decodeJwt("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0");
    expect(decoded.header).toEqual({ alg: "HS256" });
    expect(decoded.signature).toBeNull();
  });

  it("rejects tokens without dots", () => {
    expect(() => decodeJwt("not-a-jwt")).toThrow("JWT");
  });

  it("rejects malformed base64url", () => {
    expect(() => decodeJwt("!!!.!!!")).toThrow("Base64URL");
  });

  it("rejects non-JSON payload", () => {
    // "e30" is base64url of "{}" — use a segment that decodes but is not JSON
    const notJson = btoa("hello world").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(() => decodeJwt(`eyJhbGciOiJIUzI1NiJ9.${notJson}`)).toThrow("JSON");
  });
});

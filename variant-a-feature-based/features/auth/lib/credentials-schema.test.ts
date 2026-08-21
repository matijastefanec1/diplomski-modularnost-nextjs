import { describe, it, expect } from "vitest";

import { credentialsSchema } from "./credentials-schema";

describe("credentialsSchema", () => {
  it("accepts an e-mail and a password", () => {
    const result = credentialsSchema.safeParse({
      email: " ana@mail.com ",
      password: "lozinka1",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "ana@mail.com",
      password: "lozinka1",
    });
  });

  it("rejects missing or empty credentials", () => {
    expect(credentialsSchema.safeParse({}).success).toBe(false);
    expect(
      credentialsSchema.safeParse({ email: "   ", password: "lozinka1" })
        .success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({ email: "ana@mail.com", password: "" })
        .success,
    ).toBe(false);
  });

  it("does not normalize the password", () => {
    const result = credentialsSchema.safeParse({
      email: "ana@mail.com",
      password: "  Lozinka1  ",
    });

    expect(result.data?.password).toBe("  Lozinka1  ");
  });
});

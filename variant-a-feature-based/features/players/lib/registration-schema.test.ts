import { describe, it, expect } from "vitest";

import {
  EMAIL_INVALID_MESSAGE,
  EMAIL_TOO_LONG_MESSAGE,
  NAME_MESSAGE,
  PASSWORD_COMPOSITION_MESSAGE,
  PASSWORD_LENGTH_MESSAGE,
  PASSWORD_MISMATCH_MESSAGE,
  registrationSchema,
  toRegistrationFieldErrors,
  type RegistrationField,
} from "./registration-schema";

const validInput = {
  name: "Ana Anić",
  email: "ana@mail.com",
  password: "lozinka1",
  passwordConfirmation: "lozinka1",
};

function errorsFor(input: Record<string, unknown>) {
  const result = registrationSchema.safeParse(input);

  if (result.success) {
    return {} as Partial<Record<RegistrationField, string>>;
  }

  return toRegistrationFieldErrors(result.error.issues);
}

describe("registrationSchema", () => {
  it("accepts valid input and returns normalized values", () => {
    const result = registrationSchema.safeParse({
      ...validInput,
      name: "  Ana   Anić ",
      email: " Ana.Anic@Mail.COM ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Ana Anić",
      email: "ana.anic@mail.com",
      password: "lozinka1",
      passwordConfirmation: "lozinka1",
    });
  });

  it("validates the name after normalization", () => {
    expect(errorsFor({ ...validInput, name: " A " }).name).toBe(NAME_MESSAGE);
    expect(errorsFor({ ...validInput, name: "A".repeat(81) }).name).toBe(
      NAME_MESSAGE,
    );
    expect(errorsFor({ ...validInput, name: `  ${"A".repeat(80)}  ` }).name)
      .toBeUndefined();
  });

  it("rejects a malformed e-mail", () => {
    expect(errorsFor({ ...validInput, email: "ana(at)mail.com" }).email).toBe(
      EMAIL_INVALID_MESSAGE,
    );
  });

  it("rejects an e-mail longer than 254 characters", () => {
    const local = "a".repeat(246);

    expect(errorsFor({ ...validInput, email: `${local}@mail.com` }).email)
      .toBe(EMAIL_TOO_LONG_MESSAGE);
  });

  it("rejects passwords outside the 8 to 64 character range", () => {
    expect(errorsFor({ ...validInput, password: "lozin1" }).password).toBe(
      PASSWORD_LENGTH_MESSAGE,
    );
    expect(
      errorsFor({ ...validInput, password: `${"a".repeat(64)}1` }).password,
    ).toBe(PASSWORD_LENGTH_MESSAGE);
  });

  it("requires at least one letter and one digit", () => {
    expect(errorsFor({ ...validInput, password: "lozinkaa" }).password).toBe(
      PASSWORD_COMPOSITION_MESSAGE,
    );
    expect(errorsFor({ ...validInput, password: "12345678" }).password).toBe(
      PASSWORD_COMPOSITION_MESSAGE,
    );
  });

  it("does not normalize the password", () => {
    const password = "  lozinka1  ";
    const result = registrationSchema.safeParse({
      ...validInput,
      password,
      passwordConfirmation: password,
    });

    expect(result.success).toBe(true);
    expect(result.data?.password).toBe(password);
  });

  it("the confirmation must match the password", () => {
    expect(
      errorsFor({ ...validInput, passwordConfirmation: "lozinka2" })
        .passwordConfirmation,
    ).toBe(PASSWORD_MISMATCH_MESSAGE);
  });

  it("reports missing fields with the contracted messages", () => {
    expect(errorsFor({})).toEqual({
      name: NAME_MESSAGE,
      email: EMAIL_INVALID_MESSAGE,
      password: PASSWORD_LENGTH_MESSAGE,
      passwordConfirmation: PASSWORD_MISMATCH_MESSAGE,
    });
  });
});

describe("toRegistrationFieldErrors", () => {
  it("keeps the first issue per field and ignores unknown paths", () => {
    expect(
      toRegistrationFieldErrors([
        { path: ["password"], message: "prva" },
        { path: ["password"], message: "druga" },
        { path: ["nepoznato"], message: "ignorirano" },
        { path: [], message: "bez polja" },
      ]),
    ).toEqual({ password: "prva" });
  });
});

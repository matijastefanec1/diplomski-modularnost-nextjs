import { z } from "zod";

import { normalizeEmail, normalizeName } from "@/src/application/normalization";

export const NAME_MESSAGE = "Ime mora imati od 2 do 80 znakova.";
export const EMAIL_INVALID_MESSAGE = "Unesite valjanu e-mail adresu.";
export const EMAIL_TOO_LONG_MESSAGE = "E-mail adresa smije imati najviše 254 znaka.";
export const EMAIL_TAKEN_MESSAGE = "Igrač s ovom e-mail adresom već postoji.";
export const PASSWORD_LENGTH_MESSAGE = "Lozinka mora imati od 8 do 64 znaka.";
export const PASSWORD_COMPOSITION_MESSAGE = "Lozinka mora sadržavati barem jedno slovo i jednu znamenku.";
export const PASSWORD_MISMATCH_MESSAGE = "Lozinke se ne podudaraju.";

const nameField = z
  .string({ error: NAME_MESSAGE })
  .transform(normalizeName)
  .pipe(
    z
      .string()
      .min(2, { error: NAME_MESSAGE })
      .max(80, { error: NAME_MESSAGE }),
  );

const emailField = z
  .string({ error: EMAIL_INVALID_MESSAGE })
  .transform(normalizeEmail)
  .pipe(
    z
      .email({ error: EMAIL_INVALID_MESSAGE })
      .max(254, { error: EMAIL_TOO_LONG_MESSAGE }),
  );

const passwordField = z
  .string({ error: PASSWORD_LENGTH_MESSAGE })
  .min(8, { error: PASSWORD_LENGTH_MESSAGE })
  .max(64, { error: PASSWORD_LENGTH_MESSAGE })
  .refine((value) => /\p{L}/u.test(value) && /\d/u.test(value), {
    error: PASSWORD_COMPOSITION_MESSAGE,
  });

export const registrationSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    passwordConfirmation: z.string({ error: PASSWORD_MISMATCH_MESSAGE }),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    error: PASSWORD_MISMATCH_MESSAGE,
    path: ["passwordConfirmation"],
  });

export type RegistrationField =
  | "name"
  | "email"
  | "password"
  | "passwordConfirmation";

export type RegistrationFormState = {
  errors: Partial<Record<RegistrationField, string>>;
  values: {
    name: string;
    email: string;
  };
};

const registrationFields: readonly RegistrationField[] = [
  "name",
  "email",
  "password",
  "passwordConfirmation",
];

type ValidationIssue = {
  readonly path: readonly PropertyKey[];
  readonly message: string;
};

function isRegistrationField(
  value: PropertyKey | undefined,
): value is RegistrationField {
  return (
    typeof value === "string" &&
    (registrationFields as readonly string[]).includes(value)
  );
}

export function toRegistrationFieldErrors(
  issues: readonly ValidationIssue[],
): RegistrationFormState["errors"] {
  const errors: RegistrationFormState["errors"] = {};

  for (const issue of issues) {
    const [field] = issue.path;

    if (isRegistrationField(field) && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

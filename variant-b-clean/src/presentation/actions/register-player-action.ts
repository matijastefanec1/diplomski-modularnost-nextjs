"use server";

import { registerPlayer, signIn } from "@/src/composition-root";

import { playerProfilePath } from "../routes";
import {
  EMAIL_TAKEN_MESSAGE,
  registrationSchema,
  toRegistrationFieldErrors,
  type RegistrationFormState,
} from "../validation/registration-schema";

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function registerPlayerAction(
  _previousState: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  const values = {
    name: asText(formData.get("name")),
    email: asText(formData.get("email")),
  };

  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return { errors: toRegistrationFieldErrors(parsed.error.issues), values };
  }

  const { name, email, password } = parsed.data;
  const result = await registerPlayer.execute({ name, email, password });

  if (result.status === "email-taken") {
    return { errors: { email: EMAIL_TAKEN_MESSAGE }, values };
  }

  await signIn({
    email,
    password,
    redirectTo: playerProfilePath(result.player.id),
  });

  return { errors: {}, values };
}

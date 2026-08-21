"use server";

import { AuthError } from "next-auth";

import { signIn } from "../lib/auth-config";
import { resolveCallbackUrl } from "../lib/callback-url";
import {
  credentialsSchema,
  type SignInFormState,
  SIGN_IN_FAILED_MESSAGE,
} from "../lib/credentials-schema";

export async function signInAction(
  _previousState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const submittedEmail = formData.get("email");
  const email = typeof submittedEmail === "string" ? submittedEmail : "";

  const parsed = credentialsSchema.safeParse({
    email: submittedEmail,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: SIGN_IN_FAILED_MESSAGE, email };
  }

  const redirectTo =
    resolveCallbackUrl(formData.get("callbackUrl")) ?? "/sign-in";

  try {
    await signIn("credentials", { ...parsed.data, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: SIGN_IN_FAILED_MESSAGE, email };
    }

    throw error;
  }

  return { error: null, email };
}

"use server";

import { signIn } from "@/src/composition-root";

import { resolveCallbackUrl } from "../routes";
import {
  credentialsSchema,
  type SignInFormState,
  SIGN_IN_FAILED_MESSAGE,
} from "../validation/credentials-schema";

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

  const signedIn = await signIn({ ...parsed.data, redirectTo });

  return signedIn
    ? { error: null, email }
    : { error: SIGN_IN_FAILED_MESSAGE, email };
}

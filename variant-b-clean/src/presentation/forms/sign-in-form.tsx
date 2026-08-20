"use client";

import { useActionState, type ReactElement } from "react";

import { signInAction } from "../actions/sign-in-action";
import type { SignInFormState } from "../validation/credentials-schema";
import { TextField } from "../ui/text-field";
import { SubmitButton } from "../ui/submit-button";

const initialState: SignInFormState = { error: null, email: "" };

type SignInFormProps = {
  callbackUrl?: string;
};

export function SignInForm({ callbackUrl }: SignInFormProps): ReactElement {
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <form
      data-testid="sign-in-form"
      action={formAction}
      noValidate
      className="flex max-w-md flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card"
    >
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}

      <TextField
        id="email"
        name="email"
        label="E-mail adresa"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
      />

      <TextField
        id="password"
        name="password"
        label="Lozinka"
        type="password"
        autoComplete="current-password"
      />

      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <SubmitButton label="Prijavi se" pending={pending} />
    </form>
  );
}

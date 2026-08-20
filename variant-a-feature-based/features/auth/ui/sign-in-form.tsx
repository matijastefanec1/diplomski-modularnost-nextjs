"use client";

import { useActionState, type ReactElement } from "react";

import { SubmitButton } from "@/shared/ui/submit-button";
import { TextField } from "@/shared/ui/text-field";

import { signInAction } from "../actions/sign-in-action";
import type { SignInFormState } from "../lib/credentials-schema";

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

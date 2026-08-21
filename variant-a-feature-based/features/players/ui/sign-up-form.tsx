"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/shared/ui/submit-button";
import { TextField } from "@/shared/ui/text-field";

import { registerPlayerAction } from "../actions/register-player-action";
import type { RegistrationFormState } from "../lib/registration-schema";

const initialState: RegistrationFormState = {
  errors: {},
  values: { name: "", email: "" },
};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    registerPlayerAction,
    initialState,
  );

  return (
    <form
      data-testid="sign-up-form"
      action={formAction}
      noValidate
      className="flex max-w-md flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card"
    >
      <TextField
        id="name"
        name="name"
        label="Ime"
        type="text"
        autoComplete="name"
        defaultValue={state.values.name}
        error={state.errors.name}
      />

      <TextField
        id="email"
        name="email"
        label="E-mail adresa"
        type="email"
        autoComplete="email"
        defaultValue={state.values.email}
        error={state.errors.email}
      />

      <TextField
        id="password"
        name="password"
        label="Lozinka"
        type="password"
        autoComplete="new-password"
        description="Najmanje 8 znakova, barem jedno slovo i jedna znamenka."
        error={state.errors.password}
      />

      <TextField
        id="passwordConfirmation"
        name="passwordConfirmation"
        label="Potvrda lozinke"
        type="password"
        autoComplete="new-password"
        error={state.errors.passwordConfirmation}
      />

      <SubmitButton label="Registriraj se" pending={pending} />
    </form>
  );
}

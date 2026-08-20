import Link from "next/link";

import { SignUpForm } from "../forms/sign-up-form";

export function SignUpPage() {
  return (
    <div data-testid="sign-up-page" className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-page-title font-semibold tracking-tight">
          Registracija
        </h1>
        <p className="max-w-2xl text-text-secondary">
          Otvori račun i kreni skupljati bodove.
        </p>
      </section>

      <SignUpForm />

      <p className="text-sm text-text-secondary">
        Već imaš račun?{" "}
        <Link href="/sign-in" className="font-medium text-primary underline">
          Prijavi se
        </Link>
      </p>
    </div>
  );
}

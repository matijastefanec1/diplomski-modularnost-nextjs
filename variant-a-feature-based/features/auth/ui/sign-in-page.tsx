import Link from "next/link";

import { SignInForm } from "./sign-in-form";

type SignInPageProps = {
  callbackUrl?: string;
};

export function SignInPage({ callbackUrl }: SignInPageProps) {
  return (
    <div data-testid="sign-in-page" className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-page-title font-semibold tracking-tight">
          Prijava
        </h1>
        <p className="max-w-2xl text-text-secondary">
          Prijavi se e-mail adresom i lozinkom.
        </p>
      </section>

      <SignInForm callbackUrl={callbackUrl} />

      <p className="text-sm text-text-secondary">
        Nemaš račun?{" "}
        <Link href="/sign-up" className="font-medium text-primary underline">
          Registriraj se
        </Link>
      </p>
    </div>
  );
}

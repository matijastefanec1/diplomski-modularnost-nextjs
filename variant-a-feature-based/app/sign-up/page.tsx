import { redirectIfSignedIn } from "@/features/auth";
import { SignUpPage } from "@/features/players";

export default async function SignUpRoute() {
  await redirectIfSignedIn();

  return <SignUpPage />;
}

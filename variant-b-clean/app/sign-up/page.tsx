import { SignUpPage } from "@/src/presentation/pages/sign-up-page";
import { redirectIfSignedIn } from "@/src/presentation/session/current-player";

export default async function SignUpRoute() {
  await redirectIfSignedIn();

  return <SignUpPage />;
}

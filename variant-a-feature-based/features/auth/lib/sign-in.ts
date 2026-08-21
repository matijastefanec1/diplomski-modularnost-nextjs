import { signIn } from "./auth-config";

export type SignInPlayerInput = {
  email: string;
  password: string;
  redirectTo: string;
};

export async function signInPlayer(input: SignInPlayerInput): Promise<void> {
  await signIn("credentials", input);
}

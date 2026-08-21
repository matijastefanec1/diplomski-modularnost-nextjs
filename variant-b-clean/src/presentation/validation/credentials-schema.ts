import { z } from "zod";

export const SIGN_IN_FAILED_MESSAGE = "Neispravna e-mail adresa ili lozinka.";

export const credentialsSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export type SignInFormState = {
  error: string | null;
  email: string;
};

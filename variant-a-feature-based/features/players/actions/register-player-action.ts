"use server";

import { hash } from "bcryptjs";

import { signInPlayer } from "@/features/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/lib/prisma";

import {
  EMAIL_TAKEN_MESSAGE,
  registrationSchema,
  toRegistrationFieldErrors,
  type RegistrationFormState,
} from "../lib/registration-schema";
import { playerProfilePath } from "../lib/routes";

const PASSWORD_HASH_ROUNDS = 12;
const UNIQUE_CONSTRAINT_CODE = "P2002";

// zauzet email hvata se kao greška baze, a kod prevodi grešku u poruku za polje
function isEmailTaken(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_CODE
  );
}

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function registerPlayerAction(
  _previousState: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  const values = {
    name: asText(formData.get("name")),
    email: asText(formData.get("email")),
  };

  const parsed = registrationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    return { errors: toRegistrationFieldErrors(parsed.error.issues), values };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);

  let playerId: string;

  try {
    // početnih 1000 bodova dolazi iz sheme, ne iz koda!
    const player = await prisma.player.create({
      data: { name, email, passwordHash },
      select: { id: true },
    });

    playerId = player.id;
  } catch (error) {
    if (isEmailTaken(error)) {
      return { errors: { email: EMAIL_TAKEN_MESSAGE }, values };
    }

    throw error;
  }

  // redirect radi tako da baca, u try bloku bi ga catch progutao
  await signInPlayer({
    email,
    password,
    redirectTo: playerProfilePath(playerId),
  });

  return { errors: {}, values };
}

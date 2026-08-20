import { compare, hash } from "bcryptjs";

import type { PasswordHasher } from "@/src/application/ports/password-hasher";

const PASSWORD_HASH_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, PASSWORD_HASH_ROUNDS);
  }

  verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return compare(plainPassword, passwordHash);
  }
}

export class EmailAlreadyTakenError extends Error {
  constructor() {
    super("A player with this e-mail address already exists.");
    this.name = "EmailAlreadyTakenError";
  }
}

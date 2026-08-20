import type { Clock } from "@/src/application/ports/clock";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

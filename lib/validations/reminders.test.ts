import { describe, expect, it } from "vitest";
import { ReminderGenerationSchema, ReminderPreferencesSchema } from "@/lib/validations/reminders";

describe("ReminderPreferencesSchema", () => {
  it("parses a valid preferences payload", () => {
    const parsed = ReminderPreferencesSchema.parse({
      organizationId: "11111111-1111-4111-8111-111111111111",
      patientId: "22222222-2222-4222-8222-222222222222",
      allowSms: true,
      allowEmail: false,
      allowVoice: true,
      allowPush: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "06:00"
    });

    expect(parsed.allowSms).toBe(true);
    expect(parsed.allowEmail).toBe(false);
  });

  it("rejects invalid UUIDs and malformed times", () => {
    const result = ReminderPreferencesSchema.safeParse({
      organizationId: "bad-id",
      patientId: "also-bad",
      quietHoursStart: "2200"
    });

    expect(result.success).toBe(false);
  });
});

describe("ReminderGenerationSchema", () => {
  it("accepts valid appointment id", () => {
    const result = ReminderGenerationSchema.safeParse({
      appointmentId: "33333333-3333-4333-8333-333333333333"
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing appointment id", () => {
    const result = ReminderGenerationSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

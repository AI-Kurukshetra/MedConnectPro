import { describe, expect, it } from "vitest";
import { hasValidAppointmentRange, isAppointmentStatus } from "@/lib/validations/appointment";

describe("appointment validation", () => {
  it("accepts valid appointment statuses", () => {
    expect(isAppointmentStatus("scheduled")).toBe(true);
    expect(isAppointmentStatus("confirmed")).toBe(true);
    expect(isAppointmentStatus("cancelled")).toBe(true);
    expect(isAppointmentStatus("completed")).toBe(true);
    expect(isAppointmentStatus("no_show")).toBe(true);
  });

  it("rejects invalid appointment statuses", () => {
    expect(isAppointmentStatus("draft")).toBe(false);
    expect(isAppointmentStatus("rescheduled")).toBe(false);
  });

  it("validates appointment time ranges", () => {
    expect(hasValidAppointmentRange("2026-03-14T10:00:00.000Z", "2026-03-14T10:30:00.000Z")).toBe(true);
    expect(hasValidAppointmentRange("2026-03-14T10:30:00.000Z", "2026-03-14T10:00:00.000Z")).toBe(false);
    expect(hasValidAppointmentRange("invalid", "2026-03-14T10:00:00.000Z")).toBe(false);
  });
});

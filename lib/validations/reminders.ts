import { z } from "zod";

export const ReminderChannelSchema = z.enum(["in_app", "sms", "email", "voice", "push"]);

export const ReminderPreferencesSchema = z.object({
  organizationId: z.uuid(),
  patientId: z.uuid(),
  allowSms: z.boolean().default(true),
  allowEmail: z.boolean().default(true),
  allowVoice: z.boolean().default(false),
  allowPush: z.boolean().default(false),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional()
});

export const ReminderGenerationSchema = z.object({
  appointmentId: z.uuid()
});

export type ReminderPreferencesInput = z.infer<typeof ReminderPreferencesSchema>;
export type ReminderGenerationInput = z.infer<typeof ReminderGenerationSchema>;

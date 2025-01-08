import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Custom Zod type for Firestore Timestamp
const timestampSchema = z.custom<Timestamp>((val) => val instanceof Timestamp);
const dateSchema = z.union([
  timestampSchema,
  z.date(),
  z.string()
]);

export const AppointmentSchema = z.object({
  service: z.string(),
  barberUID: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  telNo: z.string(),
  appDay: dateSchema,
  appStartTime: dateSchema,
  appEndTime: dateSchema,
  isExtra: z.boolean()
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const AppointmentDocSchema = z.object({
  id: z.string(),
  product: z.string(),
  isChecked: z.boolean(),
  service: z.string(),
  appDetails: AppointmentSchema
});

export type AppointmentDoc = z.infer<typeof AppointmentDocSchema>;
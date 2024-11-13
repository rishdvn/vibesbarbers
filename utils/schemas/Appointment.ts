import { z } from 'zod';

export const AppointmentSchema= z.object({
  service: z.string(),
  barberUID: z.string(),
  firstname: z.string(),
  telNo: z.string(),
  appDay: z.string(),
  appStartTime: z.string(),
  appEndTime: z.string(),
  isExtra: z.boolean()
});

export type Appointment = z.infer<typeof AppointmentSchema>;
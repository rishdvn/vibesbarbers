import { z } from 'zod';
import { AppointmentSchema } from './Appointment';
import { RosterSchema } from './Roster';

export const FormSchema = z.object({
  service: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  barber: z.any().nullable(),
  dates: z.array(z.any()),
  telNo: z.string(),
  selectedDay: z.date().nullable(),
  avaliableTimes: z.array(z.object({
    start: z.date(),
    end: z.date()
  })),
  selectedTime: z.object({
    start: z.date().nullable(),
    end: z.date().nullable()
  }),
  appointmentsAlreadyBooked: z.array(AppointmentSchema), // Assuming Appointment type is defined elsewhere
  roster: z.array(RosterSchema) // Assuming Roster type is defined elsewhere
});

export type Form = z.infer<typeof FormSchema>;

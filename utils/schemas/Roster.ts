import { z } from 'zod';
const { Timestamp } = require('firebase/firestore');

const TimeSchema = z.object({
  hour: z.string(),
  min: z.string(),
  period: z.string()
});

const DaySchema = z.object({
  isValid: z.boolean(),
  isWorking: z.boolean(),
  start_time: TimeSchema,
  end_time: TimeSchema
});

export const RosterSchema = z.object({
  selectedTimes: z.object({
    start: z.union([z.instanceof(Timestamp), z.instanceof(Date)]),
    end: z.union([z.instanceof(Timestamp), z.instanceof(Date)]),
    monday: DaySchema,
    tuesday: DaySchema,
    wednesday: DaySchema,
    thursday: DaySchema,
    friday: DaySchema,
    saturday: DaySchema,
    sunday: DaySchema
  }),
  uid: z.string()
});

export type Roster = z.infer<typeof RosterSchema>;

export type RosterCollection = { [key: string]: Roster };
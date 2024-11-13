import { z } from 'zod';

export const UserSchema = z.object({
  color: z.string(),
  approved: z.boolean(),
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  role: z.enum(['Admin', 'Barber', 'User']), // Assuming 'Admin' and 'Barber' are roles, added 'User' as a common role
  uid: z.string()
});

export type User = z.infer<typeof UserSchema>;

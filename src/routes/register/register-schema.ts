import * as z from 'zod';

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, { message: 'Name should be a string' }),
    email: z.string().email({ message: 'Invalid email' }),
    password: z
      .string()
      .trim()
      .min(1, { message: 'Password is required' })
      .min(8, { message: 'Password should have at least 8 characters' })
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' }),
    confirmPassword: z.string().trim().min(1, { message: 'Confirm password is required' })
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "passwords don't match",
    path: ['confirmPassword']
  });

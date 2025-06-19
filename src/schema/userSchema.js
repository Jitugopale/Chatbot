import { z } from "zod";

export const userSchema = z.object({
  name : z.string(),
     mobileNo: z
    .string()
    .length(10, { message: "Mobile number must be exactly 10 digits" })
    .regex(/^\d+$/, { message: "Mobile number must be numeric" }),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

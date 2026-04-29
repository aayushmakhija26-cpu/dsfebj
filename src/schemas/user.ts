import { z } from "zod";
import { emailSchema, phoneSchema } from "./common";

export const UserTypeSchema = z.enum(["Applicant", "Staff"]);

export const createUserSchema = z.object({
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  userType: UserTypeSchema,
});

export const userIdentitySchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  userType: UserTypeSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  lastLoginAt: z.date().optional(),
});

export const updateUserSchema = z.object({
  phoneNumber: phoneSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UserType = z.infer<typeof UserTypeSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UserIdentity = z.infer<typeof userIdentitySchema>;

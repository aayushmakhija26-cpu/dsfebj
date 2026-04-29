import { z } from "zod";

// E.164 phone number format
export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g. +919876543210)");

export const emailSchema = z.string().email("Invalid email address").toLowerCase();

export const uuidSchema = z.string().uuid("Invalid UUID");

// Marker used in Zod schemas to indicate a field is stored encrypted in the DB;
// at the schema layer the value is always plaintext (encryption happens in the repo layer).
export const encryptedFieldSchema = z.string().min(1, "Field must not be empty");

export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((val) => val.from <= val.to, {
    message: "Start date must not be after end date",
    path: ["from"],
  });

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export type Phone = z.infer<typeof phoneSchema>;
export type Email = z.infer<typeof emailSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

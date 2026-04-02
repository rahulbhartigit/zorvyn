import { z } from "zod";

const RecordTypeEnum = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
const CurrencyEnum = z.enum(["USD", "EUR", "INR"]);

export const createRecordSchema = z.object({
  type: RecordTypeEnum,
  amount: z.number().positive("Amount must be a positive number"),
  currency: CurrencyEnum.optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export const updateRecordSchema = z.object({
  amount: z.number().positive("Amount must be a positive number").optional(),
  type: RecordTypeEnum.optional(),
  category: z.string().min(1).optional(),
  recordDate: z.string().datetime({ message: "Invalid date format" }).optional(),
  description: z.string().optional(),
});

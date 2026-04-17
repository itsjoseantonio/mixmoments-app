import { z } from 'zod';

export const PurchaseSchema = z.object({ id: z.string() }).nullable();

export const CheckoutResponseSchema = z.object({
  url: z.string().url().optional(),
  error: z.string().optional(),
});

export const PaymentReturnSchema = z.object({
  payment: z.enum(['success', 'cancelled']).optional(),
});

import { z } from 'zod'

const verifyIapReceiptSchema = z.object({
  body: z.object({
    planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid plan ID format'),
    platform: z.enum(['android', 'ios']),
    productId: z.string().min(1, 'Product ID is required'),
    transactionId: z.string().min(1, 'Transaction ID is required'),
    purchaseToken: z.string().optional(),
    receiptData: z.string().optional(),
    isSandbox: z.boolean().optional(),
  }),
})

export const iapValidation = {
  verifyIapReceipt: verifyIapReceiptSchema,
}

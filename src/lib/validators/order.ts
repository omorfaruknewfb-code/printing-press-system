import { z } from "zod";

export const orderItemInputSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative"),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const orderInputSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerMobile: z.string().min(6, "Enter a valid mobile number"),
  customerAddress: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1, "Add at least one item"),
  advance: z.coerce.number().min(0, "Advance cannot be negative"),
  totalCosting: z.coerce.number().min(0).optional(),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  assignedToId: z.string().optional().nullable(),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "READY_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;

export const costingInputSchema = z.object({
  orderDbId: z.string().min(1),
  totalCosting: z.coerce.number().min(0, "Costing cannot be negative"),
});
export type CostingInput = z.infer<typeof costingInputSchema>;

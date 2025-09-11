import { z } from "zod";

// Schema for API validation (expects numbers)
export const calculationSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  shop_name: z.string().min(1, "Shop name is required"),
  qty: z.number().positive("Quantity must be positive"),
  rmb_price: z.number().min(0, "RMB price must be non-negative"),
  cmb_rs: z.number().min(0, "CBM rate must be non-negative"),
  extra_tax: z.number().min(0, "Extra tax must be non-negative"),
});

export type CalculationFormData = z.infer<typeof calculationSchema>;

// Extended type for database storage
export interface CalculationRecord extends CalculationFormData {
  id?: string;
  rmb_amount: number;
  lkr_amount: number;
  cbm_amount: number;
  cbm_lkr: number;
  final_value: number;
  exchange_rate: number;
  created_at: string;
}

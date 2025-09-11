import { z } from "zod";

// Schema for API validation (expects numbers)
export const calculationSchema = z.object({
  shop_name: z.string().min(1, "Shop name is required"),
  qty: z.number().min(0.01, "Quantity must be greater than 0"),
  rmb_price: z.number().min(0, "RMB price must be positive"),
  cmb_rs: z.number().min(0, "CBM rate must be positive"),
  extra_tax: z.number().min(0, "Extra tax must be positive"),
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
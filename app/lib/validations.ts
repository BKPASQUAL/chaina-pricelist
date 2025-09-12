// lib/validations.ts - Updated validation schema
import { z } from "zod";

// Schema for API validation (expects numbers and shop_id instead of shop_name)
export const calculationSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  shop_id: z.string().min(1, "Shop selection is required"), // Changed from shop_name to shop_id
  qty: z.number().positive("Quantity must be positive"),
  rmb_price: z.number().min(0, "RMB price must be non-negative"),
  cmb_rate: z.number().min(0, "CBM rate must be non-negative"),
  cmb_amount: z.number().min(0, "CBM amount must be non-negative"),
  extra_tax: z.number().min(0, "Extra tax must be non-negative"),
});

export type CalculationFormData = z.infer<typeof calculationSchema>;

// Extended type for database storage
export interface CalculationRecord extends CalculationFormData {
  id?: string;
  rmb_amount: number;
  lkr_amount: number;
  cmb_value: number;
  final_value: number;
  unit_price: number;
  exchange_rate: number;
  created_at: string;
}

export type Shop = {
  id: string;
  shop_name: string;
  created_at: string;
};

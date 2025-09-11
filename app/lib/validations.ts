import { z } from "zod";

export const calculationSchema = z.object({
  shop_name: z.string().min(1, "Shop name is required"),
  qty: z.number().min(1, "Quantity must be at least 1"),
  rmb_price: z.number().min(0, "RMB price must be positive"),
  cmb_rs: z.number().min(0, "CMB Rs must be positive"),
  extra_tax: z.number().min(0, "Extra tax must be positive"),
});

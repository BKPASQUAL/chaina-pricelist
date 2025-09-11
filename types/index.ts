export interface Calculation {
  id?: string;
  shop_name: string;
  qty: number;
  rmb_price: number;
  rmb_amount: number;
  cmb_rs: number;
  extra_tax: number;
  final_value: number;
  created_at?: string;
}

export interface CalculationFormData {
  shop_name: string;
  qty: number;
  rmb_price: number;
  cmb_rs: number;
  extra_tax: number;
}

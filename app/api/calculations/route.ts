import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { calculationSchema } from "@/app/lib/validations";

// Define shop distribution interface
interface ShopDistribution {
  shop_name: string;
  qty: number;
  shop_final_value: number;
  shop_unit_price: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = calculationSchema.parse(body);

    // Get exchange rate from body or fetch current rate
    const exchangeRate = body.exchange_rate || 42.1; // Default fallback

    // Calculate values following the NEW calculation flow:
    // Step 1: Qty × RMB Price = RMB Amount
    const rmb_amount = validatedData.qty * validatedData.rmb_price;

    // Step 2: RMB Amount × Exchange Rate = LKR Amount
    const lkr_amount = rmb_amount * exchangeRate;

    // Step 3: CBM Rate × CBM Amount = CMB Value (NEW FORMULA)
    const cmb_value = validatedData.cmb_rate * validatedData.cmb_amount;

    // Step 4: Final Value = LKR Amount + CMB Value + Extra Tax (NEW FORMULA)
    const final_value = lkr_amount + cmb_value + validatedData.extra_tax;

    // Step 5: Unit Price = Final Value ÷ Quantity
    const unit_price =
      validatedData.qty > 0 ? final_value / validatedData.qty : 0;

    // Extract shop distribution data if provided
    const shop_distribution: ShopDistribution[] = body.shop_distribution || [];

    const calculationData = {
      ...validatedData,
      rmb_amount,
      lkr_amount,
      cmb_value, // Store the calculated CMB value
      final_value,
      unit_price,
      exchange_rate: exchangeRate,
      shop_distribution:
        shop_distribution.length > 0 ? JSON.stringify(shop_distribution) : null,
      created_at: new Date().toISOString(),
    };

    // Save to Supabase
    const { data, error } = await supabase
      .from("calculations")
      .insert([calculationData])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save calculation" },
        { status: 500 }
      );
    }

    // Parse shop_distribution back to object for response
    if (data.shop_distribution) {
      data.shop_distribution = JSON.parse(data.shop_distribution);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch calculations" },
        { status: 500 }
      );
    }

    // Parse shop_distribution from JSON string to object for all records
    const processedData = data.map((record) => ({
      ...record,
      shop_distribution: record.shop_distribution
        ? JSON.parse(record.shop_distribution)
        : null,
    }));

    return NextResponse.json(processedData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calculations" },
      { status: 500 }
    );
  }
}

// Optional: Add endpoint to fetch current exchange rate
export async function PATCH() {
  try {
    const response = await fetch(
      "https://api.exchangerate.host/latest?base=CNY&symbols=LKR"
    );
    const data = await response.json();

    if (data.success && data.rates.LKR) {
      return NextResponse.json({
        rate: data.rates.LKR,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error("Failed to fetch exchange rate");
    }
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rate", rate: 42.1 }, // Fallback rate
      { status: 500 }
    );
  }
}
